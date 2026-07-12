const crypto = require('crypto');
const { onDocumentCreated, onDocumentDeleted, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { onRequest } = require('firebase-functions/v2/https');
const { defineString, defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const { formatBusinessHoursDateTime } = require('./business-hours');

const SMTP_HOST = defineString('SMTP_HOST', { default: 'smtp.gmail.com' });
const SMTP_PORT = defineString('SMTP_PORT', { default: '587' });
const SMTP_SECURE = defineString('SMTP_SECURE', { default: 'false' });
const SMTP_USER = defineSecret('SMTP_USER');
const SMTP_PASS = defineSecret('SMTP_PASS');
const SMTP_FROM = defineSecret('SMTP_FROM');
const NOTIFICATION_RECIPIENT = defineSecret('NOTIFICATION_RECIPIENT');
const RESERVATION_LINK_SECRET = defineSecret('RESERVATION_LINK_SECRET');
const EVENT_HASH_SALT = defineSecret('EVENT_HASH_SALT');
const ARKESEL_API_KEY = defineSecret('ARKESEL_API_KEY');
const ARKESEL_SENDER = defineString('ARKESEL_SENDER', { default: 'Workshop ws' });
const RESTAURANT_SMS_NUMBER = defineString('RESTAURANT_SMS_NUMBER', { default: '020 543 8455' });
const ARKESEL_URL = defineString('ARKESEL_URL', { default: 'https://sms.arkesel.com/sms/api' });
const ARKESEL_BALANCE_URL = defineString('ARKESEL_BALANCE_URL', { default: 'https://sms.arkesel.com/sms/api' });
const TEAM_PROFILE_STORAGE_BUCKET = defineString('TEAM_PROFILE_STORAGE_BUCKET', {
  default: 'luban-workshop-restaurant.firebasestorage.app',
});
const PUBLIC_SITE_URL = 'https://lubanrestaurant.com';
const BAO_EMAIL_ANIMATION_URL = `${PUBLIC_SITE_URL}/assets/bao-campaign/gifs/bao-wave-loop.gif`;
const VITAFORGE_URL = 'https://cv-build.web.app';
const VITAFORGE_ICON_URL = `${PUBLIC_SITE_URL}/assets/partners/vitaforge/vitaforge-icon-512.png`;
const RESERVATION_LINK_TTL_MS = 1000 * 60 * 60 * 24 * 45;

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

function nowMs() {
  return Date.now();
}

function getPublicSiteUrl() {
  return String(PUBLIC_SITE_URL || 'https://lubanrestaurant.com').replace(/\/+$/, '');
}

function requireConfiguredSecret(name, paramValue, localDefault) {
  const value = paramValue || process.env[name] || '';
  if (value) return value;
  if (process.env.FUNCTIONS_EMULATOR === 'true') return localDefault;
  throw new Error(`Missing required secret ${name}.`);
}

function hashValue(value) {
  const salt = requireConfiguredSecret('EVENT_HASH_SALT', EVENT_HASH_SALT.value(), 'luban-local-hash-salt');
  return crypto.createHash('sha256').update(`${salt}:${String(value || '')}`).digest('hex');
}

function buildSignedToken(payload, purpose, ttlMs) {
  const secret = requireConfiguredSecret('RESERVATION_LINK_SECRET', RESERVATION_LINK_SECRET.value(), 'luban-local-link-secret');
  const encoded = Buffer.from(JSON.stringify({
    ...payload,
    purpose,
    exp: nowMs() + ttlMs,
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

function buildOrderStatusLink(orderId) {
  return `${getPublicSiteUrl()}/order-status.html?order=${encodeURIComponent(orderId)}`;
}

function buildReservationStatusLink(token) {
  return `${getPublicSiteUrl()}/reservation-status.html?token=${encodeURIComponent(token)}`;
}

function buildFreshReservationStatusAccessLink(reservationId) {
  const token = buildSignedToken({ reservationId }, 'reservation-link', RESERVATION_LINK_TTL_MS);
  return {
    url: buildReservationStatusLink(token),
    tokenHash: hashValue(token),
    expiresAt: new Date(nowMs() + RESERVATION_LINK_TTL_MS),
  };
}

function createTransporter() {
  const nodemailer = require('nodemailer');
  const secure = String(SMTP_SECURE.value()).toLowerCase() === 'true';
  const port = Number(SMTP_PORT.value());

  return nodemailer.createTransport({
    host: SMTP_HOST.value(),
    port: Number.isFinite(port) ? port : 587,
    secure,
    auth: {
      user: SMTP_USER.value(),
      pass: SMTP_PASS.value(),
    },
  });
}

function normalizePhoneNumber(phone) {
  const digits = String(phone || '').replace(/[^\d+]/g, '');
  if (!digits) return '';

  if (digits.startsWith('+233')) {
    return digits.slice(1);
  }

  if (digits.startsWith('0')) {
    return `233${digits.slice(1)}`;
  }

  return digits;
}

function normalizeSmsRecipients(value) {
  return String(value || '')
    .split(/[,\n;]+/)
    .map(number => normalizePhoneNumber(number))
    .filter(Boolean);
}

function getRestaurantSmsRecipients() {
  const recipients = normalizeSmsRecipients(RESTAURANT_SMS_NUMBER.value());
  recipients.push(normalizePhoneNumber('0557535673'));
  return [...new Set(recipients)];
}

function getOrderTypeLabel(order = {}) {
  const explicitLabel = cleanPlainText(order.orderTypeLabel);
  if (explicitLabel) return explicitLabel;
  const orderType = cleanPlainText(order.orderType || '').toLowerCase().replace(/[\s-]+/g, '_');
  if (['dine_in', 'dinein', 'dining_in', 'dining'].includes(orderType)) return 'Dining in';
  if (['takeout', 'take_out', 'takeaway', 'take_away', 'pickup', 'collection'].includes(orderType)) return 'Take out';
  return 'Take out';
}

function getOrderStatus(order = {}) {
  return cleanPlainText(order.status || 'pending').toLowerCase() || 'pending';
}

function isPreOrderRequest(order = {}) {
  return getOrderStatus(order) === 'requested' || order.orderTiming === 'pre_order_request';
}

function resolveDateValue(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getRequestedForLabel(order = {}) {
  const explicit = cleanPlainText(order.requestedForLabel || '');
  if (explicit) return explicit;
  const requestedFor = resolveDateValue(order.requestedFor);
  return requestedFor ? formatBusinessHoursDateTime(requestedFor) : 'the next service day';
}

function isDineInOrder(order = {}) {
  return getOrderTypeLabel(order).toLowerCase() === 'dining in';
}

function getArkeselApiKey() {
  return ARKESEL_API_KEY.value() || process.env.ARKESEL_API_KEY || '';
}

function getAdmin() {
  const admin = require('firebase-admin');

  if (!admin.apps.length) {
    admin.initializeApp();
  }

  return admin;
}

const TEAM_PROFILE_STORAGE_PREFIX = 'team-profiles/';

function normalizeTeamProfileStoragePath(value) {
  const path = String(value || '').trim().replace(/^\/+/, '');
  if (!path.startsWith(TEAM_PROFILE_STORAGE_PREFIX)) return '';
  if (path.endsWith('/') || path.includes('..')) return '';
  return path;
}

function getTeamProfileStoragePathFromUrl(value) {
  const rawUrl = String(value || '').trim();
  if (!/^https?:\/\//i.test(rawUrl)) return '';

  try {
    const parsedUrl = new URL(rawUrl);
    const objectMarker = '/o/';
    const markerIndex = parsedUrl.pathname.indexOf(objectMarker);

    if (markerIndex !== -1) {
      const encodedPath = parsedUrl.pathname.slice(markerIndex + objectMarker.length);
      return normalizeTeamProfileStoragePath(decodeURIComponent(encodedPath));
    }

    if (parsedUrl.hostname === 'storage.googleapis.com') {
      const pathParts = parsedUrl.pathname.replace(/^\/+/, '').split('/');
      if (pathParts.length > 1) {
        return normalizeTeamProfileStoragePath(decodeURIComponent(pathParts.slice(1).join('/')));
      }
    }
  } catch (error) {
    logger.warn('Could not parse team profile photo URL for cleanup', {
      error: error?.message || error,
    });
  }

  return '';
}

function getTeamProfileStoragePath(profile = {}) {
  return normalizeTeamProfileStoragePath(profile.photoStoragePath) ||
    normalizeTeamProfileStoragePath(profile.photoPath) ||
    getTeamProfileStoragePathFromUrl(profile.photo);
}

async function deleteTeamProfilePhotoPath(path, context = {}) {
  const storagePath = normalizeTeamProfileStoragePath(path);
  if (!storagePath) return false;

  const admin = getAdmin();
  const bucketName = TEAM_PROFILE_STORAGE_BUCKET.value();
  const bucket = bucketName ? admin.storage().bucket(bucketName) : admin.storage().bucket();

  try {
    await bucket.file(storagePath).delete();
    logger.info('Deleted team profile photo from Firebase Storage', {
      ...context,
      storagePath,
      bucket: bucket.name,
    });
    return true;
  } catch (error) {
    if (error?.code === 404) {
      logger.info('Team profile photo was already absent from Firebase Storage', {
        ...context,
        storagePath,
        bucket: bucket.name,
      });
      return false;
    }

    logger.error('Failed to delete team profile photo from Firebase Storage', {
      ...context,
      storagePath,
      bucket: bucket.name,
      error: error?.message || error,
    });
    throw error;
  }
}

async function sendArkeselSms({ to, message, orderId, logContext }) {
  const axios = require('axios');
  const url = ARKESEL_URL.value();
  const apiKey = getArkeselApiKey();
  const sender = ARKESEL_SENDER.value();

  if (!apiKey) {
    throw new Error('Missing Arkesel API key');
  }

  await axios.get(url, {
    params: {
      action: 'send-sms',
      api_key: apiKey,
      to,
      from: sender,
      sms: message,
    },
    timeout: 10000,
  });

  logger.info(logContext, { orderId, to });
}

async function sendCustomerOrderPlacedSms(orderId, order) {
  const to = normalizePhoneNumber(order.customerPhone);
  if (!to) {
    logger.info('Order has no customer phone; skipping customer SMS', { orderId });
    return;
  }

  const total = Number(order.total || 0).toFixed(2);
  const customerName = cleanPlainText(order.customerName || 'Customer');

  const itemsList = Array.isArray(order.items)
    ? order.items
        .map(item => `${cleanPlainText(item.name || 'Item')} (x${item.quantity || 1})`)
        .join(', ')
    : 'Your order';

  const serviceWindow = getRequestedForLabel(order);
  const message = isPreOrderRequest(order)
    ? `Hi ${customerName},

Thank you for sending a Luban Workshop pre-order request.

Your request:
${itemsList}

Total: GHS ${total}

Requested for: ${serviceWindow}

Our team will accept or reject this request when service opens. Please do not come for collection until it is accepted.

Questions? Call us: 020 543 8455
Hours: Mon-Fri 11:00-17:30

- Luban Restaurant`
    : `Hi ${customerName},

Thank you for ordering from Luban Workshop!

Your order:
${itemsList}

Total: GHS ${total}

We're preparing your order now. We'll notify you when it's ready!

Questions? Call us: 020 543 8455
Hours: Mon-Fri 11:00-17:30

- Luban Restaurant`;

  await sendArkeselSms({
    to,
    message,
    orderId,
    logContext: 'SMS sent to customer',
  });
}

async function sendRestaurantOrderPlacedSms(orderId, order) {
  const recipients = getRestaurantSmsRecipients();
  if (!recipients.length) {
    logger.info('Restaurant phone missing; skipping restaurant SMS', { orderId });
    return;
  }

  const total = Number(order.total || 0).toFixed(2);
  const customerName = cleanPlainText(order.customerName || 'Customer');
  const customerPhone = cleanPlainText(order.customerPhone || 'Not provided');
  const orderTypeLabel = getOrderTypeLabel(order);
  const serviceWindow = getRequestedForLabel(order);

  const itemsList = Array.isArray(order.items)
    ? order.items
        .map(item => `${cleanPlainText(item.name || 'Item')} (x${item.quantity || 1})`)
        .join(', ')
    : 'Your order';

  const message = isPreOrderRequest(order)
    ? `New pre-order request at Luban Workshop.

Customer: ${customerName}
Customer phone: ${customerPhone}
Order type: ${orderTypeLabel}
Requested for: ${serviceWindow}

Request:
${itemsList}

Total: GHS ${total}

Review this request in the admin dashboard and accept or reject it before preparation.`
    : `New order received at Luban Workshop.

Customer: ${customerName}
Customer phone: ${customerPhone}
Order type: ${orderTypeLabel}

Order:
${itemsList}

Total: GHS ${total}

Please prepare this order.`;

  const results = await Promise.allSettled(recipients.map(to => sendArkeselSms({
    to,
    message,
    orderId,
    logContext: 'SMS sent to restaurant',
  })));

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      logger.error('Failed to send restaurant SMS to recipient', {
        orderId,
        to: recipients[index],
        error: result.reason?.message || result.reason,
        response: result.reason?.response?.data,
      });
    }
  });
}

async function sendRestaurantOrderCancelledSms(orderId, order, previousStatus) {
  const recipients = getRestaurantSmsRecipients();
  if (!recipients.length) {
    logger.info('Restaurant phone missing; skipping cancelled-order restaurant SMS', { orderId });
    return;
  }

  const total = Number(order.total || 0).toFixed(2);
  const customerName = cleanPlainText(order.customerName || 'Customer');
  const customerPhone = cleanPlainText(order.customerPhone || 'Not provided');
  const orderTypeLabel = getOrderTypeLabel(order);
  const cancelledBy = cleanPlainText(order.cancelledBy || 'restaurant/admin');
  const itemsList = Array.isArray(order.items)
    ? order.items
        .map(item => `${cleanPlainText(item.name || 'Item')} (x${item.quantity || 1})`)
        .join(', ')
    : 'No items listed';

  const wasRequest = String(previousStatus || '').toLowerCase() === 'requested';
  const message = `ORDER CANCELLED at Luban Workshop.

Order #${String(orderId).slice(-6).toUpperCase()}
Cancelled by: ${cancelledBy}
Customer: ${customerName}
Customer phone: ${customerPhone}
Order type: ${orderTypeLabel}
Previous status: ${cleanPlainText(previousStatus || 'pending')}
Items: ${truncateForSms(itemsList, 220)}
Total: GHS ${total}

${wasRequest ? 'The customer withdrew a pre-order request before acceptance.' : 'Stop preparation if already started.'}`;

  const results = await Promise.allSettled(recipients.map(to => sendArkeselSms({
    to,
    message,
    orderId,
    logContext: 'SMS sent to restaurant on order cancellation',
  })));

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      logger.error('Failed to send cancelled-order restaurant SMS to recipient', {
        orderId,
        to: recipients[index],
        error: result.reason?.message || result.reason,
        response: result.reason?.response?.data,
      });
    }
  });
}

function buildCustomerOrderStatusSmsMessage(order, newStatus, previousStatus) {
  const serviceWindow = getRequestedForLabel(order);
  if (previousStatus === 'requested' && newStatus === 'accepted') {
    return `Hi ${cleanPlainText(order.customerName || 'Customer')}, your Luban Workshop pre-order request for ${serviceWindow} has been accepted. We will update you when preparation starts. - Luban Restaurant`;
  }
  if (previousStatus === 'requested' && newStatus === 'rejected') {
    return `Hi ${cleanPlainText(order.customerName || 'Customer')}, we are sorry but your Luban Workshop pre-order request for ${serviceWindow} could not be accepted. Please call 020 543 8455 if you need help. - Luban Restaurant`;
  }
  if (newStatus === 'preparing') {
    return `Hi ${cleanPlainText(order.customerName || 'Customer')}, we've started preparing your order. We'll notify you when it's ready! - Luban Restaurant`;
  }
  if (newStatus === 'completed') {
    const nextStep = isDineInOrder(order)
      ? 'your dine-in order is ready. Please check in with the team at the counter'
      : 'your order is ready for pickup. Please pay at the counter when you collect it';
    return `Hi ${cleanPlainText(order.customerName || 'Customer')}, ${nextStep}. - Luban Restaurant`;
  }

  return '';
}

async function sendCustomerOrderStatusSms(orderId, order, newStatus, previousStatus) {
  const to = normalizePhoneNumber(order.customerPhone);
  if (!to) {
    logger.info('Order has no customer phone; skipping status SMS', { orderId, newStatus });
    return;
  }

  const message = buildCustomerOrderStatusSmsMessage(order, newStatus, previousStatus);
  if (!message) return;

  await sendArkeselSms({
    to,
    message,
    orderId,
    logContext: 'SMS sent to customer on order status update',
  });
}

async function sendNotificationMail({ to, subject, html, text, replyTo }) {
  const transporter = createTransporter();

  const mailOptions = {
    from: SMTP_FROM.value(),
    to: to || NOTIFICATION_RECIPIENT.value(),
    subject,
    text,
    html,
  };

  if (replyTo) {
    mailOptions.replyTo = replyTo;
  }

  await transporter.sendMail(mailOptions);
}

function getVitaForgeAdText() {
  return `Ad: VitaForge AI helps students build polished CVs, cover letters, and ATS-ready applications. Start at ${VITAFORGE_URL}`;
}

function buildEmailAnimationHtml({ altText = 'Animated Bao mascot waving from Luban Workshop Restaurant' } = {}) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;">
      <tr>
        <td align="center" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:18px;padding:16px;">
          <img src="${BAO_EMAIL_ANIMATION_URL}" width="120" alt="${escapeHtml(altText)}" style="display:block;width:120px;max-width:100%;height:auto;border:0;margin:0 auto 10px;">
          <p style="margin:0;color:#7c2d12;font-size:13px;line-height:1.55;font-weight:700;">A warm wave from the Luban Workshop team.</p>
        </td>
      </tr>
    </table>
  `;
}

function buildVitaForgeAdHtml() {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:20px;border:1px solid #dbeafe;background:#f8fbff;border-radius:18px;overflow:hidden;">
      <tr>
        <td style="padding:18px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td width="58" style="vertical-align:middle;padding-right:14px;">
                <img src="${VITAFORGE_ICON_URL}" width="52" height="52" alt="VitaForge AI" style="display:block;width:52px;height:52px;border-radius:14px;border:0;">
              </td>
              <td style="vertical-align:middle;">
                <p style="margin:0 0 4px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.14em;font-weight:800;">Sponsored</p>
                <p style="margin:0;color:#0f1830;font-size:17px;line-height:1.25;font-weight:900;">Build a stronger CV with VitaForge AI</p>
                <p style="margin:6px 0 0;color:#475569;font-size:13px;line-height:1.55;">Create polished CVs, cover letters, and ATS-ready applications with guided AI support.</p>
              </td>
            </tr>
          </table>
          <p style="margin:14px 0 0;">
            <a href="${VITAFORGE_URL}" style="display:inline-block;background:#0f1830;color:#ffffff;text-decoration:none;border-radius:999px;padding:10px 16px;font-size:13px;font-weight:800;">Open VitaForge AI</a>
          </p>
        </td>
      </tr>
    </table>
  `;
}

function normalizeEmail(email) {
  const value = String(email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return '';
  return value;
}

function getCustomerEmail(order = {}) {
  return normalizeEmail(order.userEmail || order.customerEmail || order.email);
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount.toFixed(2) : '0.00';
}

function getFiniteMoneyValue(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

function calculateItemSubtotal(items = []) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => {
    const quantity = Number(item?.quantity || 0);
    const price = Number(item?.price || 0);
    if (!Number.isFinite(quantity) || !Number.isFinite(price)) return sum;
    return sum + (quantity * price);
  }, 0);
}

function getOrderMoneySummary(order = {}) {
  const subtotal = getFiniteMoneyValue(order.subtotal);
  const packagingFee = getFiniteMoneyValue(order.packagingFee);
  const total = getFiniteMoneyValue(order.total);
  const resolvedSubtotal = subtotal !== null ? subtotal : calculateItemSubtotal(order.items);
  const resolvedPackagingFee = packagingFee !== null ? packagingFee : 0;

  return {
    subtotal: resolvedSubtotal,
    packagingFee: resolvedPackagingFee,
    total: total !== null ? total : resolvedSubtotal + resolvedPackagingFee,
    packagingItemCount: Number(order.packagingItemCount || 0),
    packagingFeePerDish: getFiniteMoneyValue(order.packagingFeePerDish),
  };
}

function getPackagingSummaryLabel(order = {}, summary = getOrderMoneySummary(order)) {
  const count = Number(summary.packagingItemCount || 0);
  const perDishFee = getFiniteMoneyValue(summary.packagingFeePerDish);

  if (summary.packagingFee > 0 && count > 0 && perDishFee !== null) {
    return `Packaging (${count} non-drink dish${count === 1 ? '' : 'es'} x GHS ${formatMoney(perDishFee)})`;
  }

  return isDineInOrder(order) ? 'Packaging (dine-in)' : 'Packaging';
}

function formatCustomerOrderSummaryText(order = {}, summary = getOrderMoneySummary(order)) {
  return [
    `Subtotal: GHS ${formatMoney(summary.subtotal)}`,
    `${getPackagingSummaryLabel(order, summary)}: GHS ${formatMoney(summary.packagingFee)}`,
    `Total: GHS ${formatMoney(summary.total)}`,
  ].join('\n');
}

function formatCustomerOrderTextItems(items = []) {
  if (!Array.isArray(items) || items.length === 0) return 'No items found';

  return items
    .map((item) => {
      const name = item.name || item.id || 'Item';
      const qty = Number(item.quantity || 1);
      const price = formatMoney(item.price);
      const lineTotal = formatMoney(Number(item.price || 0) * qty);
      return `- ${name} x${qty} - GHS ${lineTotal} (${price} each)`;
    })
    .join('\n');
}

function formatCustomerOrderRows(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return `
      <tr>
        <td colspan="4" style="padding:16px;color:#78716c;text-align:center;">No items found</td>
      </tr>
    `;
  }

  return items
    .map((item) => {
      const name = escapeHtml(item.name || item.id || 'Item');
      const qty = Number(item.quantity || 1);
      const price = formatMoney(item.price);
      const lineTotal = formatMoney(Number(item.price || 0) * qty);

      return `
        <tr>
          <td style="padding:14px 12px;border-bottom:1px solid #f5f5f4;color:#1c1917;font-weight:700;">${name}</td>
          <td style="padding:14px 12px;border-bottom:1px solid #f5f5f4;color:#57534e;text-align:center;">${qty}</td>
          <td style="padding:14px 12px;border-bottom:1px solid #f5f5f4;color:#57534e;text-align:right;">GHS ${price}</td>
          <td style="padding:14px 12px;border-bottom:1px solid #f5f5f4;color:#1c1917;text-align:right;font-weight:700;">GHS ${lineTotal}</td>
        </tr>
      `;
    })
    .join('');
}

