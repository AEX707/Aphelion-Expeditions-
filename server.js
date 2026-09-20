const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "*" }));
app.use(express.json());

// Request logging middleware (helps debug why a form isn't reaching the server)
app.use((req, res, next) => {
  console.log(`📩 ${req.method} ${req.url}`);
  next();
});

// ---------- Email sending via Resend HTTPS API ----------
async function sendNotificationEmail({ subject, html }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
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

// ---------- Local backup log ----------
function saveSubmissionToFile(type, data) {
  const logLine = JSON.stringify({ type, data, timestamp: new Date().toISOString() }) + "\n";
  fs.appendFile(path.join(__dirname, "submissions.log"), logLine, (err) => {
    if (err) console.error("Failed to write to submissions.log:", err);
  });
}

// ---------- Validation helper ----------
function validateFields(body, requiredFields) {
  const missing = requiredFields.filter((field) => !body[field] || String(body[field]).trim() === "");
  return missing;
}

// ---------- Partner application ----------
app.post("/api/partner-application", async (req, res) => {
  const required = ["companyName", "contactPerson", "email", "country"];
  const missing = validateFields(req.body, required);
  if (missing.length > 0) {
    return res.status(400).json({ success: false, error: `Missing fields: ${missing.join(", ")}` });
  }

  const { companyName, contactPerson, email, country, message } = req.body;
  saveSubmissionToFile("partner-application", req.body);

  try {
    await sendNotificationEmail({
      subject: `New Partner Application — ${companyName}`,
      html: `
        <h2>New Partner Application</h2>
        <p><strong>Company:</strong> ${companyName}</p>
        <p><strong>Contact Person:</strong> ${contactPerson}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Country:</strong> ${country}</p>
        <p><strong>Message:</strong> ${message || "—"}</p>
      `,
    });
    res.json({ success: true, message: "Partner application received." });
  } catch (err) {
    console.error("Email send failed:", err.message);
    res.status(200).json({ success: true, message: "Application saved, but email notification failed." });
  }
});

// ---------- Booking request ----------
app.post("/api/booking-request", async (req, res) => {
  const required = ["tourName", "company", "email", "date", "travelers"];
  const missing = validateFields(req.body, required);
  if (missing.length > 0) {
    return res.status(400).json({ success: false, error: `Missing fields: ${missing.join(", ")}` });
  }

  const { tourName, company, email, date, travelers, details } = req.body;
  saveSubmissionToFile("booking-request", req.body);

  try {
    await sendNotificationEmail({
      subject: `New Booking Request — ${tourName}`,
      html: `
        <h2>New Booking Request</h2>
        <p><strong>Tour:</strong> ${tourName}</p>
        <p><strong>Company:</strong> ${company}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Travelers:</strong> ${travelers}</p>
        <p><strong>Details:</strong> ${details || "—"}</p>
      `,
    });
    res.json({ success: true, message: "Booking request received." });
  } catch (err) {
    console.error("Email send failed:", err.message);
    res.status(200).json({ success: true, message: "Booking saved, but email notification failed." });
  }
});

// ---------- Custom product order ----------
app.post("/api/custom-order", async (req, res) => {
  const required = ["color", "size", "quantity", "unitPrice", "total", "customerEmail"];
  const missing = validateFields(req.body, required);
  if (missing.length > 0) {
    return res.status(400).json({ success: false, error: `Missing fields: ${missing.join(", ")}` });
  }

  const { color, size, engraving, quantity, unitPrice, total, customerEmail } = req.body;
  saveSubmissionToFile("custom-order", req.body);

  try {
    await sendNotificationEmail({
      subject: `New Custom Order — ${quantity}x ${color} / ${size}`,
      html: `
        <h2>New Custom Product Order</h2>
        <p><strong>Color:</strong> ${color}</p>
        <p><strong>Size:</strong> ${size}</p>
        <p><strong>Engraving:</strong> ${engraving || "None"}</p>
        <p><strong>Quantity:</strong> ${quantity}</p>
        <p><strong>Unit Price:</strong> $${unitPrice}</p>
        <p><strong>Total:</strong> $${total}</p>
        <p><strong>Customer Email:</strong> ${customerEmail}</p>
      `,
    });
    res.json({ success: true, message: "Custom order received." });
  } catch (err) {
    console.error("Email send failed:", err.message);
    res.status(200).json({ success: true, message: "Order saved, but email notification failed." });
  }
});

// ---------- Tour submission (supplier lists a new tour) ----------
app.post("/api/tour-submission", async (req, res) => {
  const required = [
    "tourTitle", "category", "languages", "description",
    "country", "city", "meetingPoint", "duration", "groupSize",
    "price", "cancellationPolicy", "companyName", "contactEmail",
  ];
  const missing = validateFields(req.body, required);
  if (missing.length > 0) {
    return res.status(400).json({ success: false, error: `Missing fields: ${missing.join(", ")}` });
  }

  const {
    tourTitle, category, languages, description,
    country, city, meetingPoint, duration, groupSize,
    price, cancellationPolicy, included, excluded,
    highlights, imageUrl, requirements, companyName, contactEmail,
  } = req.body;

  saveSubmissionToFile("tour-submission", req.body);

  try {
    await sendNotificationEmail({
      subject: `New Tour Submission — ${tourTitle} (${companyName})`,
      html: `
        <h2>New Tour Submission</h2>
        <p><strong>Title:</strong> ${tourTitle}</p>
        <p><strong>Category:</strong> ${category}</p>
        <p><strong>Languages:</strong> ${languages}</p>
        <p><strong>Description:</strong> ${description}</p>
        <p><strong>Location:</strong> ${city}, ${country}</p>
        <p><strong>Meeting Point:</strong> ${meetingPoint}</p>
        <p><strong>Duration:</strong> ${duration}</p>
        <p><strong>Group Size:</strong> ${groupSize}</p>
        <p><strong>Price per Person:</strong> $${price}</p>
        <p><strong>Cancellation Policy:</strong> ${cancellationPolicy}</p>
        <p><strong>Included:</strong> ${included || "—"}</p>
        <p><strong>Excluded:</strong> ${excluded || "—"}</p>
        <p><strong>Highlights:</strong> ${highlights || "—"}</p>
        <p><strong>Cover Photo URL:</strong> ${imageUrl || "—"}</p>
        <p><strong>Special Requirements:</strong> ${requirements || "—"}</p>
        <hr>
        <p><strong>Submitted by:</strong> ${companyName} (${contactEmail})</p>
      `,
    });
    res.json({ success: true, message: "Tour submitted for review." });
  } catch (err) {
    console.error("Email send failed:", err.message);
    res.status(200).json({ success: true, message: "Tour saved, but email notification failed." });
  }
});

// ---------- Health check ----------
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running: http://localhost:${PORT}`);
});
