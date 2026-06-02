const crypto = require('crypto');
const axios = require('axios');
const nodemailer = require('nodemailer');
const { onRequest } = require('firebase-functions/v2/https');
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { defineSecret, defineString } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const menuCatalog = require('./menu-catalog');

const SMTP_HOST = defineString('SMTP_HOST', { default: 'smtp.gmail.com' });
const SMTP_PORT = defineString('SMTP_PORT', { default: '587' });
const SMTP_SECURE = defineString('SMTP_SECURE', { default: 'false' });
const SMTP_USER = defineSecret('SMTP_USER');
const SMTP_PASS = defineSecret('SMTP_PASS');
const SMTP_FROM = defineSecret('SMTP_FROM');
const NOTIFICATION_RECIPIENT = defineSecret('NOTIFICATION_RECIPIENT');
const ARKESEL_API_KEY = defineSecret('ARKESEL_API_KEY');
const ARKESEL_SENDER = defineString('ARKESEL_SENDER', { default: 'Workshop ws' });
const ARKESEL_OTP_URL = defineString('ARKESEL_OTP_URL', { default: 'https://sms.arkesel.com/api/otp/generate' });
const ARKESEL_OTP_VERIFY_URL = defineString('ARKESEL_OTP_VERIFY_URL', { default: 'https://sms.arkesel.com/api/otp/verify' });
const ARKESEL_OTP_TEMPLATE = defineString('ARKESEL_OTP_TEMPLATE', {
  default: 'Your Luban Workshop verification code is %otp_code%. It expires in %expiry% minutes.'
});
const PUBLIC_SITE_URL = defineString('PUBLIC_SITE_URL', { default: 'https://lubanrestaurant.com' });
const TURNSTILE_VERIFY_URL = defineString('TURNSTILE_VERIFY_URL', {
  default: 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
});
const RESERVATION_LINK_SECRET = defineSecret('RESERVATION_LINK_SECRET');
const EVENT_HASH_SALT = defineSecret('EVENT_HASH_SALT');
const TURNSTILE_SECRET_KEY = defineSecret('TURNSTILE_SECRET_KEY');

const DEFAULT_TURNSTILE_TEST_SECRET = '1x0000000000000000000000000000000AA';
const RESERVATION_LINK_TTL_MS = 1000 * 60 * 60 * 24 * 45;
const RESERVATION_ACCESS_TTL_MS = 1000 * 60 * 15;
const ORDER_CANCEL_WINDOW_MS = 1000 * 60 * 5;
const DUPLICATE_ORDER_WINDOW_MS = 1000 * 60 * 3;

function getAdmin() {
  const admin = require('firebase-admin');
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  return admin;
}

function db() {
  return getAdmin().firestore();
}

function serverTimestamp() {
  return getAdmin().firestore.FieldValue.serverTimestamp();
}

function deleteField() {
  return getAdmin().firestore.FieldValue.delete();
}

function incrementField(value) {
  return getAdmin().firestore.FieldValue.increment(value);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function cleanPlainText(value) {
  return String(value ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanSubjectLine(value, fallback = 'Assistant report') {
  const subject = cleanPlainText(value || fallback);
  if (!subject) return fallback;
  return subject.length > 96 ? `${subject.slice(0, 93)}...` : subject;
}

function cleanLimitedText(value, maxLength) {
  return cleanPlainText(value).slice(0, maxLength);
}

function normalizePhoneNumber(phone) {
  const digits = String(phone || '').replace(/[^\d+]/g, '');
  if (!digits) return '';
  if (/^\+233\d{9}$/.test(digits)) return digits;
  if (/^233\d{9}$/.test(digits)) return `+${digits}`;
  if (/^0\d{9}$/.test(digits)) return `+233${digits.slice(1)}`;
  return '';
}

function normalizeArkeselNumber(phone) {
  const normalized = normalizePhoneNumber(phone);
  return normalized ? normalized.slice(1) : '';
}

function normalizeEmail(email) {
  const value = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return '';
  return value;
}

function maskPhone(phone) {
  const value = normalizePhoneNumber(phone) || String(phone || '').trim();
  if (!value) return '';
  return `${value.slice(0, 4)}••••••${value.slice(-3)}`;
}

function maskEmail(email) {
  const value = normalizeEmail(email);
  const parts = value.split('@');
  if (parts.length !== 2) return value;
  const local = parts[0];
  return `${local.slice(0, 2)}•••@${parts[1]}`;
}

function formatMoney(value) {
  return `₵${Number(value || 0).toFixed(2)}`;
}

function getArkeselApiKey() {
  return String(ARKESEL_API_KEY.value() || process.env.ARKESEL_API_KEY || '').trim();
}

function getClientIp(req) {
  const forwarded = String(req.get('x-forwarded-for') || '').split(',')[0].trim();
  return forwarded || req.ip || '';
}

function canUseLocalTurnstileSecret(req) {
  const host = String(req.get('host') || '').toLowerCase();
  return process.env.FUNCTIONS_EMULATOR === 'true' ||
    host.includes('localhost') ||
    host.includes('127.0.0.1');
}

function hashValue(value) {
  const salt = EVENT_HASH_SALT.value() || process.env.EVENT_HASH_SALT || 'luban-local-hash-salt';
  return crypto.createHash('sha256').update(`${salt}:${String(value || '')}`).digest('hex');
}

function nowMs() {
  return Date.now();
}

function serializeTimestamp(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000).toISOString();
  return null;
}

function resolveTimestampDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  return null;
}

function createTransporter() {
  return nodemailer.createTransport({
    host: SMTP_HOST.value(),
    port: Number(SMTP_PORT.value() || 587),
    secure: String(SMTP_SECURE.value()).toLowerCase() === 'true',
    auth: {
      user: SMTP_USER.value(),
      pass: SMTP_PASS.value()
    }
  });
}

async function sendMail(mailOptions) {
  const transporter = createTransporter();
  await transporter.sendMail(mailOptions);
}

async function sendArkeselSms(to, message) {
  const apiKey = getArkeselApiKey();
  if (!apiKey) throw new Error('Missing Arkesel API key');
  await axios.get('https://sms.arkesel.com/sms/api', {
    params: {
      action: 'send-sms',
      api_key: apiKey,
      to,
      from: ARKESEL_SENDER.value(),
      sms: message
    },
    timeout: 10000
  });
}

async function sendArkeselOtp(number, message) {
  const apiKey = getArkeselApiKey();
  if (!apiKey) throw new Error('Missing Arkesel API key');
  const response = await axios.post(
    ARKESEL_OTP_URL.value(),
    {
      expiry: 5,
      length: 6,
      medium: 'sms',
      message,
      number,
      sender_id: ARKESEL_SENDER.value(),
      type: 'numeric'
    },
    {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    }
  );
  return response.data || {};
}

async function verifyArkeselOtp(number, code) {
  const apiKey = getArkeselApiKey();
  if (!apiKey) throw new Error('Missing Arkesel API key');
  const response = await axios.post(
    ARKESEL_OTP_VERIFY_URL.value(),
    {
      code: String(code || '').trim(),
      number
    },
    {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    }
  );
  return response.data || {};
}

async function validateTurnstile(token, req, action) {
  if (!token) {
    throw createHttpError(400, 'Please complete the anti-bot check.');
  }
  let secret = TURNSTILE_SECRET_KEY.value() || process.env.TURNSTILE_SECRET_KEY || '';
  if (!secret && canUseLocalTurnstileSecret(req)) {
    secret = DEFAULT_TURNSTILE_TEST_SECRET;
  }
  if (!secret) {
    logger.error('Turnstile secret is not configured for a non-local request', { action });
    throw createHttpError(500, 'The anti-bot check is not configured yet.');
  }
  const payload = new URLSearchParams();
  payload.set('secret', secret);
  payload.set('response', token);
  const ip = getClientIp(req);
  if (ip) payload.set('remoteip', ip);
  const response = await axios.post(TURNSTILE_VERIFY_URL.value(), payload, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 10000
  });
  if (!response.data || response.data.success !== true) {
    logger.warn('Turnstile validation failed', {
      action,
      errors: response.data ? response.data['error-codes'] : []
    });
    throw createHttpError(400, 'The anti-bot check could not be verified. Please try again.');
  }
}

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function sendJson(res, status, payload) {
  res.status(status).json(payload);
}