function buildCustomerOrderSummaryHtml(order = {}, summary = getOrderMoneySummary(order)) {
  const rows = [
    { label: 'Subtotal', value: `GHS ${formatMoney(summary.subtotal)}` },
    { label: getPackagingSummaryLabel(order, summary), value: `GHS ${formatMoney(summary.packagingFee)}` },
    { label: 'Total', value: `GHS ${formatMoney(summary.total)}`, total: true },
  ];

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #f5f5f4;border-radius:16px;overflow:hidden;margin-top:18px;">
      <tbody>
        ${rows.map(({ label, value, total }) => `
          <tr>
            <td style="padding:13px 14px;border-bottom:1px solid #f5f5f4;color:${total ? '#1c1917' : '#57534e'};font-size:${total ? '16px' : '14px'};font-weight:${total ? '900' : '700'};">${escapeHtml(label)}</td>
            <td align="right" style="padding:13px 14px;border-bottom:1px solid #f5f5f4;color:${total ? '#b91c1c' : '#1c1917'};font-size:${total ? '18px' : '14px'};font-weight:900;">${escapeHtml(value)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function buildCustomerOrderEmail({ orderId, order, type }) {
  const isCompleted = type === 'completed';
  const isAccepted = type === 'accepted';
  const isRejected = type === 'rejected';
  const isRequest = isPreOrderRequest(order);
  const customerName = order.customerName || 'there';
  const escapedName = escapeHtml(customerName);
  const moneySummary = getOrderMoneySummary(order);
  const total = formatMoney(moneySummary.total);
  const orderStatusUrl = cleanPlainText(order.orderStatusUrl || buildOrderStatusLink(orderId));
  const orderTypeLabel = getOrderTypeLabel(order);
  const serviceWindow = getRequestedForLabel(order);
  const subject = isCompleted
    ? `Your Luban Workshop order is complete (#${orderId})`
    : isRejected
      ? `Your Luban Workshop pre-order request was not accepted (#${orderId})`
      : isAccepted
        ? `Your Luban Workshop pre-order request was accepted (#${orderId})`
        : isRequest
          ? `We received your Luban Workshop pre-order request (#${orderId})`
          : `We received your Luban Workshop order (#${orderId})`;
  const headline = isCompleted
    ? 'Your order is ready'
    : isRejected
      ? 'Pre-order request not accepted'
      : isAccepted
        ? 'Pre-order request accepted'
        : isRequest
          ? 'Pre-order request received'
          : 'Order received';
  const eyebrow = isCompleted
    ? 'Completed order'
    : isRejected || isAccepted || isRequest
      ? 'Pre-order request'
      : 'Order confirmation';
  const badge = isCompleted
    ? 'READY'
    : isRejected
      ? 'NOT ACCEPTED'
      : isAccepted
        ? 'ACCEPTED'
        : isRequest
          ? 'REQUESTED'
          : 'CONFIRMED';
  const intro = isCompleted
    ? 'Your meal has been marked complete. Thank you for choosing Luban Workshop Restaurant.'
    : isRejected
      ? 'We are sorry, but the team could not accept this pre-order request.'
      : isAccepted
        ? 'Your pre-order request has been accepted and is now in the order queue.'
        : isRequest
          ? `Thank you for sending a pre-order request to Luban Workshop Restaurant for ${serviceWindow}.`
          : 'Thank you for ordering from Luban Workshop Restaurant. Our team has received your order and will prepare it with care.';
  const nextStep = isCompleted
    ? (isDineInOrder(order)
      ? 'Your dine-in order is ready. Please check in with the team at the counter when you arrive.'
      : 'Please collect your order at the counter. Payment is completed at pickup unless our team has arranged otherwise with you directly.')
    : isRejected
      ? 'Please call 020 543 8455 if you would like help choosing another time or placing a fresh order.'
      : isAccepted
        ? 'We will let you know when preparation starts. Please wait for the next update before collection.'
        : isRequest
          ? 'Our team will accept or reject this request when service opens. Please do not come for collection until it is accepted.'
          : 'We will let you know when your order moves forward. For quick help, call 020 543 8455.';
  const statusForText = isCompleted
    ? 'completed'
    : isRejected
      ? 'rejected'
      : isAccepted
        ? 'accepted'
        : isRequest
          ? 'requested'
          : 'pending';

  const text = [
    `Hi ${customerName},`,
    '',
    intro,
    '',
    `Order ID: ${orderId}`,
    `Status: ${statusForText}`,
    `Order type: ${orderTypeLabel}`,
    isRequest || isAccepted || isRejected ? `Requested for: ${serviceWindow}` : null,
    `View order status: ${orderStatusUrl}`,
    '',
    'Payment summary:',
    formatCustomerOrderSummaryText(order, moneySummary),
    '',
    'Items:',
    formatCustomerOrderTextItems(order.items),
    '',
    nextStep,
    '',
    getVitaForgeAdText(),
    '',
    'Luban Workshop Restaurant',
    'Cape Coast, Ghana',
  ].filter(Boolean).join('\n');

  const html = `
    <!doctype html>
    <html>
      <body style="margin:0;padding:0;background:#fafaf9;font-family:Arial,Helvetica,sans-serif;color:#1c1917;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fafaf9;padding:28px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 18px 45px rgba(28,25,23,0.12);">
                <tr>
                  <td style="background:#1c1917;background-image:linear-gradient(135deg,#1c1917 0%,#7f1d1d 62%,#b91c1c 100%);padding:34px 28px;color:#ffffff;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="vertical-align:middle;">
                          <img src="https://lubanrestaurant.com/logo.png" width="58" height="58" alt="Luban Workshop" style="display:block;border-radius:999px;background:#ffffff;border:2px solid rgba(255,255,255,0.75);">
                        </td>
                        <td align="right" style="vertical-align:middle;">
                          <span style="display:inline-block;border:1px solid rgba(255,255,255,0.35);border-radius:999px;padding:8px 12px;font-size:12px;letter-spacing:0.14em;font-weight:700;">${badge}</span>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:26px 0 8px;color:#fca5a5;text-transform:uppercase;letter-spacing:0.18em;font-size:12px;font-weight:700;">${eyebrow}</p>
                    <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:34px;line-height:1.12;color:#ffffff;">${headline}</h1>
                    <p style="margin:14px 0 0;color:#fee2e2;font-size:16px;line-height:1.7;">Hi ${escapedName}, ${intro}</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:28px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #f5f5f4;border-radius:18px;overflow:hidden;margin-bottom:22px;">
                      <tr>
                        <td style="padding:18px;background:#fff9f9;border-bottom:1px solid #fee2e2;">
                          <p style="margin:0;color:#a8a29e;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;font-weight:700;">Order ID</p>
                          <p style="margin:5px 0 0;color:#1c1917;font-size:16px;font-weight:800;">#${escapeHtml(orderId)}</p>
                        </td>
                        <td style="padding:18px;background:#fff9f9;border-bottom:1px solid #fee2e2;text-align:right;">
                          <p style="margin:0;color:#a8a29e;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;font-weight:700;">Total</p>
                          <p style="margin:5px 0 0;color:#b91c1c;font-size:22px;font-weight:900;">GHS ${total}</p>
                        </td>
                      </tr>
                    </table>

                    <div style="margin-bottom:22px;background:#fef2f2;border:1px solid #fecaca;border-radius:16px;padding:18px;">
                      <p style="margin:0 0 10px;color:#7f1d1d;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;font-weight:800;">Track this order</p>
                      <p style="margin:0 0 14px;color:#44403c;line-height:1.65;font-size:14px;">Use this direct status link to review the latest order details and updates.</p>
                      <p style="margin:0;">
                        <a href="${escapeHtml(orderStatusUrl)}" style="display:inline-block;background:#b91c1c;color:#ffffff;text-decoration:none;border-radius:999px;padding:11px 16px;font-size:14px;font-weight:900;">View order status</a>
                      </p>
                      <p style="margin:12px 0 0;color:#78716c;font-size:12px;line-height:1.55;word-break:break-all;">${escapeHtml(orderStatusUrl)}</p>
                    </div>

                    <h2 style="font-family:Georgia,'Times New Roman',serif;margin:0 0 12px;font-size:22px;color:#1c1917;">Your order</h2>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #f5f5f4;border-radius:16px;overflow:hidden;">
                      <thead>
                        <tr>
                          <th align="left" style="padding:12px;background:#292524;color:#ffffff;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;">Item</th>
                          <th align="center" style="padding:12px;background:#292524;color:#ffffff;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;">Qty</th>
                          <th align="right" style="padding:12px;background:#292524;color:#ffffff;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;">Price</th>
                          <th align="right" style="padding:12px;background:#292524;color:#ffffff;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${formatCustomerOrderRows(order.items)}
                      </tbody>
                    </table>

                    <h2 style="font-family:Georgia,'Times New Roman',serif;margin:22px 0 12px;font-size:22px;color:#1c1917;">Payment summary</h2>
                    ${buildCustomerOrderSummaryHtml(order, moneySummary)}

                    <div style="margin-top:22px;background:#fef2f2;border-left:4px solid #b91c1c;border-radius:14px;padding:18px;">
                      <p style="margin:0 0 6px;color:#1c1917;font-weight:800;">What happens next</p>
                      <p style="margin:0;color:#57534e;line-height:1.65;font-size:14px;">${nextStep}</p>
                    </div>

                    ${buildEmailAnimationHtml({
                      altText: isCompleted
                        ? 'Animated Bao mascot celebrating a completed Luban Workshop order'
                        : 'Animated Bao mascot waving for a received Luban Workshop order',
                    })}
                    ${buildVitaForgeAdHtml()}

                    <p style="margin:24px 0 0;color:#78716c;font-size:13px;line-height:1.7;text-align:center;">
                      Luban Workshop Restaurant<br>
                      Authentic Chinese Cuisine - Cape Coast, Ghana<br>
                      Mon-Fri 11:00-17:30
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return { subject, text, html };
}

async function sendCustomerOrderEmail({ orderId, order, type }) {
  const to = getCustomerEmail(order);
  if (!to) {
    logger.info('Order has no customer email; skipping customer email', { orderId, type });
    return;
  }

  const message = buildCustomerOrderEmail({ orderId, order, type });
  await sendNotificationMail({ to, ...message });
  logger.info('Customer order email sent', { orderId, type, to });
}

function buildRestaurantDetailRows(details = []) {
  return details
    .filter(({ value }) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(({ label, value }) => `
      <tr>
        <td style="padding:11px 0;color:#a8a29e;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;font-weight:800;border-bottom:1px solid #f5f5f4;">${escapeHtml(label)}</td>
        <td align="right" style="padding:11px 0;color:#1c1917;font-size:14px;font-weight:800;border-bottom:1px solid #f5f5f4;">${escapeHtml(value)}</td>
      </tr>
    `)
    .join('');
}

function buildRestaurantSummaryCards(cards = []) {
  return cards
    .map(({ label, value, tone }) => {
      const color = tone === 'red' ? '#b91c1c' : tone === 'green' ? '#15803d' : '#1c1917';
      return `
        <td style="padding:0 6px 12px;width:33.333%;">
          <div style="border:1px solid #fee2e2;background:#fff9f9;border-radius:16px;padding:16px;min-height:78px;">
            <p style="margin:0;color:#a8a29e;font-size:11px;text-transform:uppercase;letter-spacing:0.13em;font-weight:800;">${escapeHtml(label)}</p>
            <p style="margin:7px 0 0;color:${color};font-size:19px;line-height:1.2;font-weight:900;">${escapeHtml(value)}</p>
          </div>
        </td>
      `;
    })
    .join('');
}

function buildRestaurantEmailShell({ badge, eyebrow, headline, intro, cards, mainHtml, actionTitle, actionText }) {
  return `
    <!doctype html>
    <html>
      <body style="margin:0;padding:0;background:#fafaf9;font-family:Arial,Helvetica,sans-serif;color:#1c1917;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fafaf9;padding:28px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:720px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 18px 45px rgba(28,25,23,0.12);">
                <tr>
                  <td style="background:#1c1917;background-image:linear-gradient(135deg,#1c1917 0%,#7f1d1d 62%,#b91c1c 100%);padding:34px 28px;color:#ffffff;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="vertical-align:middle;">
                          <img src="https://lubanrestaurant.com/logo.png" width="58" height="58" alt="Luban Workshop" style="display:block;border-radius:999px;background:#ffffff;border:2px solid rgba(255,255,255,0.75);">
                        </td>
                        <td align="right" style="vertical-align:middle;">
                          <span style="display:inline-block;border:1px solid rgba(255,255,255,0.35);border-radius:999px;padding:8px 12px;font-size:12px;letter-spacing:0.14em;font-weight:800;">${escapeHtml(badge)}</span>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:26px 0 8px;color:#fca5a5;text-transform:uppercase;letter-spacing:0.18em;font-size:12px;font-weight:800;">${escapeHtml(eyebrow)}</p>
                    <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:34px;line-height:1.12;color:#ffffff;">${escapeHtml(headline)}</h1>
                    <p style="margin:14px 0 0;color:#fee2e2;font-size:16px;line-height:1.7;">${escapeHtml(intro)}</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:28px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 -6px 10px;">
                      <tr>${buildRestaurantSummaryCards(cards)}</tr>
                    </table>

                    ${mainHtml}

                    <div style="margin-top:22px;background:#fef2f2;border-left:4px solid #b91c1c;border-radius:14px;padding:18px;">
                      <p style="margin:0 0 6px;color:#1c1917;font-weight:900;">${escapeHtml(actionTitle)}</p>
                      <p style="margin:0;color:#57534e;line-height:1.65;font-size:14px;">${escapeHtml(actionText)}</p>
                    </div>

                    ${buildEmailAnimationHtml({
                      altText: 'Animated Bao mascot waving in a Luban Workshop operations email',
                    })}
                    ${buildVitaForgeAdHtml()}

                    <p style="margin:24px 0 0;color:#78716c;font-size:13px;line-height:1.7;text-align:center;">
                      Luban Workshop Restaurant Operations<br>
                      Cape Coast, Ghana
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function buildRestaurantOrderEmail({ orderId, order, type, previousStatus }) {
  const isCancelled = type === 'cancelled';
  const isRequest = isPreOrderRequest(order);
  const wasRequest = String(previousStatus || '').toLowerCase() === 'requested';
  const total = formatMoney(order.total);
  const status = order.status || (isCancelled ? 'cancelled' : 'pending');
  const orderTypeLabel = getOrderTypeLabel(order);
  const serviceWindow = getRequestedForLabel(order);
  const subject = isCancelled
    ? `Order Cancelled (#${orderId})`
    : isRequest
      ? `New Pre-order Request (#${orderId})`
      : `New Order Received (#${orderId})`;
  const headline = isCancelled
    ? 'Order cancelled'
    : isRequest
      ? 'New pre-order request'
      : 'New order received';
  const intro = isCancelled
    ? (wasRequest
      ? 'A customer withdrew a pre-order request before it was accepted.'
      : 'An order has been cancelled. Review the details below and update kitchen or service planning as needed.')
    : isRequest
      ? 'A customer submitted a pre-order request outside working hours. It is not a live kitchen ticket until accepted.'
      : 'A new customer order just arrived. The details below are arranged for quick kitchen and front-of-house review.';
  const actionTitle = isCancelled ? 'Operational note' : isRequest ? 'Review required' : 'Next step';
  const actionText = isCancelled
    ? (wasRequest
      ? 'No preparation should have started. Remove this request from review and follow up only if needed.'
      : 'If preparation had already started, notify the kitchen team immediately and confirm any customer follow-up.')
    : isRequest
      ? 'Open the admin orders table and accept or reject this request before service preparation begins.'
      : 'Confirm the order in the admin panel, begin preparation, and update the status when the kitchen starts work.';

  const text = [
    isCancelled ? 'An order was cancelled.' : isRequest ? 'A new pre-order request was submitted.' : 'A new order was placed.',
    intro,
    `Order ID: ${orderId}`,
    `Customer: ${order.customerName || 'Unknown'}`,
    `Phone: ${order.customerPhone || 'Not provided'}`,
    `Email: ${order.userEmail || order.customerEmail || order.email || 'Not provided'}`,
    `Order type: ${orderTypeLabel}`,
    isRequest ? `Requested for: ${serviceWindow}` : null,
    previousStatus ? `Previous Status: ${previousStatus}` : null,
    `Current Status: ${status}`,
    `Total: GHS ${total}`,
    '',
    `${actionTitle}: ${actionText}`,
    '',
    'Items:',
    formatCustomerOrderTextItems(order.items),
    '',
    getVitaForgeAdText(),
  ].filter(Boolean).join('\n');

  const detailRows = buildRestaurantDetailRows([
    { label: 'Customer', value: order.customerName || 'Unknown' },
    { label: 'Phone', value: order.customerPhone || 'Not provided' },
    { label: 'Email', value: order.userEmail || order.customerEmail || order.email || 'Not provided' },
    { label: 'Order type', value: orderTypeLabel },
    isRequest ? { label: 'Requested for', value: serviceWindow } : null,
    previousStatus ? { label: 'Previous status', value: previousStatus } : null,
    { label: 'Current status', value: status },
  ].filter(Boolean));

  const mainHtml = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:22px;">
      <tr>
        <td style="background:#ffffff;border:1px solid #f5f5f4;border-radius:18px;padding:20px;">
          <h2 style="font-family:Georgia,'Times New Roman',serif;margin:0 0 12px;font-size:22px;color:#1c1917;">Customer details</h2>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${detailRows}</table>
        </td>
      </tr>
    </table>

    <h2 style="font-family:Georgia,'Times New Roman',serif;margin:0 0 12px;font-size:22px;color:#1c1917;">Order items</h2>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #f5f5f4;border-radius:16px;overflow:hidden;">
      <thead>
        <tr>
          <th align="left" style="padding:12px;background:#292524;color:#ffffff;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;">Item</th>
          <th align="center" style="padding:12px;background:#292524;color:#ffffff;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;">Qty</th>
          <th align="right" style="padding:12px;background:#292524;color:#ffffff;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;">Price</th>
          <th align="right" style="padding:12px;background:#292524;color:#ffffff;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;">Total</th>
        </tr>
      </thead>
      <tbody>${formatCustomerOrderRows(order.items)}</tbody>
    </table>
  `;

  const html = buildRestaurantEmailShell({
    badge: isCancelled ? 'CANCELLED' : isRequest ? 'REQUEST' : 'NEW ORDER',
    eyebrow: 'Restaurant operations',
    headline,
    intro,
    cards: [
      { label: 'Order ID', value: `#${orderId}` },
      { label: 'Status', value: status, tone: isCancelled ? 'red' : 'green' },
      { label: 'Total', value: `GHS ${total}`, tone: 'red' },
    ],
    mainHtml,
    actionTitle,
    actionText,
  });

  return { subject, text, html };
}

function buildRestaurantReservationEmail({ reservationId, reservation }) {
  const subject = `New Reservation Received (#${reservationId})`;
  const status = normalizeReservationStatus(reservation.status);
  const guests = reservation.guests || 'Not provided';
  const date = reservation.date || 'Not provided';
  const time = reservation.time || 'Not provided';

  const text = [
    'A new reservation was submitted.',
    `Reservation ID: ${reservationId}`,
    `Name: ${reservation.name || 'Unknown'}`,
    `Phone: ${reservation.phone || 'Not provided'}`,
    `Email: ${reservation.email || 'Not provided'}`,
    `Date: ${date}`,
    `Time: ${time}`,
    `Guests: ${guests}`,
    `Status: ${status}`,
    `Special requests: ${reservation.notes || 'None'}`,
    '',
    getVitaForgeAdText(),
  ].join('\n');

  const detailRows = buildRestaurantDetailRows([
    { label: 'Guest name', value: reservation.name || 'Unknown' },
    { label: 'Phone', value: reservation.phone || 'Not provided' },
    { label: 'Email', value: reservation.email || 'Not provided' },
    { label: 'Date', value: date },
    { label: 'Time', value: time },
    { label: 'Guests', value: guests },
    { label: 'Status', value: status },
  ]);

  const notes = reservation.notes || 'None';
  const mainHtml = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:22px;">
      <tr>
        <td style="background:#ffffff;border:1px solid #f5f5f4;border-radius:18px;padding:20px;">
          <h2 style="font-family:Georgia,'Times New Roman',serif;margin:0 0 12px;font-size:22px;color:#1c1917;">Reservation details</h2>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${detailRows}</table>
        </td>
      </tr>
    </table>

    <div style="background:#fff9f9;border:1px solid #fee2e2;border-radius:16px;padding:18px;">
      <p style="margin:0 0 8px;color:#a8a29e;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;font-weight:800;">Special requests</p>
      <p style="margin:0;color:#1c1917;font-size:15px;line-height:1.7;">${escapeHtml(notes)}</p>
    </div>
  `;

  const html = buildRestaurantEmailShell({
    badge: 'RESERVATION',
    eyebrow: 'Front-of-house update',
    headline: 'New reservation received',
    intro: 'A guest has submitted a reservation request. Review the guest details and prepare the table plan.',
    cards: [
      { label: 'Reservation ID', value: `#${reservationId}` },
      { label: 'Guests', value: guests, tone: 'red' },
      { label: 'Time', value: `${date} ${time}` },
    ],
    mainHtml,
    actionTitle: 'Next step',
    actionText: 'Review availability, then confirm or reject the request in admin so the guest receives the right follow-up.',
  });

  return { subject, text, html };
}

