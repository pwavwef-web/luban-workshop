const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { defineString, defineSecret } = require('firebase-functions/params');
const { logger } = require('firebase-functions');

admin.initializeApp();
const axios = require('axios');

const SMTP_HOST = defineString('SMTP_HOST', { default: 'smtp.gmail.com' });
const SMTP_PORT = defineString('SMTP_PORT', { default: '587' });
const SMTP_SECURE = defineString('SMTP_SECURE', { default: 'false' });
const SMTP_USER = defineSecret('SMTP_USER');
const SMTP_PASS = defineSecret('SMTP_PASS');
const SMTP_FROM = defineSecret('SMTP_FROM');
const NOTIFICATION_RECIPIENT = defineSecret('NOTIFICATION_RECIPIENT');
const ARKESEL_API_KEY = defineSecret('ARKESEL_API_KEY');
const ARKESEL_SENDER = defineString('ARKESEL_SENDER', { default: 'Luban Restaurant' });
const ARKESEL_URL = defineString('ARKESEL_URL', { default: 'https://sms.arkesel.com/api/sms/send' });

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
    const to = order.customerPhone;
    if (!to) {
      logger.info('Order has no customer phone; skipping SMS', { orderId });
      return;
    }

    const total = Number(order.total || 0).toFixed(2);
    const message = `Luban Restaurant: We received your order #${orderId}. Total: ₵${total}. We'll notify you when it's ready.`;

    try {
      const url = ARKESEL_URL.value();
      const apiKey = ARKESEL_API_KEY.value();
      const sender = ARKESEL_SENDER.value();

      // POST JSON to Arkesel. Headers use Bearer token by default; adjust if your Arkesel plan requires a different header.
      await axios.post(url, {
        to,
        from: sender,
        message,
      }, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      logger.info('SMS sent to customer', { orderId, to });
    } catch (err) {
      logger.error('Failed to send SMS via Arkesel', { orderId, error: err?.message || err });
      // Do not throw to avoid retry storms; log and allow other notifications to proceed
    }
  }
);