function setCors(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}

function extractBearerToken(authorizationHeader) {
  const match = String(authorizationHeader || '').match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

async function requireUser(req) {
  const token = extractBearerToken(req.get('authorization'));
  if (!token) throw createHttpError(401, 'Missing authorization token.');
  const admin = getAdmin();
  const decoded = await admin.auth().verifyIdToken(token, true);
  return decoded;
}

async function isAuthorizedAdmin(decodedToken) {
  const email = normalizeEmail(decodedToken?.email || '');
  if (decodedToken?.admin === true) return true;
  if (!email) return false;
  const adminDoc = await db().collection('admins').doc(email).get();
  return adminDoc.exists;
}

async function requireAdmin(req) {
  const decoded = await requireUser(req);
  if (!(await isAuthorizedAdmin(decoded))) {
    throw createHttpError(403, 'Forbidden');
  }
  return decoded;
}

async function recordSecurityEvent(kind, details) {
  const payload = Object.assign({
    kind,
    createdAt: serverTimestamp()
  }, details || {});
  await db().collection('securityEvents').add(payload).catch((error) => {
    logger.error('Failed to record security event', { kind, error: error?.message || error });
  });
}

async function enforceRateLimit(scope, key, limit, windowSeconds, context) {
  if (!key) return;
  const bucket = Math.floor(nowMs() / (windowSeconds * 1000));
  const docId = `${scope}:${hashValue(key)}:${bucket}`;
  const ref = db().collection('rateLimitBuckets').doc(docId);
  await db().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const count = snapshot.exists ? Number(snapshot.data().count || 0) : 0;
    if (count >= limit) {
      throw createHttpError(429, 'Too many requests. Please wait and try again.');
    }
    transaction.set(ref, {
      scope,
      subjectHash: hashValue(key),
      count: count + 1,
      expiresAt: new Date((bucket + 1) * windowSeconds * 1000),
      updatedAt: serverTimestamp()
    }, { merge: true });
  }).catch(async (error) => {
    if (error.status === 429) {
      await recordSecurityEvent('rate_limit_exceeded', Object.assign({
        scope,
        subjectHash: hashValue(key)
      }, context || {}));
    }
    throw error;
  });
}