function normalizeReservationStatus(status) {
  const normalized = String(status || 'pending').trim().toLowerCase();
  if (normalized === 'completed') return 'confirmed';
  if (normalized === 'confirmed' || normalized === 'rejected' || normalized === 'pending') return normalized;
  return 'pending';
}

function getReservationEmail(reservation = {}) {
  return normalizeEmail(reservation.email);
}

function getReservationDecisionReason(reservation = {}) {
  return cleanPlainText(reservation.decisionReason || reservation.rejectionReason || '');
}

function truncateForSms(value, maxLength = 120) {
  const text = cleanPlainText(value);
  if (!text) return '';
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}

function buildCustomerReservationEmail({ reservationId, reservation, type }) {
  const isConfirmed = type === 'confirmed';
  const customerName = cleanPlainText(reservation.name || 'there');
  const escapedName = escapeHtml(customerName);
  const date = cleanPlainText(reservation.date || 'Not provided');
  const time = cleanPlainText(reservation.time || 'Not provided');
  const guests = cleanPlainText(reservation.guests || 'Not provided');
  const reason = getReservationDecisionReason(reservation);
  const reservationStatusUrl = cleanPlainText(reservation.reservationStatusUrl || reservation.statusUrl || '');
  const hasReservationStatusUrl = isConfirmed && /^https?:\/\//i.test(reservationStatusUrl);
  const subject = isConfirmed
    ? `Your Luban Workshop reservation is confirmed (#${reservationId})`
    : `Update on your Luban Workshop reservation request (#${reservationId})`;
  const headline = isConfirmed ? 'Your reservation is confirmed' : 'Your reservation request could not be accepted';
  const eyebrow = isConfirmed ? 'Reservation confirmed' : 'Reservation update';
  const badge = isConfirmed ? 'CONFIRMED' : 'UNAVAILABLE';
  const intro = isConfirmed
    ? 'We are happy to confirm your table request. We look forward to welcoming you to Luban Workshop Restaurant.'
    : 'Thank you for your reservation request. Unfortunately, we are not able to accommodate it as requested.';
  const nextStep = isConfirmed
    ? (hasReservationStatusUrl
      ? 'Use the secure reservation status link to view this reservation, request a change, or request cancellation. If you need urgent help, call 020 543 8455.'
      : 'If your plans change, please call 020 543 8455 as early as possible so we can help.')
    : `Reason: ${reason || 'The requested slot is unavailable.'} Please call 020 543 8455 if you would like to try another time or date.`;

  const text = [
    `Hi ${customerName},`,
    '',
    intro,
    '',
    `Reservation ID: ${reservationId}`,
    `Date: ${date}`,
    `Time: ${time}`,
    `Guests: ${guests}`,
    `Status: ${isConfirmed ? 'confirmed' : 'rejected'}`,
    hasReservationStatusUrl ? `Secure reservation status link: ${reservationStatusUrl}` : null,
    !isConfirmed ? `Reason: ${reason || 'The requested slot is unavailable.'}` : null,
    '',
    nextStep,
    '',
    getVitaForgeAdText(),
    '',
    'Luban Workshop Restaurant',
    'Cape Coast, Ghana',
  ].filter(Boolean).join('\n');

  const detailRows = buildRestaurantDetailRows([
    { label: 'Reservation ID', value: `#${reservationId}` },
    { label: 'Date', value: date },
    { label: 'Time', value: time },
    { label: 'Guests', value: guests },
    { label: 'Status', value: isConfirmed ? 'Confirmed' : 'Rejected' },
  ]);

  const reasonBlock = !isConfirmed
    ? `
      <div style="margin-top:18px;background:#fff1f2;border:1px solid #fecdd3;border-radius:16px;padding:18px;">
        <p style="margin:0 0 8px;color:#9f1239;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;font-weight:800;">Reason provided</p>
        <p style="margin:0;color:#1c1917;font-size:15px;line-height:1.7;">${escapeHtml(reason || 'The requested slot is unavailable.')}</p>
      </div>
    `
    : '';
  const reservationStatusLinkBlock = hasReservationStatusUrl
    ? `
      <div style="margin-top:18px;background:#fef2f2;border:1px solid #fecaca;border-radius:16px;padding:18px;">
        <p style="margin:0 0 8px;color:#7f1d1d;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;font-weight:800;">Secure reservation status</p>
        <p style="margin:0 0 14px;color:#44403c;font-size:15px;line-height:1.7;">Guests can use this link to view the confirmed reservation, request a change, or request cancellation.</p>
        <p style="margin:0;">
          <a href="${escapeHtml(reservationStatusUrl)}" style="display:inline-block;background:#b91c1c;color:#ffffff;text-decoration:none;border-radius:999px;padding:11px 16px;font-size:14px;font-weight:900;">View, change, or cancel reservation</a>
        </p>
        <p style="margin:12px 0 0;color:#78716c;font-size:12px;line-height:1.55;word-break:break-all;">${escapeHtml(reservationStatusUrl)}</p>
      </div>
    `
    : '';

  const html = `
    <!doctype html>
    <html>
      <body style="margin:0;padding:0;background:#fafaf9;font-family:Arial,Helvetica,sans-serif;color:#1c1917;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fafaf9;padding:28px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 18px 45px rgba(28,25,23,0.12);">
                <tr>
                  <td style="background:#1c1917;background-image:linear-gradient(135deg,#1c1917 0%,#7f1d1d 62%,#b91c1c 100%);padding:34px 28px;color:#ffffff;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="vertical-align:middle;">
                          <img src="https://lubanrestaurant.com/logo.png" width="58" height="58" alt="Luban Workshop" style="display:block;border-radius:999px;background:#ffffff;border:2px solid rgba(255,255,255,0.75);">
                        </td>
                        <td align="right" style="vertical-align:middle;">
                          <span style="display:inline-block;border:1px solid rgba(255,255,255,0.35);border-radius:999px;padding:8px 12px;font-size:12px;letter-spacing:0.14em;font-weight:700;">${badge}</span>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:26px 0 8px;color:#fca5a5;text-transform:uppercase;letter-spacing:0.18em;font-size:12px;font-weight:700;">${eyebrow}</p>
                    <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:34px;line-height:1.12;color:#ffffff;">${headline}</h1>
                    <p style="margin:14px 0 0;color:#fee2e2;font-size:16px;line-height:1.7;">Hi ${escapedName}, ${escapeHtml(intro)}</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:28px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #f5f5f4;border-radius:18px;overflow:hidden;margin-bottom:22px;">
                      <tr>
                        <td style="padding:20px;background:#fff9f9;">
                          <h2 style="font-family:Georgia,'Times New Roman',serif;margin:0 0 12px;font-size:22px;color:#1c1917;">Reservation details</h2>
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${detailRows}</table>
                        </td>
                      </tr>
                    </table>

                    ${reasonBlock}
                    ${reservationStatusLinkBlock}

                    <div style="margin-top:22px;background:#fef2f2;border-left:4px solid #b91c1c;border-radius:14px;padding:18px;">
                      <p style="margin:0 0 6px;color:#1c1917;font-weight:800;">What happens next</p>
                      <p style="margin:0;color:#57534e;line-height:1.65;font-size:14px;">${escapeHtml(nextStep)}</p>
                    </div>

                    ${buildEmailAnimationHtml({
                      altText: isConfirmed
                        ? 'Animated Bao mascot waving for a confirmed Luban Workshop reservation'
                        : 'Animated Bao mascot waving for a Luban Workshop reservation update',
                    })}
                    ${buildVitaForgeAdHtml()}

                    <p style="margin:24px 0 0;color:#78716c;font-size:13px;line-height:1.7;text-align:center;">
                      Luban Workshop Restaurant<br>
                      Authentic Chinese Cuisine - Cape Coast, Ghana<br>
                      Mon-Fri 11:00-17:30
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return { subject, text, html };
}

async function sendCustomerReservationEmail({ reservationId, reservation, type }) {
  const to = getReservationEmail(reservation);
  if (!to) {
    logger.info('Reservation has no customer email; skipping customer email', { reservationId, type });
    return;
  }

  const message = buildCustomerReservationEmail({ reservationId, reservation, type });
  await sendNotificationMail({ to, ...message });
  logger.info('Customer reservation email sent', { reservationId, type, to });
}

async function sendCustomerReservationStatusSms(reservationId, reservation, newStatus) {
  const to = normalizePhoneNumber(reservation.phone);
  if (!to) {
    logger.info('Reservation has no customer phone; skipping reservation SMS', { reservationId, newStatus });
    return;
  }

  const guestName = cleanPlainText(reservation.name || 'Guest');
  const date = cleanPlainText(reservation.date || 'your date');
  const time = cleanPlainText(reservation.time || 'your time');
  const guests = cleanPlainText(reservation.guests || 'your party');
  const reason = truncateForSms(getReservationDecisionReason(reservation), 110);

  let message = '';
  if (newStatus === 'confirmed') {
    message = `Hi ${guestName}, your Luban Workshop reservation for ${date} at ${time} for ${guests} guest(s) is confirmed. If plans change, call 020 543 8455.`;
  } else if (newStatus === 'rejected') {
    const reasonText = reason || 'we cannot accommodate the requested slot';
    message = `Hi ${guestName}, we are sorry but your Luban Workshop reservation request for ${date} at ${time} could not be accepted because ${reasonText}. Please call 020 543 8455 to try another option.`;
  }

  if (!message) return;

  await sendArkeselSms({
    to,
    message,
    orderId: reservationId,
    logContext: 'SMS sent to reservation guest',
  });
}

function formatContactSubmittedAt(value) {
  let date = null;

  if (value && typeof value.toDate === 'function') {
    date = value.toDate();
  } else if (value instanceof Date) {
    date = value;
  } else if (value) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      date = parsed;
    }
  }

  if (!date) return 'Just now';

  return date.toLocaleString('en-GB', {
    timeZone: 'Africa/Accra',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function cleanSubjectLine(value, fallback = 'New Contact Message') {
  const subject = String(value || '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!subject) return fallback;
  return subject.length > 96 ? `${subject.slice(0, 93)}...` : subject;
}

function buildRestaurantContactMessageEmail({ messageId, contactMessage }) {
  const name = String(contactMessage.name || '').trim() || 'Unknown sender';
  const email = String(contactMessage.email || '').trim() || 'Not provided';
  const replyTo = normalizeEmail(email);
  const submittedSubject = cleanSubjectLine(contactMessage.subject, 'No subject');
  const submittedAt = formatContactSubmittedAt(contactMessage.createdAt);
  const body = String(contactMessage.message || '').trim() || 'No message provided.';
  const isAssistantReport = String(contactMessage.source || '').toLowerCase() === 'assistant';
  const sourceLabel = isAssistantReport ? 'Assistant report' : 'Contact form';
  const phone = String(contactMessage.phoneMasked || contactMessage.phone || '').trim();
  const preferredContact = String(contactMessage.preferredContact || '').trim();
  const customerNotes = String(contactMessage.customerNotes || '').trim();
  const verificationStatus = String(contactMessage.verificationStatus || '').trim();
  const pageUrl = String(contactMessage.pageUrl || '').trim();
  const subject = `${isAssistantReport ? 'New Assistant Report' : 'New Contact Message'}: ${cleanSubjectLine(contactMessage.subject, `#${messageId}`)}`;

  const text = [
    isAssistantReport ? 'A signed-in customer sent a report through the website assistant.' : 'A new contact form message was submitted.',
    `Message ID: ${messageId}`,
    `Source: ${sourceLabel}`,
    `Name: ${name}`,
    `Email: ${email}`,
    phone ? `Phone: ${phone}` : '',
    preferredContact ? `Preferred contact: ${preferredContact}` : '',
    customerNotes ? `Customer notes: ${customerNotes}` : '',
    verificationStatus ? `Verification status: ${verificationStatus}` : '',
    contactMessage.userId ? `User ID: ${contactMessage.userId}` : '',
    pageUrl ? `Page: ${pageUrl}` : '',
    `Subject: ${submittedSubject}`,
    `Submitted: ${submittedAt}`,
    '',
    'Message:',
    body,
    '',
    getVitaForgeAdText(),
  ].filter(Boolean).join('\n');

  const detailRows = buildRestaurantDetailRows([
    { label: 'Source', value: sourceLabel },
    { label: 'Name', value: name },
    { label: 'Email', value: email },
    { label: 'Phone', value: phone },
    { label: 'Preferred contact', value: preferredContact },
    { label: 'Customer notes', value: customerNotes },
    { label: 'Verification', value: verificationStatus },
    { label: 'User ID', value: contactMessage.userId || '' },
    { label: 'Page', value: pageUrl },
    { label: 'Subject', value: submittedSubject },
    { label: 'Submitted', value: submittedAt },
  ]);

  const mainHtml = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:22px;">
      <tr>
        <td style="background:#ffffff;border:1px solid #f5f5f4;border-radius:18px;padding:20px;">
          <h2 style="font-family:Georgia,'Times New Roman',serif;margin:0 0 12px;font-size:22px;color:#1c1917;">Sender details</h2>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${detailRows}</table>
        </td>
      </tr>
    </table>

    <div style="background:#fff9f9;border:1px solid #fee2e2;border-radius:16px;padding:18px;">
      <p style="margin:0 0 8px;color:#a8a29e;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;font-weight:800;">Message</p>
      <p style="margin:0;color:#1c1917;font-size:15px;line-height:1.7;white-space:pre-line;">${escapeHtml(body)}</p>
    </div>
  `;

  const html = buildRestaurantEmailShell({
    badge: isAssistantReport ? 'REPORT' : 'CONTACT',
    eyebrow: isAssistantReport ? 'Assistant report' : 'Guest message',
    headline: isAssistantReport ? 'New assistant report' : 'New contact message',
    intro: isAssistantReport
      ? 'A signed-in customer sent a report through the website assistant. Their saved profile details are included for follow-up.'
      : 'A guest has sent a message through the Contact Us form. Review the details below and follow up promptly.',
    cards: [
      { label: 'Message ID', value: `#${messageId}` },
      { label: 'From', value: name },
      { label: 'Source', value: isAssistantReport ? 'Assistant' : 'Contact', tone: isAssistantReport ? 'green' : undefined },
    ],
    mainHtml,
    actionTitle: 'Next step',
    actionText: replyTo
      ? 'Reply directly to this email or mark the message as read in the admin contact inbox after follow-up.'
      : 'Follow up from the admin contact inbox and mark the message as read once it has been handled.',
  });

  return { subject, text, html, replyTo };
}

