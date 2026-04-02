import express from "express";
import crypto from "node:crypto";
import nodemailer from "nodemailer";
import { SignJWT, jwtVerify } from "jose";

const encoder = new TextEncoder();

function getJwtSecret() {
  const secret = process.env.JWT_SECRET || "";
  if (!secret || secret.length < 16) {
    // safe fallback for local dev; user should set a real secret in production
    return crypto.createHash("sha256").update("dev-secret" + process.cwd()).digest();
  }
  return encoder.encode(secret);
}

function getAllowedEmails() {
  // Default to the email you provided; change via env var
  const raw = process.env.ADMIN_EMAILS || "muhammadsaifudinmj@gmail.com";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

function getAdminRecipients() {
  return [...getAllowedEmails()];
}

function getPublicBaseUrl(req) {
  return process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`;
}

function getTransport() {
  // If SMTP is not configured, we run in "dev mode" and print links to console.
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: { user, pass },
  });
}

async function makeLoginToken(email) {
  const secret = getJwtSecret();
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .setAudience("iamatto-admin")
    .sign(secret);
}

async function verifyToken(token) {
  const secret = getJwtSecret();
  const { payload } = await jwtVerify(token, secret, { audience: "iamatto-admin" });
  return payload;
}

function setSessionCookie(res, email) {
  // short-lived session cookie
  res.cookie("admin_session", email, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // set true behind HTTPS
    maxAge: 1000 * 60 * 60 * 6,
    path: "/",
  });
}

export function requireAdmin(req, res, next) {
  const allowed = getAllowedEmails();
  const email = String(req.cookies.admin_session || "").toLowerCase();
  if (!email || !allowed.has(email)) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  req.adminEmail = email;
  next();
}

export function createAuthRouter() {
  const router = express.Router();

  router.post("/request-link", async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const allowed = getAllowedEmails();

    // Always respond OK to avoid leaking which emails are allowed.
    if (!email || !allowed.has(email)) {
      return res.json({ ok: true, sent: true });
    }

    const token = await makeLoginToken(email);
    const base = getPublicBaseUrl(req);
    const link = `${base}/api/auth/verify?token=${encodeURIComponent(token)}`;

    const transport = getTransport();
    if (!transport) {
      console.log("\n[DEV MODE] SMTP not configured. Use this admin login link:");
      console.log(link);
      console.log();
      return res.json({ ok: true, sent: true, dev: true });
    }

    const from = process.env.SMTP_FROM || process.env.SMTP_USER;

    await transport.sendMail({
      from,
      to: email,
      subject: "Your admin login link (Iamatto Web Catalog)",
      text: `Click to login: ${link}\n\nThis link expires in 15 minutes.`,
    });

    res.json({ ok: true, sent: true });
  });

  router.get("/verify", async (req, res) => {
    try {
      const token = String(req.query.token || "");
      const payload = await verifyToken(token);
      const email = String(payload.email || "").toLowerCase();

      const allowed = getAllowedEmails();
      if (!email || !allowed.has(email)) {
        return res.status(401).send("Not allowed");
      }

      setSessionCookie(res, email);
      // redirect to admin UI
      res.redirect("/admin/");
    } catch {
      res.status(400).send("Invalid or expired link");
    }
  });

  router.post("/logout", (req, res) => {
    res.clearCookie("admin_session", { path: "/" });
    res.json({ ok: true });
  });

  router.get("/me", (req, res) => {
    const email = String(req.cookies.admin_session || "").toLowerCase();
    const allowed = getAllowedEmails();
    if (!email || !allowed.has(email)) return res.status(401).json({ ok: false });
    res.json({ ok: true, email });
  });

  return router;
}

export async function sendAdminNotificationEmail(subject, text) {
  const transport = getTransport();
  const recipients = getAdminRecipients();

  if (!transport || recipients.length === 0) {
    console.log("\n[DEV MODE] Notification email not sent.");
    console.log(`Subject: ${subject}`);
    console.log(text);
    console.log();
    return { sent: false, dev: true };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await Promise.all(
    recipients.map((email) =>
      transport.sendMail({
        from,
        to: email,
        subject,
        text,
      })
    )
  );

  return { sent: true, recipients };
}