function buildSignedToken(payload, purpose, ttlMs) {
  const secret = RESERVATION_LINK_SECRET.value() || process.env.RESERVATION_LINK_SECRET || 'luban-local-link-secret';
  const data = Object.assign({}, payload, {
    purpose,
    exp: nowMs() + ttlMs,
    nonce: crypto.randomBytes(12).toString('hex')
  });
  const encoded = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

function verifySignedToken(token, expectedPurpose) {
  const secret = RESERVATION_LINK_SECRET.value() || process.env.RESERVATION_LINK_SECRET || 'luban-local-link-secret';
  const parts = String(token || '').split('.');
  if (parts.length !== 2) throw createHttpError(400, 'Invalid access token.');
  const [encoded, signature] = parts;
  const expected = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  if (signature !== expected) throw createHttpError(400, 'Invalid access token.');
  const payload = safeJson(encoded);
  if (!payload || payload.purpose !== expectedPurpose || Number(payload.exp || 0) < nowMs()) {
    throw createHttpError(400, 'This access token has expired. Please request a new one.');
  }
  return payload;
}

function safeJson(base64urlValue) {
  try {
    return JSON.parse(Buffer.from(base64urlValue, 'base64url').toString('utf8'));
  } catch (error) {
    return null;
  }
}

function buildReservationStatusLink(token) {
  return `${String(PUBLIC_SITE_URL.value() || 'https://lubanrestaurant.com').replace(/\/+$/, '')}/reservation-status.html?token=${encodeURIComponent(token)}`;
}

function buildOrderStatusLink(orderId) {
  return `${String(PUBLIC_SITE_URL.value() || 'https://lubanrestaurant.com').replace(/\/+$/, '')}/order-status.html?order=${encodeURIComponent(orderId)}`;
}

async function syncUserVerificationMetadata(uid) {
  const admin = getAdmin();
  const authUser = await admin.auth().getUser(uid);
  const ref = db().collection('users').doc(uid);
  const snapshot = await ref.get();
  const data = snapshot.exists ? (snapshot.data() || {}) : {};
  const normalizedPhone = normalizePhoneNumber(data.phone || data.phoneE164 || '');
  const updates = {};
  const existingPhoneE164 = normalizePhoneNumber(data.phoneE164 || '');
  const phoneChanged = normalizedPhone !== existingPhoneE164;
  const finalPhoneVerifiedAt = phoneChanged || !normalizedPhone ? null : (data.phoneVerifiedAt || null);
  const finalEmailVerifiedAt = authUser.emailVerified ? (data.emailVerifiedAt || serverTimestamp()) : null;

  if (normalizedPhone !== (data.phoneE164 || '')) {
    updates.phoneE164 = normalizedPhone || deleteField();
  }
  if (phoneChanged || !normalizedPhone) {
    updates.phoneVerifiedAt = deleteField();
    updates.phoneVerificationMethod = deleteField();
  }
  if (authUser.emailVerified) {
    if (!data.emailVerifiedAt) updates.emailVerifiedAt = serverTimestamp();
  } else if (data.emailVerifiedAt) {
    updates.emailVerifiedAt = deleteField();
  }

  const emailVerified = authUser.emailVerified === true;
  const phoneVerified = Boolean(finalPhoneVerifiedAt);
  const verificationStatus = phoneVerified
    ? 'verified'
    : emailVerified
      ? 'phone_pending'
      : 'pending';

  if (verificationStatus !== data.verificationStatus) {
    updates.verificationStatus = verificationStatus;
  }

  if (Object.keys(updates).length) {
    await ref.set(updates, { merge: true });
  }

  const refreshed = await ref.get();
  const finalData = refreshed.exists ? (refreshed.data() || {}) : {};
  return {
    authUser,
    profile: finalData,
    emailVerified: authUser.emailVerified === true,
    phoneVerified: Boolean(finalData.phoneVerifiedAt),
    verificationStatus: finalData.verificationStatus || verificationStatus
  };
}

function serializeAccountStatus(syncResult) {
  const authUser = syncResult.authUser;
  const profile = syncResult.profile || {};
  return {
    ok: true,
    account: {
      uid: authUser.uid,
      email: authUser.email || '',
      emailMasked: maskEmail(authUser.email || ''),
      emailVerified: authUser.emailVerified === true,
      emailVerifiedAt: serializeTimestamp(profile.emailVerifiedAt),
      phone: profile.phone || '',
      phoneMasked: maskPhone(profile.phoneE164 || profile.phone || ''),
      phoneE164: profile.phoneE164 || '',
      phoneVerified: Boolean(profile.phoneVerifiedAt),
      phoneVerifiedAt: serializeTimestamp(profile.phoneVerifiedAt),
      phoneVerificationMethod: profile.phoneVerificationMethod || '',
      verificationStatus: profile.verificationStatus || syncResult.verificationStatus || 'pending',
      name: profile.name || authUser.displayName || '',
      preferredContact: profile.preferredContact || 'phone',
      notes: profile.notes || ''
    }
  };
}

async function loadMenuState() {
  const [hiddenSnap, menuPriceSnap, priceOverrideSnap] = await Promise.all([
    db().collection('dishAvailability').get(),
    db().collection('menuPrices').get(),
    db().collection('priceOverrides').get()
  ]);
  const hiddenIds = new Set();
  const menuPrices = {};
  const priceOverrides = {};
  hiddenSnap.forEach((doc) => {
    if (doc.data().hidden === true) hiddenIds.add(doc.id);
  });
  menuPriceSnap.forEach((doc) => {
    const price = Number(doc.data().price);
    if (Number.isFinite(price)) menuPrices[doc.id] = price;
  });
  priceOverrideSnap.forEach((doc) => {
    priceOverrides[doc.id] = doc.data() || {};
  });
  return { hiddenIds, menuPrices, priceOverrides };
}

function resolveCurrentPrice(item, menuState) {
  let price = Number(item.price || 0);
  if (Number.isFinite(menuState.menuPrices[item.id])) {
    price = Number(menuState.menuPrices[item.id]);
  }
  const override = menuState.priceOverrides[item.id];
  if (override) {
    if (Number.isFinite(Number(override.price))) {
      price = Number(override.price);
    }
    if (Number.isFinite(Number(override.newPrice))) {
      const revertAt = resolveTimestampDate(override.revertAt);
      if (!revertAt || revertAt.getTime() > nowMs()) {
        price = Number(override.newPrice);
      }
    }
  }
  return price;
}

function getMenuMap() {
  return menuCatalog.reduce((map, item) => {
    map[item.id] = item;
    return map;
  }, {});
}

function buildOrderFingerprint(items) {
  return items
    .map((item) => `${item.id}:${item.quantity}`)
    .sort()
    .join('|');
}

async function enforceNoRecentDuplicateOrder(decoded, phoneE164, basketFingerprint) {
  const recentOrders = await db()
    .collection('orders')
    .where('customerPhone', '==', phoneE164)
    .limit(12)
    .get();

  for (const doc of recentOrders.docs) {
    const data = doc.data() || {};
    const createdAt = resolveTimestampDate(data.createdAt);
    const status = String(data.status || '').toLowerCase();
    if (!createdAt || nowMs() - createdAt.getTime() > DUPLICATE_ORDER_WINDOW_MS) continue;
    if (!['pending', 'preparing'].includes(status)) continue;
    if (String(data.basketFingerprint || '') !== basketFingerprint) continue;

    await recordSecurityEvent('duplicate_order_blocked', {
      userId: decoded.uid,
      orderId: doc.id,
      phoneHash: hashValue(phoneE164)
    });
    throw createHttpError(409, 'A matching order was placed a moment ago. Please check My Orders before submitting again.');
  }
}

async function handleAccountStatus(req, res) {
  const decoded = await requireUser(req);
  const syncResult = await syncUserVerificationMetadata(decoded.uid);
  sendJson(res, 200, serializeAccountStatus(syncResult));
}

async function handleRequestPhoneOtp(req, res) {
  const decoded = await requireUser(req);
  const syncResult = await syncUserVerificationMetadata(decoded.uid);
  const profile = syncResult.profile || {};
  const phoneE164 = normalizePhoneNumber(profile.phoneE164 || profile.phone || '');
  if (!phoneE164) throw createHttpError(400, 'Please add a valid Ghana phone number to your profile first.');
  const ip = getClientIp(req);
  await enforceRateLimit('otp_phone_hour', phoneE164, 5, 60 * 60, { userId: decoded.uid, ipHash: hashValue(ip) });
  await enforceRateLimit('otp_phone_day', phoneE164, 10, 60 * 60 * 24, { userId: decoded.uid, ipHash: hashValue(ip) });
  await enforceRateLimit('otp_uid_hour', decoded.uid, 5, 60 * 60, { phoneHash: hashValue(phoneE164), ipHash: hashValue(ip) });
  if (ip) {
    await enforceRateLimit('otp_ip_hour', ip, 10, 60 * 60, { userId: decoded.uid, phoneHash: hashValue(phoneE164) });
  }
  const response = await sendArkeselOtp(normalizeArkeselNumber(phoneE164), ARKESEL_OTP_TEMPLATE.value());
  await recordSecurityEvent('otp_sent', {
    userId: decoded.uid,
    phoneHash: hashValue(phoneE164),
    ipHash: hashValue(ip),
    providerCode: String(response.code || '')
  });
  sendJson(res, 200, {
    ok: true,
    phoneMasked: maskPhone(phoneE164),
    providerCode: String(response.code || ''),
    message: 'Verification code sent.'
  });
}

async function handleVerifyPhoneOtp(req, res) {
  const decoded = await requireUser(req);
  const code = String(req.body.code || '').trim();
  if (!/^\d{6}$/.test(code)) throw createHttpError(400, 'Enter the 6-digit code.');
  const syncResult = await syncUserVerificationMetadata(decoded.uid);
  const profile = syncResult.profile || {};
  const phoneE164 = normalizePhoneNumber(profile.phoneE164 || profile.phone || '');
  if (!phoneE164) throw createHttpError(400, 'Please add a valid Ghana phone number to your profile first.');
  const ip = getClientIp(req);
  await enforceRateLimit('otp_verify_phone', phoneE164, 3, 10 * 60, { userId: decoded.uid, ipHash: hashValue(ip) });
  const response = await verifyArkeselOtp(normalizeArkeselNumber(phoneE164), code);
  if (String(response.code || '') !== '1100') {
    await recordSecurityEvent('otp_verify_failed', {
      userId: decoded.uid,
      phoneHash: hashValue(phoneE164),
      ipHash: hashValue(ip),
      providerCode: String(response.code || '')
    });
    throw createHttpError(400, 'The code could not be verified. Please try again.');
  }
  await db().collection('users').doc(decoded.uid).set({
    phoneE164,
    phoneVerifiedAt: serverTimestamp(),
    phoneVerificationMethod: 'arkesel_sms',
    verificationStatus: 'verified'
  }, { merge: true });
  const usersWithSamePhone = await db().collection('users').where('phoneE164', '==', phoneE164).get();
  if (usersWithSamePhone.size > 1) {
    await recordSecurityEvent('shared_phone_detected', {
      userId: decoded.uid,
      phoneHash: hashValue(phoneE164),
      duplicateCount: usersWithSamePhone.size
    });
  }
  await recordSecurityEvent('otp_verified', {
    userId: decoded.uid,
    phoneHash: hashValue(phoneE164),
    ipHash: hashValue(ip)
  });
  const fresh = await syncUserVerificationMetadata(decoded.uid);
  sendJson(res, 200, serializeAccountStatus(fresh));
}

async function handleCreateOrder(req, res) {
  const decoded = await requireUser(req);
  const syncResult = await syncUserVerificationMetadata(decoded.uid);
  const profile = syncResult.profile || {};
  if (!profile.phoneVerifiedAt) throw createHttpError(412, 'Please verify your Ghana phone number before placing an order. Email verification is optional.');
  const phoneE164 = normalizePhoneNumber(profile.phoneE164 || profile.phone || '');
  if (!phoneE164) throw createHttpError(400, 'Please add a valid phone number to your profile first.');
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (!items.length) throw createHttpError(400, 'Your cart is empty.');
  const ip = getClientIp(req);

  await enforceRateLimit('order_uid_15m', decoded.uid, 6, 15 * 60, { ipHash: hashValue(ip) });
  await enforceRateLimit('order_phone_15m', phoneE164, 6, 15 * 60, { userId: decoded.uid, ipHash: hashValue(ip) });
  if (ip) {
    await enforceRateLimit('order_ip_15m', ip, 10, 15 * 60, { userId: decoded.uid, phoneHash: hashValue(phoneE164) });
  }

  const menuMap = getMenuMap();
  const menuState = await loadMenuState();
  const resolvedItems = [];
  let authoritativeTotal = 0;

  for (const rawItem of items) {
    const item = menuMap[String(rawItem.id || '').trim()];
    const quantity = Number(rawItem.quantity || 0);
    if (!item || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      throw createHttpError(400, 'One or more cart items are invalid.');
    }
    if (menuState.hiddenIds.has(item.id)) {
      throw createHttpError(400, `${item.name} is currently unavailable.`);
    }
    const price = resolveCurrentPrice(item, menuState);
    authoritativeTotal += price * quantity;
    resolvedItems.push({
      id: item.id,
      name: item.name,
      quantity,
      price
    });
  }

  const clientTotal = Number(req.body.total || 0);
  if (Number.isFinite(clientTotal) && Math.abs(clientTotal - authoritativeTotal) > 0.01) {
    await recordSecurityEvent('order_total_mismatch', {
      userId: decoded.uid,
      email: normalizeEmail(decoded.email || ''),
      suppliedTotal: clientTotal,
      authoritativeTotal
    });
  }

  const basketFingerprint = buildOrderFingerprint(resolvedItems);
  await enforceNoRecentDuplicateOrder(decoded, phoneE164, basketFingerprint);

  const orderRef = db().collection('orders').doc();
  const orderPayload = {
    items: resolvedItems,
    total: Number(authoritativeTotal.toFixed(2)),
    status: 'pending',
    createdAt: serverTimestamp(),
    userEmail: normalizeEmail(decoded.email || syncResult.authUser.email || ''),
    userId: decoded.uid,
    customerName: cleanPlainText(profile.name || syncResult.authUser.displayName || 'Customer'),
    customerPhone: phoneE164,
    customerNotes: cleanPlainText(profile.notes || ''),
    basketFingerprint,
    source: 'secure_api'
  };
  await orderRef.set(orderPayload);
  await recordSecurityEvent('order_created', {
    userId: decoded.uid,
    orderId: orderRef.id,
    total: orderPayload.total,
    phoneHash: hashValue(phoneE164),
    ipHash: hashValue(ip)
  });
  sendJson(res, 200, {
    ok: true,
    orderId: orderRef.id,
    orderStatusUrl: buildOrderStatusLink(orderRef.id),
    order: {
      id: orderRef.id,
      total: orderPayload.total,
      items: resolvedItems,
      status: orderPayload.status
    }
  });
}

async function getOwnedOrder(orderId, decoded) {
  const orderSnap = await db().collection('orders').doc(orderId).get();
  if (!orderSnap.exists) throw createHttpError(404, 'Order not found.');
  const data = orderSnap.data() || {};
  if (data.userId !== decoded.uid) throw createHttpError(403, 'Forbidden');
  return { ref: orderSnap.ref, data };
}

async function handleGetOwnOrders(req, res) {
  const decoded = await requireUser(req);
  const limit = Math.min(Number(req.query.limit || 10), 50);
  const ordersSnap = await db()
    .collection('orders')
    .where('userId', '==', decoded.uid)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  
  const orders = ordersSnap.docs.map((doc) => {
    const data = doc.data() || {};
    return {
      id: doc.id,
      orderNumber: `#${doc.id.slice(-6).toUpperCase()}`,
      status: data.status || 'unknown',
      total: Number(data.total || 0),
      createdAt: serializeTimestamp(data.createdAt),
      items: Array.isArray(data.items) ? data.items.map((item) => ({
        name: item.name || 'Item',
        quantity: Number(item.quantity || 0),
        price: Number(item.price || 0)
      })) : [],
      statusUrl: buildOrderStatusLink(doc.id)
    };
  });

  sendJson(res, 200, {
    ok: true,
    orders,
    lastOrder: orders.length > 0 ? orders[0] : null
  });
}

async function handleCancelOwnOrder(req, res) {
  const decoded = await requireUser(req);
  const orderId = String(req.body.orderId || '').trim();
  if (!orderId) throw createHttpError(400, 'Missing order id.');
  const order = await getOwnedOrder(orderId, decoded);
  const createdAt = resolveTimestampDate(order.data.createdAt);
  if (order.data.status !== 'pending' || !createdAt || nowMs() - createdAt.getTime() > ORDER_CANCEL_WINDOW_MS) {
    throw createHttpError(400, 'This order can no longer be cancelled online.');
  }
  await order.ref.update({
    status: 'cancelled',
    cancelledAt: serverTimestamp(),
    cancelledBy: 'customer'
  });
  await recordSecurityEvent('order_cancelled_by_customer', {
    userId: decoded.uid,
    orderId
  });
  sendJson(res, 200, { ok: true });
}

async function handleDeleteOwnOrder(req, res) {
  const decoded = await requireUser(req);
  const orderId = String(req.body.orderId || '').trim();
  if (!orderId) throw createHttpError(400, 'Missing order id.');
  const order = await getOwnedOrder(orderId, decoded);
  if (!['completed', 'cancelled'].includes(String(order.data.status || '').toLowerCase())) {
    throw createHttpError(400, 'Only completed or cancelled orders can be deleted.');
  }
  await order.ref.delete();
  await recordSecurityEvent('order_deleted_by_customer', {
    userId: decoded.uid,
    orderId
  });
  sendJson(res, 200, { ok: true });
}

async function sendReservationAccessAcknowledgements(reservationId, reservation, token) {
  const link = buildReservationStatusLink(token);
  const email = normalizeEmail(reservation.email);
  const number = normalizeArkeselNumber(reservation.phoneE164 || reservation.phone);
  const subject = `We received your Luban Workshop reservation request (#${reservationId})`;
  const html = `
    <div style="font-family:Arial,sans-serif;color:#1c1917;line-height:1.6">
      <h2 style="margin:0 0 12px">Reservation request received</h2>
      <p>Thank you for contacting Luban Workshop Restaurant. We have received your reservation request for <strong>${escapeHtml(reservation.date)}</strong> at <strong>${escapeHtml(reservation.time)}</strong>.</p>
      <p>You can review its status and send change or cancellation requests here:</p>
      <p><a href="${escapeHtml(link)}">${escapeHtml(link)}</a></p>
      <p>If you need help, call 020 543 8455.</p>
    </div>
  `;
  if (email) {
    await sendMail({
      from: SMTP_FROM.value(),
      to: email,
      subject,
      html,
      text: `We received your reservation request. Track it here: ${link}`
    }).catch((error) => logger.error('Failed to send reservation acknowledgement email', {
      reservationId,
      error: error?.message || error
    }));
  }
  if (number) {
    await sendArkeselSms(number, `Luban Workshop received your reservation request. Track it here: ${link}`).catch((error) => {
      logger.error('Failed to send reservation acknowledgement SMS', {
        reservationId,
        error: error?.message || error
      });
    });
  }
}

async function handleSubmitReservation(req, res) {
  await validateTurnstile(req.body.turnstileToken, req, 'submitReservation');
  const name = cleanPlainText(req.body.name);
  const phoneE164 = normalizePhoneNumber(req.body.phone);
  const email = normalizeEmail(req.body.email);
  const date = cleanPlainText(req.body.date);
  const time = cleanPlainText(req.body.time);
  const guests = cleanPlainText(req.body.guests);
  const notes = cleanPlainText(req.body.notes);
  if (!name || !phoneE164 || !date || !time || !guests) {
    throw createHttpError(400, 'Please complete all required reservation fields.');
  }
  const ip = getClientIp(req);
  await enforceRateLimit('reservation_phone_hour', phoneE164, 4, 60 * 60, { ipHash: hashValue(ip) });
  if (ip) {
    await enforceRateLimit('reservation_ip_hour', ip, 8, 60 * 60, { phoneHash: hashValue(phoneE164) });
  }
  const reservationRef = db().collection('reservations').doc();
  const token = buildSignedToken({ reservationId: reservationRef.id }, 'reservation-link', RESERVATION_LINK_TTL_MS);
  await reservationRef.set({
    name,
    phone: phoneE164,
    phoneE164,
    email,
    date,
    time,
    guests,
    notes,
    status: 'pending',
    createdAt: serverTimestamp(),
    accessLinkHash: hashValue(token),
    accessLinkExpiresAt: new Date(nowMs() + RESERVATION_LINK_TTL_MS),
    guestRequestPending: false,
    lastGuestRequestType: null,
    lastGuestRequestMessage: null,
    lastGuestRequestAt: null,
    source: 'secure_api'
  });
  await recordSecurityEvent('reservation_submitted', {
    reservationId: reservationRef.id,
    phoneHash: hashValue(phoneE164),
    ipHash: hashValue(ip),
    email
  });
  await sendReservationAccessAcknowledgements(reservationRef.id, {
    phoneE164,
    phone: phoneE164,
    email,
    date,
    time
  }, token);
  sendJson(res, 200, { ok: true, reservationId: reservationRef.id });
}

async function getReservationFromLinkToken(token) {
  const payload = verifySignedToken(token, 'reservation-link');
  const reservationId = String(payload.reservationId || '').trim();
  if (!reservationId) throw createHttpError(400, 'Invalid reservation link.');
  const snap = await db().collection('reservations').doc(reservationId).get();
  if (!snap.exists) throw createHttpError(404, 'Reservation not found.');
  const data = snap.data() || {};
  if (hashValue(token) !== data.accessLinkHash) throw createHttpError(400, 'This reservation link is no longer valid.');
  return { id: reservationId, ref: snap.ref, data };
}

function serializeReservation(reservation) {
  return {
    id: reservation.id,
    name: reservation.data.name || '',
    phoneMasked: maskPhone(reservation.data.phoneE164 || reservation.data.phone || ''),
    emailMasked: maskEmail(reservation.data.email || ''),
    date: reservation.data.date || '',
    time: reservation.data.time || '',
    guests: reservation.data.guests || '',
    notes: reservation.data.notes || '',
    status: reservation.data.status || 'pending',
    guestRequestPending: reservation.data.guestRequestPending === true,
    lastGuestRequestType: reservation.data.lastGuestRequestType || '',
    lastGuestRequestMessage: reservation.data.lastGuestRequestMessage || '',
    lastGuestRequestAt: serializeTimestamp(reservation.data.lastGuestRequestAt),
    accessLinkExpiresAt: serializeTimestamp(reservation.data.accessLinkExpiresAt)
  };
}

async function handleBeginReservationAccess(req, res) {
  await validateTurnstile(req.body.turnstileToken, req, 'beginReservationAccess');
  const token = String(req.body.token || '').trim();
  const reservation = await getReservationFromLinkToken(token);
  const phoneE164 = normalizePhoneNumber(reservation.data.phoneE164 || reservation.data.phone || '');
  if (!phoneE164) throw createHttpError(400, 'This reservation does not have a valid phone number.');
  const ip = getClientIp(req);
  await enforceRateLimit('reservation_access_phone_hour', phoneE164, 5, 60 * 60, { ipHash: hashValue(ip) });
  if (ip) await enforceRateLimit('reservation_access_ip_hour', ip, 10, 60 * 60, { phoneHash: hashValue(phoneE164) });
  const response = await sendArkeselOtp(normalizeArkeselNumber(phoneE164), 'Your Luban Workshop reservation access code is %otp_code%. It expires in %expiry% minutes.');
  await reservation.ref.set({ lastAccessMessageAt: serverTimestamp() }, { merge: true });
  await recordSecurityEvent('reservation_access_otp_sent', {
    reservationId: reservation.id,
    phoneHash: hashValue(phoneE164),
    ipHash: hashValue(ip),
    providerCode: String(response.code || '')
  });
  sendJson(res, 200, {
    ok: true,
    reservation: serializeReservation(reservation)
  });
}

async function handleVerifyReservationAccessOtp(req, res) {
  const token = String(req.body.token || '').trim();
  const code = String(req.body.code || '').trim();
  if (!/^\d{6}$/.test(code)) throw createHttpError(400, 'Enter the 6-digit code.');
  const reservation = await getReservationFromLinkToken(token);
  const phoneE164 = normalizePhoneNumber(reservation.data.phoneE164 || reservation.data.phone || '');
  const ip = getClientIp(req);
  await enforceRateLimit('reservation_access_verify_phone', phoneE164, 3, 10 * 60, { reservationId: reservation.id, ipHash: hashValue(ip) });
  const response = await verifyArkeselOtp(normalizeArkeselNumber(phoneE164), code);
  if (String(response.code || '') !== '1100') {
    await recordSecurityEvent('reservation_access_otp_failed', {
      reservationId: reservation.id,
      phoneHash: hashValue(phoneE164),
      ipHash: hashValue(ip),
      providerCode: String(response.code || '')
    });
    throw createHttpError(400, 'The code could not be verified. Please try again.');
  }
  await recordSecurityEvent('reservation_access_granted', {
    reservationId: reservation.id,
    phoneHash: hashValue(phoneE164),
    ipHash: hashValue(ip)
  });
  sendJson(res, 200, {
    ok: true,
    accessGrant: buildSignedToken({ reservationId: reservation.id }, 'reservation-access', RESERVATION_ACCESS_TTL_MS),
    reservation: serializeReservation(reservation)
  });
}

function verifyAccessGrant(token, reservationId) {
  const payload = verifySignedToken(token, 'reservation-access');
  if (String(payload.reservationId || '') !== String(reservationId || '')) {
    throw createHttpError(403, 'Access denied.');
  }
}

async function handleRequestReservationChange(req, res) {
  const token = String(req.body.token || '').trim();
  const accessGrant = String(req.body.accessGrant || '').trim();
  const requestType = String(req.body.requestType || '').trim().toLowerCase();
  const message = cleanPlainText(req.body.message || '');
  if (!['change', 'cancel'].includes(requestType)) {
    throw createHttpError(400, 'Please choose whether you want to change or cancel the reservation.');
  }
  if (!message) throw createHttpError(400, 'Please tell us what you need changed.');
  const reservation = await getReservationFromLinkToken(token);
  verifyAccessGrant(accessGrant, reservation.id);
  await db().collection('reservationRequests').add({
    reservationId: reservation.id,
    requestType,
    message,
    createdAt: serverTimestamp(),
    reservationPhoneHash: hashValue(reservation.data.phoneE164 || reservation.data.phone || ''),
    status: 'pending'
  });
  await reservation.ref.set({
    guestRequestPending: true,
    lastGuestRequestType: requestType,
    lastGuestRequestMessage: message,
    lastGuestRequestAt: serverTimestamp()
  }, { merge: true });
  await recordSecurityEvent('reservation_guest_request_submitted', {
    reservationId: reservation.id,
    requestType
  });
  sendJson(res, 200, { ok: true });
}

async function handleSubmitContactMessage(req, res) {
  await validateTurnstile(req.body.turnstileToken, req, 'submitContactMessage');
  const name = cleanPlainText(req.body.name);
  const email = normalizeEmail(req.body.email);
  const subject = cleanPlainText(req.body.subject);
  const message = cleanPlainText(req.body.message);
  if (!name || !email || !subject || !message) {
    throw createHttpError(400, 'Please complete all contact form fields.');
  }
  const ip = getClientIp(req);
  await enforceRateLimit('contact_email_hour', email, 5, 60 * 60, { ipHash: hashValue(ip) });
  if (ip) await enforceRateLimit('contact_ip_hour', ip, 8, 60 * 60, { email });
  await db().collection('contact_messages').add({
    name,
    email,
    subject,
    message,
    read: false,
    createdAt: serverTimestamp(),
    source: 'secure_api'
  });
  await recordSecurityEvent('contact_message_submitted', {
    email,
    ipHash: hashValue(ip)
  });
  sendJson(res, 200, { ok: true });
}

async function handleSubmitAssistantReport(req, res) {
  const decoded = await requireUser(req);
  const syncResult = await syncUserVerificationMetadata(decoded.uid);
  const profile = syncResult.profile || {};
  const authUser = syncResult.authUser || {};
  const email = normalizeEmail(authUser.email || decoded.email || profile.email || '');
  if (!email) throw createHttpError(400, 'Your account needs an email address before the assistant can send a report.');

  const submittedMessage = cleanLimitedText(req.body.message, 2000);
  const originalMessage = cleanLimitedText(req.body.originalMessage || req.body.message, 2000);
  const generatedDescription = cleanLimitedText(req.body.generatedDescription, 2000);
  const preserveOriginal = req.body.preserveOriginal === true;
  const message = preserveOriginal
    ? (submittedMessage || originalMessage)
    : (generatedDescription || submittedMessage || originalMessage);

  if (message.length < 10 || originalMessage.length < 10) {
    throw createHttpError(400, 'Please include a little more detail before sending your report.');
  }

  const subject = cleanSubjectLine(req.body.subject || `Assistant report from ${profile.name || authUser.displayName || 'customer'}`);
  const reportCategory = cleanLimitedText(req.body.reportCategory || 'General', 40);
  const reportUrgency = ['normal', 'medium', 'high'].includes(String(req.body.reportUrgency || '').toLowerCase())
    ? String(req.body.reportUrgency).toLowerCase()
    : 'normal';
  const reportDescriptionMode = preserveOriginal
    ? 'original'
    : cleanLimitedText(req.body.reportDescriptionMode || (generatedDescription ? 'ai_drafted' : 'submitted'), 40);
  const phoneE164 = normalizePhoneNumber(profile.phoneE164 || profile.phone || '');
  const name = cleanPlainText(profile.name || authUser.displayName || decoded.name || 'Signed-in customer');
  const preferredContact = cleanPlainText(profile.preferredContact || 'email');
  const customerNotes = cleanLimitedText(profile.notes, 500);
  const pageUrl = cleanLimitedText(req.body.pageUrl, 500);
  const ip = getClientIp(req);

  await enforceRateLimit('assistant_report_uid_hour', decoded.uid, 4, 60 * 60, { ipHash: hashValue(ip) });
  await enforceRateLimit('assistant_report_email_hour', email, 6, 60 * 60, { userId: decoded.uid, ipHash: hashValue(ip) });
  if (ip) await enforceRateLimit('assistant_report_ip_hour', ip, 10, 60 * 60, { userId: decoded.uid });

  const docRef = await db().collection('contact_messages').add({
    name,
    email,
    phone: phoneE164,
    phoneMasked: maskPhone(phoneE164),
    subject,
    message,
    originalMessage,
    generatedDescription: preserveOriginal ? '' : generatedDescription,
    preserveOriginal,
    reportCategory,
    reportUrgency,
    reportDescriptionMode,
    aiGeneratedDescription: !preserveOriginal && reportDescriptionMode !== 'submitted',
    read: false,
    createdAt: serverTimestamp(),
    source: 'assistant',
    userId: decoded.uid,
    preferredContact,
    customerNotes,
    verificationStatus: syncResult.verificationStatus || profile.verificationStatus || 'pending',
    emailVerified: syncResult.emailVerified === true,
    phoneVerified: Boolean(profile.phoneVerifiedAt),
    pageUrl,
    userAgentHash: hashValue(req.get('user-agent') || '')
  });

  await recordSecurityEvent('assistant_report_submitted', {
    userId: decoded.uid,
    email,
    messageId: docRef.id,
    phoneHash: hashValue(phoneE164),
    ipHash: hashValue(ip)
  });

  sendJson(res, 200, { ok: true, messageId: docRef.id });
}

async function handleAdminFraudReview(req, res) {
  await requireAdmin(req);
  const [eventSnap, orderSnap, userSnap] = await Promise.all([
    db().collection('securityEvents').orderBy('createdAt', 'desc').limit(150).get(),
    db().collection('orders').orderBy('createdAt', 'desc').limit(120).get(),
    db().collection('users').get()
  ]);
  const events = eventSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() || {}) }));
  const otpFailuresByPhone = {};
  const otpSendsByPhone = {};
  const priceMismatches = [];
  const suspiciousBursts = [];
  events.forEach((event) => {
    if (event.kind === 'otp_verify_failed' || event.kind === 'reservation_access_otp_failed') {
      const key = event.phoneHash || event.reservationPhoneHash || event.userId || 'unknown';
      otpFailuresByPhone[key] = (otpFailuresByPhone[key] || 0) + 1;
    }
    if (event.kind === 'otp_sent' || event.kind === 'reservation_access_otp_sent') {
      const key = event.phoneHash || event.reservationPhoneHash || event.userId || 'unknown';
      otpSendsByPhone[key] = (otpSendsByPhone[key] || 0) + 1;
    }
    if (event.kind === 'order_total_mismatch') {
      priceMismatches.push(event);
    }
    if (event.kind === 'rate_limit_exceeded') {
      suspiciousBursts.push(event);
    }
  });

  const duplicatePhoneMap = {};
  userSnap.forEach((doc) => {
    const data = doc.data() || {};
    const phone = normalizePhoneNumber(data.phoneE164 || data.phone || '');
    if (!phone) return;
    duplicatePhoneMap[phone] = duplicatePhoneMap[phone] || [];
    duplicatePhoneMap[phone].push({
      uid: doc.id,
      name: data.name || '',
      email: data.email || '',
      verificationStatus: data.verificationStatus || 'pending'
    });
  });
  const duplicatePhones = Object.entries(duplicatePhoneMap)
    .filter(([, users]) => users.length > 1)
    .map(([phone, users]) => ({
      phoneMasked: maskPhone(phone),
      users
    }));

  const cancellationCounts = {};
  orderSnap.forEach((doc) => {
    const data = doc.data() || {};
    if (String(data.status || '').toLowerCase() !== 'cancelled') return;
    const key = data.userId || data.customerPhone || doc.id;
    cancellationCounts[key] = cancellationCounts[key] || {
      count: 0,
      userId: data.userId || '',
      customerName: data.customerName || '',
      customerPhone: maskPhone(data.customerPhone || '')
    };
    cancellationCounts[key].count += 1;
  });

  sendJson(res, 200, {
    ok: true,
    duplicatePhones,
    repeatedOtpSends: Object.entries(otpSendsByPhone)
      .filter(([, count]) => count >= 3)
      .map(([subjectHash, count]) => ({ subjectHash, count })),
    repeatedOtpFailures: Object.entries(otpFailuresByPhone)
      .filter(([, count]) => count >= 2)
      .map(([subjectHash, count]) => ({ subjectHash, count })),
    repeatedCancellations: Object.values(cancellationCounts).filter((entry) => entry.count >= 2),
    priceMismatches: priceMismatches.slice(0, 10).map((event) => ({
      suppliedTotal: event.suppliedTotal,
      authoritativeTotal: event.authoritativeTotal,
      userId: event.userId || '',
      createdAt: serializeTimestamp(event.createdAt)
    })),
    suspiciousBursts: suspiciousBursts.slice(0, 20).map((event) => ({
      scope: event.scope || '',
      createdAt: serializeTimestamp(event.createdAt),
      subjectHash: event.subjectHash || ''
    })),
    recentEvents: events.slice(0, 30).map((event) => ({
      kind: event.kind,
      createdAt: serializeTimestamp(event.createdAt),
      orderId: event.orderId || '',
      reservationId: event.reservationId || '',
      userId: event.userId || '',
      requestType: event.requestType || ''
    }))
  });
}