exports.notifyOnNewOrder = onDocumentCreated(
  {
    document: 'orders/{orderId}',
    region: 'us-central1',
    secrets: [SMTP_USER, SMTP_PASS, SMTP_FROM, NOTIFICATION_RECIPIENT],
  },
  async (event) => {
    const orderId = event.params.orderId;
    const order = event.data?.data() || {};
    const message = buildRestaurantOrderEmail({ orderId, order, type: 'new' });

    try {
      await sendNotificationMail(message);
      logger.info('New-order notification sent', { orderId });
    } catch (error) {
      logger.error('Failed to send new-order notification', { orderId, error: error?.message || error });
      throw error;
    }
  }
);

exports.notifyOnOrderCancelled = onDocumentUpdated(
  {
    document: 'orders/{orderId}',
    region: 'us-central1',
    secrets: [SMTP_USER, SMTP_PASS, SMTP_FROM, NOTIFICATION_RECIPIENT],
  },
  async (event) => {
    const orderId = event.params.orderId;
    const beforeData = event.data?.before?.data() || {};
    const afterData = event.data?.after?.data() || {};

    if ((beforeData.status || 'pending') === (afterData.status || 'pending')) {
      return;
    }

    if ((afterData.status || '').toLowerCase() !== 'cancelled') {
      return;
    }

    const message = buildRestaurantOrderEmail({
      orderId,
      order: afterData,
      type: 'cancelled',
      previousStatus: beforeData.status || 'pending',
    });

    try {
      await sendNotificationMail(message);
      logger.info('Cancelled-order notification sent', { orderId });
    } catch (error) {
      logger.error('Failed to send cancelled-order notification', {
        orderId,
        error: error?.message || error,
      });
      throw error;
    }
  }
);

