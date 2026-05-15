const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { onRequest } = require('firebase-functions/v2/https');
const { defineString, defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');

const SMTP_HOST = defineString('SMTP_HOST', { default: 'smtp.gmail.com' });
const SMTP_PORT = defineString('SMTP_PORT', { default: '587' });
const SMTP_SECURE = defineString('SMTP_SECURE', { default: 'false' });
const SMTP_USER = defineSecret('SMTP_USER');
const SMTP_PASS = defineSecret('SMTP_PASS');
const SMTP_FROM = defineSecret('SMTP_FROM');
const NOTIFICATION_RECIPIENT = defineSecret('NOTIFICATION_RECIPIENT');
const ARKESEL_API_KEY = defineSecret('ARKESEL_API_KEY');
const ARKESEL_SENDER = defineString('ARKESEL_SENDER', { default: 'Workshop ws' });
const RESTAURANT_SMS_NUMBER = defineString('RESTAURANT_SMS_NUMBER', { default: '020 543 8455' });
const ARKESEL_URL = defineString('ARKESEL_URL', { default: 'https://sms.arkesel.com/sms/api' });
const ARKESEL_BALANCE_URL = defineString('ARKESEL_BALANCE_URL', { default: 'https://sms.arkesel.com/sms/api' });

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatItems(items = []) {
  if (!Array.isArray(items) || items.length === 0) return '<li>No items found</li>';
  return items
    .map((item) => {
      const name = escapeHtml(item.name || item.id || 'Unknown item');
      const qty = Number(item.quantity || 0);
      const price = Number(item.price || 0);
      const lineTotal = (qty * price).toFixed(2);
      return `<li>${name} — Qty: ${qty}, Unit: ${price.toFixed(2)}, Line total: ${lineTotal}</li>`;
    })
    .join('');
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
  const customerName = escapeHtml(order.customerName || 'Customer');

  const itemsList = Array.isArray(order.items)
    ? order.items
        .map(item => `${escapeHtml(item.name || 'Item')} (x${item.quantity || 1})`)
        .join(', ')
    : 'Your order';

  const message = `Hi ${customerName},

Thank you for ordering from Luban Workshop!

📋 Your Order:
${itemsList}

💰 Total: ₵${total}

We're preparing your order now. We'll notify you when it's ready!

📞 Questions? Call us: 020 543 8455
⏰ Mon-Fri 11:00-17:30

- Luban Restaurant`;

  await sendArkeselSms({
    to,
    message,
    orderId,
    logContext: 'SMS sent to customer',
  });
}

async function sendRestaurantOrderPlacedSms(orderId, order) {
  const to = normalizePhoneNumber(RESTAURANT_SMS_NUMBER.value());
  if (!to) {
    logger.info('Restaurant phone missing; skipping restaurant SMS', { orderId });
    return;
  }

  const total = Number(order.total || 0).toFixed(2);
  const customerName = escapeHtml(order.customerName || 'Customer');
  const customerPhone = escapeHtml(order.customerPhone || 'Not provided');

  const itemsList = Array.isArray(order.items)
    ? order.items
        .map(item => `${escapeHtml(item.name || 'Item')} (x${item.quantity || 1})`)
        .join(', ')
    : 'Your order';

  const message = `New order received at Luban Workshop.

Customer: ${customerName}
Customer phone: ${customerPhone}

📋 Order:
${itemsList}

💰 Total: ₵${total}

Please prepare this order.`;

  await sendArkeselSms({
    to,
    message,
    orderId,
    logContext: 'SMS sent to restaurant',
  });
}

async function sendCustomerOrderStatusSms(orderId, order, newStatus) {
  const to = normalizePhoneNumber(order.customerPhone);
  if (!to) {
    logger.info('Order has no customer phone; skipping status SMS', { orderId, newStatus });
    return;
  }

  let message = '';
  if (newStatus === 'preparing') {
    message = `Hi ${escapeHtml(order.customerName || 'Customer')}, we've started preparing your order. We'll notify you when it's ready! - Luban Restaurant`;
  } else if (newStatus === 'completed') {
    message = `Hi ${escapeHtml(order.customerName || 'Customer')}, your order is ready! Please come pick it up or look for delivery. - Luban Restaurant`;
  }

  if (!message) return;

  await sendArkeselSms({
    to,
    message,
    orderId,
    logContext: 'SMS sent to customer on order status update',
  });
}

async function sendNotificationMail({ subject, html, text }) {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: SMTP_FROM.value(),
    to: NOTIFICATION_RECIPIENT.value(),
    subject,
    text,
    html,
  });
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

    const customerName = escapeHtml(order.customerName || 'Unknown');
    const customerPhone = escapeHtml(order.customerPhone || 'Not provided');
    const userEmail = escapeHtml(order.userEmail || 'Not provided');
    const status = escapeHtml(order.status || 'pending');
    const total = Number(order.total || 0).toFixed(2);

    const subject = `New Order Received (#${orderId})`;
    const text = [
      `A new order was placed.`,
      `Order ID: ${orderId}`,
      `Customer: ${order.customerName || 'Unknown'}`,
      `Phone: ${order.customerPhone || 'Not provided'}`,
      `Email: ${order.userEmail || 'Not provided'}`,
      `Status: ${order.status || 'pending'}`,
      `Total: ${total}`,
    ].join('\n');

    const html = `
      <h2>New Order Received</h2>
      <p><strong>Order ID:</strong> ${escapeHtml(orderId)}</p>
      <p><strong>Customer:</strong> ${customerName}</p>
      <p><strong>Phone:</strong> ${customerPhone}</p>
      <p><strong>Email:</strong> ${userEmail}</p>
      <p><strong>Status:</strong> ${status}</p>
      <p><strong>Total:</strong> ${total}</p>
      <h3>Items</h3>
      <ul>${formatItems(order.items)}</ul>
    `;

    try {
      await sendNotificationMail({ subject, html, text });
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

    const customerName = escapeHtml(afterData.customerName || 'Unknown');
    const customerPhone = escapeHtml(afterData.customerPhone || 'Not provided');
    const userEmail = escapeHtml(afterData.userEmail || 'Not provided');
    const total = Number(afterData.total || 0).toFixed(2);

    const subject = `Order Cancelled (#${orderId})`;
    const text = [
      `An order was cancelled.`,
      `Order ID: ${orderId}`,
      `Customer: ${afterData.customerName || 'Unknown'}`,
      `Phone: ${afterData.customerPhone || 'Not provided'}`,
      `Email: ${afterData.userEmail || 'Not provided'}`,
      `Previous Status: ${beforeData.status || 'pending'}`,
      `Current Status: ${afterData.status || 'cancelled'}`,
      `Total: ${total}`,
    ].join('\n');

    const html = `
      <h2>Order Cancelled</h2>
      <p><strong>Order ID:</strong> ${escapeHtml(orderId)}</p>
      <p><strong>Customer:</strong> ${customerName}</p>
      <p><strong>Phone:</strong> ${customerPhone}</p>
      <p><strong>Email:</strong> ${userEmail}</p>
      <p><strong>Previous Status:</strong> ${escapeHtml(beforeData.status || 'pending')}</p>
      <p><strong>Current Status:</strong> ${escapeHtml(afterData.status || 'cancelled')}</p>
      <p><strong>Total:</strong> ${total}</p>
      <h3>Items</h3>
      <ul>${formatItems(afterData.items)}</ul>
    `;

    try {
      await sendNotificationMail({ subject, html, text });
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

    const name = escapeHtml(reservation.name || 'Unknown');
    const phone = escapeHtml(reservation.phone || 'Not provided');
    const email = escapeHtml(reservation.email || 'Not provided');
    const date = escapeHtml(reservation.date || 'Not provided');
    const time = escapeHtml(reservation.time || 'Not provided');
    const guests = escapeHtml(reservation.guests || 'Not provided');
    const notes = escapeHtml(reservation.notes || 'None');
    const status = escapeHtml(reservation.status || 'pending');

    const subject = `New Reservation Received (#${reservationId})`;
    const text = [
      `A new reservation was submitted.`,
      `Reservation ID: ${reservationId}`,
      `Name: ${reservation.name || 'Unknown'}`,
      `Phone: ${reservation.phone || 'Not provided'}`,
      `Email: ${reservation.email || 'Not provided'}`,
      `Date: ${reservation.date || 'Not provided'}`,
      `Time: ${reservation.time || 'Not provided'}`,
      `Guests: ${reservation.guests || 'Not provided'}`,
      `Status: ${reservation.status || 'pending'}`,
      `Special requests: ${reservation.notes || 'None'}`,
    ].join('\n');

    const html = `
      <h2>New Reservation Received</h2>
      <p><strong>Reservation ID:</strong> ${escapeHtml(reservationId)}</p>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Time:</strong> ${time}</p>
      <p><strong>Guests:</strong> ${guests}</p>
      <p><strong>Status:</strong> ${status}</p>
      <p><strong>Special requests:</strong> ${notes}</p>
    `;

    try {
      await sendNotificationMail({ subject, html, text });
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

    const oldStatus = beforeData.status || 'pending';
    const newStatus = afterData.status || 'pending';

    // Only send SMS if status actually changed
    if (oldStatus === newStatus) {
      return;
    }

    // Send SMS only for specific status transitions
    const statusesToNotify = ['preparing', 'completed'];
    if (!statusesToNotify.includes(newStatus)) {
      return;
    }

    try {
      await sendCustomerOrderStatusSms(orderId, afterData, newStatus);
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

function extractBearerToken(authorizationHeader = '') {
  const match = String(authorizationHeader).match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

exports.checkSmsBalance = onRequest(
  {
    region: 'us-central1',
    secrets: [ARKESEL_API_KEY],
  },
  async (req, res) => {
    try {
      const token = extractBearerToken(req.get('authorization'));
      if (!token) {
        res.status(401).json({ error: 'Missing authorization token' });
        return;
      }

      const admin = getAdmin();
      const decoded = await admin.auth().verifyIdToken(token);
      const isAdminUser = decoded.admin === true || decoded.email === 'admin@luban.com';
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