async function handleBootstrapChatbotKnowledge(req, res) {
  const decoded = await requireAdmin(req);
  const defaults = [
    {
      id: 'secure-ordering-verification',
      title: 'Why do I need phone verification before ordering?',
      answer: 'Luban Workshop requires a verified Ghana phone number before an online order can be placed. This helps stop fake orders, prevents someone else using your details, and lets the restaurant send accurate order updates. Email verification is optional.',
    },
    {
      id: 'phone-otp-help',
      title: 'How does phone verification work?',
      answer: 'After you save a valid Ghana phone number on your customer profile, open the Verify Contact page and request a 6-digit SMS code. Enter the code within 5 minutes to mark your phone number as verified.',
    },
    {
      id: 'checkout-page',
      title: 'Where do I place my order now?',
      answer: 'Add dishes to your cart from the homepage, then continue to the dedicated Checkout page to review your order, confirm your verified contact details, and place the order securely.',
    },
    {
      id: 'order-tracking-page',
      title: 'How do I track my order?',
      answer: 'Signed-in customers can still use the My Orders section on the homepage, and each placed order now has its own Order Status page where you can review the order details and timeline.',
    },
    {
      id: 'reservation-status-access',
      title: 'How do I check a reservation request or ask for a change?',
      answer: 'Use the secure reservation status link sent after you submit a reservation. The page will send a one-time SMS access code to the reservation phone number before showing the booking details or letting you submit a change or cancellation request.',
    },
    {
      id: 'otp-failure-help',
      title: 'What should I do if my verification code fails or expires?',
      answer: 'If the SMS code is wrong or has expired, request a fresh code from the verification page or reservation status page. Make sure your saved phone number is a valid Ghana number and contact the restaurant if the problem continues.',
    },
    {
      id: 'check-order-status',
      title: 'How do I check my order status?',
      answer: 'You can ask me directly about your recent orders! Just ask me "What\'s the status of my last order?" or "Show me my recent orders". I can retrieve information about all your orders including their status, items, and total price. You\'ll also get a link to the full order details page.',
    },
    {
      id: 'ask-last-order',
      title: 'What can I ask about my orders?',
      answer: 'You can ask me questions like:\n• "What\'s the status of my last order?"\n• "Show me my recent orders"\n• "Is my order ready?"\n• "When was my order placed?"\n\nI can show you up to 10 of your most recent orders with details about items, prices, and current status.',
    },
    {
      id: 'order-status-help',
      title: 'What do order statuses mean?',
      answer: 'Orders have different statuses:\n• Pending: Your order was received and is waiting to be prepared\n• Preparing: The kitchen is making your order\n• Completed: Your order is ready for pickup\n• Cancelled: Your order was cancelled\n\nYou can cancel pending orders within 5 minutes of placing them.',
    }
  ];
  const collection = db().collection('chatbotKnowledge');
  for (const item of defaults) {
    await collection.doc(item.id).set({
      title: item.title,
      answer: item.answer,
      status: 'active',
      active: true,
      archived: false,
      updatedAt: serverTimestamp(),
      updatedBy: decoded.email || 'admin',
      createdAt: serverTimestamp(),
      createdBy: decoded.email || 'admin'
    }, { merge: true });
  }
  sendJson(res, 200, { ok: true, count: defaults.length });
}