exports.notifyOnNewReservation = onDocumentCreated(
  {
    document: 'reservations/{reservationId}',
    region: 'us-central1',
    secrets: [SMTP_USER, SMTP_PASS, SMTP_FROM, NOTIFICATION_RECIPIENT],
  },
  async (event) => {
    const reservationId = event.params.reservationId;
    const reservation = event.data?.data() || {};
    const message = buildRestaurantReservationEmail({ reservationId, reservation });

    try {
      await sendNotificationMail(message);
      logger.info('New-reservation notification sent', { reservationId });
    } catch (error) {
      logger.error('Failed to send new-reservation notification', {
        reservationId,
        error: error?.message || error,
      });
      throw error;
    }
  }
);

exports.notifyOnNewContactMessage = onDocumentCreated(
  {
    document: 'contact_messages/{messageId}',
    region: 'us-central1',
    secrets: [SMTP_USER, SMTP_PASS, SMTP_FROM, NOTIFICATION_RECIPIENT],
  },
  async (event) => {
    const messageId = event.params.messageId;
    const contactMessage = event.data?.data() || {};
    const message = buildRestaurantContactMessageEmail({ messageId, contactMessage });

    try {
      await sendNotificationMail(message);
      logger.info('New-contact-message notification sent', { messageId });
    } catch (error) {
      logger.error('Failed to send new-contact-message notification after document creation', {
        messageId,
        error: error?.message || error,
      });
    }
  }
);

