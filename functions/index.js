/* eslint-disable max-len */
"use strict";

/**
 * Firebase Cloud Functions – Email notifications for Luban Workshop
 *
 * Triggers:
 *  1. notifyNewReservation  – fires when a document is created in `reservations`
 *  2. notifyNewContactMsg   – fires when a document is created in `contact_messages`
 *
 * Configuration (set via Firebase Functions config before deploying):
 *
 *   firebase functions:config:set \
 *     email.sendgrid_key="SG.xxxx" \
 *     email.recipient="staff@lubanrestaurant.com" \
 *     email.sender="noreply@lubanrestaurant.com"
 *
 * Then deploy with:
 *   firebase deploy --only functions
 *
 * NOTE: Outbound network calls require the Firebase Blaze (pay-as-you-go) plan.
 */

const functions = require("firebase-functions");
const sgMail = require("@sendgrid/mail");

// ---------------------------------------------------------------------------
// Helper – read runtime config
// ---------------------------------------------------------------------------
function getConfig() {
  const cfg = functions.config();
  const sendgridKey = (cfg.email && cfg.email.sendgrid_key) || process.env.SENDGRID_API_KEY;
  const recipient = (cfg.email && cfg.email.recipient) || process.env.EMAIL_RECIPIENT;
  const sender = (cfg.email && cfg.email.sender) || process.env.EMAIL_SENDER || "noreply@lubanrestaurant.com";

  if (!sendgridKey) {
    throw new Error("Missing SendGrid API key. Set email.sendgrid_key via firebase functions:config:set.");
  }
  if (!recipient) {
    throw new Error("Missing recipient email. Set email.recipient via firebase functions:config:set.");
  }

  return { sendgridKey, recipient, sender };
}

// ---------------------------------------------------------------------------
// Trigger 1 – New reservation in `reservations/{docId}`
// ---------------------------------------------------------------------------
exports.notifyNewReservation = functions.firestore
    .document("reservations/{docId}")
    .onCreate(async (snap, context) => {
      const data = snap.data() || {};
      const docId = context.params.docId;

      let cfg;
      try {
        cfg = getConfig();
      } catch (err) {
        functions.logger.error("Config error:", err.message);
        return null;
      }

      sgMail.setApiKey(cfg.sendgridKey);

      const msg = {
        to: cfg.recipient,
        from: cfg.sender,
        subject: `🍽️ New Reservation – ${data.name || "Guest"} on ${data.date || "TBD"}`,
        html: `
          <h2 style="color:#b91c1c;">New Reservation Submitted</h2>
          <table cellpadding="6" cellspacing="0" style="font-family:sans-serif;font-size:14px;border-collapse:collapse;">
            <tr><td><strong>Name</strong></td><td>${escapeHtml(data.name)}</td></tr>
            <tr><td><strong>Date</strong></td><td>${escapeHtml(data.date)}</td></tr>
            <tr><td><strong>Time</strong></td><td>${escapeHtml(data.time)}</td></tr>
            <tr><td><strong>Guests</strong></td><td>${escapeHtml(String(data.guests))}</td></tr>
            <tr><td><strong>Phone</strong></td><td>${escapeHtml(data.phone)}</td></tr>
            <tr><td><strong>Email</strong></td><td>${escapeHtml(data.email)}</td></tr>
            <tr><td><strong>Notes</strong></td><td>${escapeHtml(data.notes || "—")}</td></tr>
            <tr><td><strong>Status</strong></td><td>${escapeHtml(data.status || "pending")}</td></tr>
          </table>
          <p style="margin-top:16px;font-size:12px;color:#78716c;">
            Document ID: ${docId}<br>
            View in the <a href="https://luban-workshop-restaurant.web.app/admin">Admin Dashboard</a>.
          </p>
        `,
      };

      try {
        await sgMail.send(msg);
        functions.logger.info(`Reservation notification sent for doc ${docId}`);
      } catch (err) {
        functions.logger.error("Failed to send reservation notification:", err.response ? err.response.body : err.message);
      }

      return null;
    });

// ---------------------------------------------------------------------------
// Trigger 2 – New contact message in `contact_messages/{docId}`
// ---------------------------------------------------------------------------
exports.notifyNewContactMsg = functions.firestore
    .document("contact_messages/{docId}")
    .onCreate(async (snap, context) => {
      const data = snap.data() || {};
      const docId = context.params.docId;

      let cfg;
      try {
        cfg = getConfig();
      } catch (err) {
        functions.logger.error("Config error:", err.message);
        return null;
      }

      sgMail.setApiKey(cfg.sendgridKey);

      const msg = {
        to: cfg.recipient,
        from: cfg.sender,
        subject: `✉️ New Contact Message – ${data.subject || "(no subject)"}`,
        html: `
          <h2 style="color:#b91c1c;">New Contact Form Submission</h2>
          <table cellpadding="6" cellspacing="0" style="font-family:sans-serif;font-size:14px;border-collapse:collapse;">
            <tr><td><strong>Name</strong></td><td>${escapeHtml(data.name)}</td></tr>
            <tr><td><strong>Email</strong></td><td>${escapeHtml(data.email)}</td></tr>
            <tr><td><strong>Subject</strong></td><td>${escapeHtml(data.subject)}</td></tr>
            <tr><td><strong>Message</strong></td><td style="white-space:pre-wrap;">${escapeHtml(data.message)}</td></tr>
          </table>
          <p style="margin-top:16px;font-size:12px;color:#78716c;">
            Document ID: ${docId}<br>
            View in the <a href="https://luban-workshop-restaurant.web.app/admin">Admin Dashboard</a>.
          </p>
        `,
      };

      try {
        await sgMail.send(msg);
        functions.logger.info(`Contact message notification sent for doc ${docId}`);
      } catch (err) {
        functions.logger.error("Failed to send contact notification:", err.response ? err.response.body : err.message);
      }

      return null;
    });

// ---------------------------------------------------------------------------
// Utility – basic HTML escaping to prevent injection in email bodies
// ---------------------------------------------------------------------------
function escapeHtml(str) {
  if (str === undefined || str === null) return "—";
  return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
}