async function router(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  if (req.method !== 'GET' && req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }

  const path = String(req.path || '/').replace(/^\/+/, '').replace(/^api\/?/, '');
  try {
    if (path === 'accountStatus' && req.method === 'GET') return await handleAccountStatus(req, res);
    if (path === 'requestPhoneOtp' && req.method === 'POST') return await handleRequestPhoneOtp(req, res);
    if (path === 'verifyPhoneOtp' && req.method === 'POST') return await handleVerifyPhoneOtp(req, res);
    if (path === 'createOrder' && req.method === 'POST') return await handleCreateOrder(req, res);
    if (path === 'getOwnOrders' && req.method === 'GET') return await handleGetOwnOrders(req, res);
    if (path === 'cancelOwnOrder' && req.method === 'POST') return await handleCancelOwnOrder(req, res);
    if (path === 'deleteOwnOrder' && req.method === 'POST') return await handleDeleteOwnOrder(req, res);
    if (path === 'submitReservation' && req.method === 'POST') return await handleSubmitReservation(req, res);
    if (path === 'beginReservationAccess' && req.method === 'POST') return await handleBeginReservationAccess(req, res);
    if (path === 'verifyReservationAccessOtp' && req.method === 'POST') return await handleVerifyReservationAccessOtp(req, res);
    if (path === 'requestReservationChange' && req.method === 'POST') return await handleRequestReservationChange(req, res);
    if (path === 'submitContactMessage' && req.method === 'POST') return await handleSubmitContactMessage(req, res);
    if (path === 'submitAssistantReport' && req.method === 'POST') return await handleSubmitAssistantReport(req, res);
    if (path === 'admin/fraud-review' && req.method === 'GET') return await handleAdminFraudReview(req, res);
    if (path === 'admin/bootstrap-chatbot-knowledge' && req.method === 'POST') return await handleBootstrapChatbotKnowledge(req, res);
    sendJson(res, 404, { error: 'Endpoint not found.' });
  } catch (error) {
    logger.error('Secure API request failed', {
      path,
      error: error?.message || error
    });
    sendJson(res, error.status || 500, { error: error.message || 'Request failed.' });
  }
}

exports.api = onRequest({
  region: 'us-central1',
  secrets: [
    SMTP_USER,
    SMTP_PASS,
    SMTP_FROM,
    NOTIFICATION_RECIPIENT,
    ARKESEL_API_KEY,
    TURNSTILE_SECRET_KEY,
    RESERVATION_LINK_SECRET,
    EVENT_HASH_SALT
  ]
}, router);

async function syncUserDocument(event) {
  const uid = event.params.userId;
  try {
    await syncUserVerificationMetadata(uid);
  } catch (error) {
    logger.error('Failed to sync user verification metadata', {
      uid,
      error: error?.message || error
    });
  }
}

exports.syncUserVerificationOnCreate = onDocumentCreated(
  { region: 'us-central1', document: 'users/{userId}' },
  syncUserDocument
);

exports.syncUserVerificationOnUpdate = onDocumentUpdated(
  { region: 'us-central1', document: 'users/{userId}' },
  syncUserDocument
);