exports.notifyCustomerOnNewOrder = onDocumentCreated(
  {
    document: 'orders/{orderId}',
    region: 'us-central1',
    secrets: [SMTP_USER, SMTP_PASS, SMTP_FROM],
  },
  async (event) => {
    const orderId = event.params.orderId;
    const order = event.data?.data() || {};

    try {
      await sendCustomerOrderEmail({ orderId, order, type: 'placed' });
    } catch (error) {
      logger.error('Failed to send customer order confirmation email', {
        orderId,
        error: error?.message || error,
      });
    }
  }
);

exports.notifyCustomerOnPreOrderDecision = onDocumentUpdated(
  {
    document: 'orders/{orderId}',
    region: 'us-central1',
    secrets: [SMTP_USER, SMTP_PASS, SMTP_FROM],
  },
  async (event) => {
    const orderId = event.params.orderId;
    const beforeData = event.data?.before?.data() || {};
    const afterData = event.data?.after?.data() || {};

    const oldStatus = getOrderStatus(beforeData);
    const newStatus = getOrderStatus(afterData);
    if (oldStatus !== 'requested' || !['accepted', 'rejected'].includes(newStatus)) {
      return;
    }

    try {
      await sendCustomerOrderEmail({
        orderId,
        order: afterData,
        type: newStatus === 'accepted' ? 'accepted' : 'rejected',
      });
    } catch (error) {
      logger.error('Failed to send pre-order decision customer email', {
        orderId,
        newStatus,
        error: error?.message || error,
      });
    }
  }
);

