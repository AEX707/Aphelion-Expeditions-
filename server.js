// server.js
// Backend for the Aphelion Expeditions website.
// Receives data from the 3 forms on the site, sends an email notification via Resend,
// and saves a copy of every submission to a local file (submissions.log)
// in case the email fails to send.

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "*" }));
app.use(express.json());

// Log every incoming request — helps confirm whether the site is reaching this server at all
app.use((req, res, next) => {
  console.log(`📩 ${req.method} ${req.url}`);
  next();
});

// ---------- Email setup (Resend) ----------
// Resend sends email over a normal HTTPS API call instead of SMTP, which avoids
// the SMTP port blocking some hosts (including Render's free tier) apply.
const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  console.error("⚠️  RESEND_API_KEY is not set. Emails will not be sent.");
  console.error("   Check your settings in the .env file (or Render Environment tab).");
} else {
  console.log("✅ Resend API key detected — ready to send messages");
}

// ---------- Save submissions to a local file (backup) ----------
const LOG_FILE = path.join(__dirname, "submissions.log");

function saveSubmissionToFile(type, data) {
  const entry = {
    type,
    receivedAt: new Date().toISOString(),
    data,
  };
  fs.appendFile(LOG_FILE, JSON.stringify(entry) + "\n", (err) => {
    if (err) console.error("Error saving submission to file:", err);
  });
}

// ---------- Helper function to send email via Resend's API ----------
async function sendNotificationEmail({ subject, html }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // "onboarding@resend.dev" is Resend's shared test sender — works immediately,
      // no domain setup needed. Later you can verify your own domain in Resend
      // and change this to something like "Aphelion Expeditions <notify@yourdomain.com>".
      from: "Aphelion Expeditions <onboarding@resend.dev>",
      to: process.env.EMAIL_TO,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// Simple required-fields check
function validateFields(body, requiredFields) {
  const missing = requiredFields.filter((field) => !body[field] || String(body[field]).trim() === "");
  return missing;
}

// =========================================================
// 1. Partner application (form "Apply for partner access")
// =========================================================
app.post("/api/partner-application", async (req, res) => {
  const { companyName, contactPerson, email, country, message } = req.body;

  const missing = validateFields(req.body, ["companyName", "contactPerson", "email", "country"]);
  if (missing.length > 0) {
    return res.status(400).json({ success: false, error: `Missing fields: ${missing.join(", ")}` });
  }

  saveSubmissionToFile("partner_application", req.body);

  try {
    await sendNotificationEmail({
      subject: `New partner application: ${companyName}`,
      html: `
        <h2>New partner application</h2>
        <p><strong>Company:</strong> ${companyName}</p>
        <p><strong>Contact person:</strong> ${contactPerson}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Country:</strong> ${country}</p>
        <p><strong>Message:</strong><br>${message || "—"}</p>
      `,
    });
    res.json({ success: true, message: "Application sent" });
  } catch (err) {
    console.error("Error sending email (partner-application):", err);
    // The submission is already saved to file, so nothing is lost even if the email fails
    res.status(500).json({ success: false, error: "Submission saved, but the email failed to send. We will still see it in the log." });
  }
});

// =========================================================
// 2. Tour booking request (form "Request a booking")
// =========================================================
app.post("/api/booking-request", async (req, res) => {
  const { tourName, company, email, date, travelers, details } = req.body;

  const missing = validateFields(req.body, ["tourName", "company", "email", "date", "travelers"]);
  if (missing.length > 0) {
    return res.status(400).json({ success: false, error: `Missing fields: ${missing.join(", ")}` });
  }

  saveSubmissionToFile("booking_request", req.body);

  try {
    await sendNotificationEmail({
      subject: `New booking request: ${tourName}`,
      html: `
        <h2>New booking request</h2>
        <p><strong>Tour:</strong> ${tourName}</p>
        <p><strong>Company:</strong> ${company}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Number of travelers:</strong> ${travelers}</p>
        <p><strong>Details:</strong><br>${details || "—"}</p>
      `,
    });
    res.json({ success: true, message: "Request sent" });
  } catch (err) {
    console.error("Error sending email (booking-request):", err);
    res.status(500).json({ success: false, error: "Submission saved, but the email failed to send. We will still see it in the log." });
  }
});

// =========================================================
// 3. Custom product order (configurator)
// =========================================================
app.post("/api/custom-order", async (req, res) => {
  const { color, size, engraving, quantity, unitPrice, total, customerEmail } = req.body;

  const missing = validateFields(req.body, ["color", "size", "quantity", "unitPrice", "total"]);
  if (missing.length > 0) {
    return res.status(400).json({ success: false, error: `Missing fields: ${missing.join(", ")}` });
  }

  saveSubmissionToFile("custom_order", req.body);

  try {
    await sendNotificationEmail({
      subject: `New custom product order — €${total}`,
      html: `
        <h2>New custom product order</h2>
        <p><strong>Color:</strong> ${color}</p>
        <p><strong>Size:</strong> ${size}</p>
        <p><strong>Engraving:</strong> ${engraving || "none"}</p>
        <p><strong>Quantity:</strong> ${quantity}</p>
        <p><strong>Unit price:</strong> €${unitPrice}</p>
        <p><strong>Total:</strong> €${total}</p>
        <p><strong>Customer email:</strong> ${customerEmail || "not provided"}</p>
      `,
    });
    res.json({ success: true, message: "Order sent" });
  } catch (err) {
    console.error("Error sending email (custom-order):", err);
    res.status(500).json({ success: false, error: "Order saved, but the email failed to send. We will still see it in the log." });
  }
});

// ---------- Health check (confirms the server is running) ----------
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running: http://localhost:${PORT}`);
});