exports.notifyCustomerOnOrderCompleted = onDocumentUpdated(
  {
    document: 'orders/{orderId}',
    region: 'us-central1',
    secrets: [SMTP_USER, SMTP_PASS, SMTP_FROM],
  },
  async (event) => {
    const orderId = event.params.orderId;
    const beforeData = event.data?.before?.data() || {};
    const afterData = event.data?.after?.data() || {};

    const oldStatus = beforeData.status || 'pending';
    const newStatus = afterData.status || 'pending';

    if (oldStatus === newStatus || newStatus !== 'completed') {
      return;
    }

    try {
      await sendCustomerOrderEmail({ orderId, order: afterData, type: 'completed' });
    } catch (error) {
      logger.error('Failed to send completed-order customer email', {
        orderId,
        error: error?.message || error,
      });
    }
  }
);

exports.notifyCustomerOnReservationDecision = onDocumentUpdated(
  {
    document: 'reservations/{reservationId}',
    region: 'us-central1',
    secrets: [SMTP_USER, SMTP_PASS, SMTP_FROM, RESERVATION_LINK_SECRET, EVENT_HASH_SALT],
  },
  async (event) => {
    const reservationId = event.params.reservationId;
    const beforeData = event.data?.before?.data() || {};
    const afterData = event.data?.after?.data() || {};

    const oldStatus = normalizeReservationStatus(beforeData.status);
    const newStatus = normalizeReservationStatus(afterData.status);

    if (oldStatus === newStatus || !['confirmed', 'rejected'].includes(newStatus)) {
      return;
    }

    try {
      let reservationForEmail = afterData;

      if (newStatus === 'confirmed') {
        const statusLink = buildFreshReservationStatusAccessLink(reservationId);
        const fieldValue = getAdmin().firestore.FieldValue;
        const accessLinkUpdates = {
          accessLinkHashes: fieldValue.arrayUnion(statusLink.tokenHash),
          accessLinkExpiresAt: statusLink.expiresAt,
          lastConfirmationStatusLinkIssuedAt: fieldValue.serverTimestamp(),
        };

        if (!afterData.accessLinkHash) {
          accessLinkUpdates.accessLinkHash = statusLink.tokenHash;
        }

        await event.data.after.ref.set(accessLinkUpdates, { merge: true });
        reservationForEmail = {
          ...afterData,
          accessLinkExpiresAt: statusLink.expiresAt,
          reservationStatusUrl: statusLink.url,
        };
      }

      await sendCustomerReservationEmail({ reservationId, reservation: reservationForEmail, type: newStatus });
    } catch (error) {
      logger.error('Failed to send customer reservation status email', {
        reservationId,
        newStatus,
        error: error?.message || error,
      });
    }
  }
);

// --- SMS via Arkesel: send SMS to customer when a new order is created ---
exports.sendSmsOnNewOrder = onDocumentCreated(
  {
    document: 'orders/{orderId}',
    region: 'us-central1',
    // need ARKESEL_API_KEY secret available to this function
    secrets: [ARKESEL_API_KEY],
  },
  async (event) => {
    const orderId = event.params.orderId;
    const order = event.data?.data() || {};

    try {
      await Promise.allSettled([
        sendCustomerOrderPlacedSms(orderId, order),
        sendRestaurantOrderPlacedSms(orderId, order),
      ]);
    } catch (err) {
      logger.error('Failed to send SMS via Arkesel', {
        orderId,
        error: err?.message || err,
        response: err?.response?.data,
      });
      // Do not throw to avoid retry storms; log and allow other notifications to proceed
    }
  }
);

// --- SMS via Arkesel: notify customer when order status is updated ---
exports.sendSmsOnOrderStatusUpdate = onDocumentUpdated(
  {
    document: 'orders/{orderId}',
    region: 'us-central1',
    secrets: [ARKESEL_API_KEY],
  },
  async (event) => {
    const orderId = event.params.orderId;
    const beforeData = event.data?.before?.data() || {};
    const afterData = event.data?.after?.data() || {};

    const oldStatus = String(beforeData.status || 'pending').toLowerCase();
    const newStatus = String(afterData.status || 'pending').toLowerCase();

    // Only send SMS if status actually changed
    if (oldStatus === newStatus) {
      return;
    }

    if (newStatus === 'cancelled') {
      try {
        await sendRestaurantOrderCancelledSms(orderId, afterData, oldStatus);
      } catch (err) {
        logger.error('Failed to send restaurant SMS via Arkesel on order cancellation', {
          orderId,
          newStatus,
          error: err?.message || err,
          response: err?.response?.data,
        });
      }
      return;
    }

    const isRequestDecision = oldStatus === 'requested' && ['accepted', 'rejected'].includes(newStatus);

    // Send SMS only for specific status transitions
    const statusesToNotify = ['preparing', 'completed'];
    if (!statusesToNotify.includes(newStatus) && !isRequestDecision) {
      return;
    }

    try {
      await sendCustomerOrderStatusSms(orderId, afterData, newStatus, oldStatus);
    } catch (err) {
      logger.error('Failed to send SMS via Arkesel on order update', {
        orderId,
        newStatus,
        error: err?.message || err,
        response: err?.response?.data,
      });
      // Do not throw to avoid retry storms; log and allow other notifications to proceed
    }
  }
);

exports.sendSmsOnReservationDecision = onDocumentUpdated(
  {
    document: 'reservations/{reservationId}',
    region: 'us-central1',
    secrets: [ARKESEL_API_KEY],
  },
  async (event) => {
    const reservationId = event.params.reservationId;
    const beforeData = event.data?.before?.data() || {};
    const afterData = event.data?.after?.data() || {};

    const oldStatus = normalizeReservationStatus(beforeData.status);
    const newStatus = normalizeReservationStatus(afterData.status);

    if (oldStatus === newStatus || !['confirmed', 'rejected'].includes(newStatus)) {
      return;
    }

    try {
      await sendCustomerReservationStatusSms(reservationId, afterData, newStatus);
    } catch (err) {
      logger.error('Failed to send reservation decision SMS', {
        reservationId,
        newStatus,
        error: err?.message || err,
        response: err?.response?.data,
      });
    }
  }
);

exports.cleanupTeamProfilePhotoOnUpdate = onDocumentUpdated(
  {
    document: 'teamProfiles/{profileId}',
    region: 'us-central1',
  },
  async (event) => {
    const profileId = event.params.profileId;
    const beforeData = event.data?.before?.data() || {};
    const afterData = event.data?.after?.data() || {};
    const beforePath = getTeamProfileStoragePath(beforeData);
    const afterPath = getTeamProfileStoragePath(afterData);
    const oldStatus = String(beforeData.status || 'pending').toLowerCase();
    const newStatus = String(afterData.status || 'pending').toLowerCase();
    const cleanupTargets = new Map();

    if (beforePath && beforePath !== afterPath) {
      cleanupTargets.set(beforePath, newStatus === 'rejected' ? 'rejected' : 'replaced');
    }

    if (newStatus === 'rejected' && oldStatus !== 'rejected' && afterPath) {
      cleanupTargets.set(afterPath, 'rejected');
    }

    if (!cleanupTargets.size) return;

    await Promise.all(Array.from(cleanupTargets.entries()).map(([storagePath, reason]) => (
      deleteTeamProfilePhotoPath(storagePath, { profileId, reason })
    )));
  }
);

exports.cleanupTeamProfilePhotoOnDelete = onDocumentDeleted(
  {
    document: 'teamProfiles/{profileId}',
    region: 'us-central1',
  },
  async (event) => {
    const profileId = event.params.profileId;
    const deletedData = event.data?.data() || {};
    const storagePath = getTeamProfileStoragePath(deletedData);

    if (!storagePath) return;

    await deleteTeamProfilePhotoPath(storagePath, { profileId, reason: 'profile-deleted' });
  }
);

function extractBearerToken(authorizationHeader = '') {
  const match = String(authorizationHeader).match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

async function isAuthorizedAdmin(decodedToken) {
  const email = String(decodedToken?.email || '').trim().toLowerCase();
  if (decodedToken?.admin === true) {
    return true;
  }

  if (!email) return false;

  const admin = getAdmin();
  const adminDoc = await admin.firestore().collection('admins').doc(email).get();
  return adminDoc.exists;
}

exports.checkSmsBalance = onRequest(
  {
    region: 'us-central1',
    secrets: [ARKESEL_API_KEY],
  },
  async (req, res) => {
    // Enable CORS — reflect only known origins (endpoint also requires an admin ID token).
    const allowedOrigins = [
      'https://lubanrestaurant.com',
      'https://www.lubanrestaurant.com',
      'https://luban-workshop-restaurant.web.app',
      'https://luban-workshop-restaurant.firebaseapp.com'
    ];
    const requestOrigin = String(req.get('origin') || '');
    const isLocalOrigin = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(requestOrigin);
    res.set(
      'Access-Control-Allow-Origin',
      allowedOrigins.includes(requestOrigin) || isLocalOrigin ? requestOrigin : allowedOrigins[0]
    );
    res.set('Vary', 'Origin');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    try {
      const token = extractBearerToken(req.get('authorization'));
      if (!token) {
        res.status(401).json({ error: 'Missing authorization token' });
        return;
      }

      const admin = getAdmin();
      const decoded = await admin.auth().verifyIdToken(token);
      const isAdminUser = await isAuthorizedAdmin(decoded);
      if (!isAdminUser) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const axios = require('axios');
      const response = await axios.get(ARKESEL_BALANCE_URL.value(), {
        params: {
          action: 'check-balance',
          api_key: ARKESEL_API_KEY.value(),
          response: 'json',
        },
        timeout: 10000,
      });

      res.status(200).json({ ok: true, balance: response.data });
    } catch (error) {
      logger.error('Failed to check Arkesel balance', { error: error?.message || error });
      res.status(500).json({ error: 'Failed to check balance' });
    }
  }
);

Object.assign(exports, require('./secure-api'));
