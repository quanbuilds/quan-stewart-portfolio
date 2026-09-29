const CANONICAL_HOST = "tidelinestrats.com";
const LEGACY_HOST = "go.signallabs.workers.dev";
const WWW_HOST = "www.tidelinestrats.com";
const CONTACT_PATH = "/api/contact";
const CONTACT_PRIMARY = "c.knudsen@tidelinestrats.com";
const CONTACT_COPY = "q.stewart@tidelinestrats.com";
const CONTACT_SENDER = "contact@tidelinestrats.com";
import { handleAudit } from "./audit.js";
import { handleTextWebhook, sendWeeklyIdeas } from "./text-agent.js";

function contactJson(status, body) {
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store", "x-content-type-options": "nosniff", "strict-transport-security": "max-age=31536000" },
  });
}

function clean(value, max) {
  return String(value ?? "").trim().slice(0, max);
}

function cleanLine(value, max) {
  return clean(value, max).replace(/[\u0000-\u001f\u007f]+/g, " ").trim();
}

async function readLimitedText(request, maxBytes) {
  const reader = request.body?.getReader();
  if (!reader) return "";
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

function isContactOrigin(request, url) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const source = new URL(origin);
    return source.origin === url.origin ||
      (url.hostname === "localhost" && source.hostname === "localhost") ||
      (url.hostname === "127.0.0.1" && source.hostname === "127.0.0.1");
  } catch {
    return false;
  }
}

async function receiveContact(request, env, url) {
  if (request.method !== "POST") return contactJson(405, { ok: false, error: "method_not_allowed" });
  if (!isContactOrigin(request, url)) return contactJson(403, { ok: false, error: "origin_not_allowed" });
  try {
    const key = request.headers.get("cf-connecting-ip") || "unknown";
    const { success } = await env.CONTACT_RATE_LIMIT.limit({ key: `contact:${key}` });
    if (!success) return contactJson(429, { ok: false, error: "rate_limited" });
  } catch (error) {
    console.error("Tideline contact rate limiter unavailable", error);
    return contactJson(503, { ok: false, error: "intake_unavailable" });
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return contactJson(415, { ok: false, error: "json_required" });
  }
  if (Number(request.headers.get("content-length") || 0) > 8192) {
    return contactJson(413, { ok: false, error: "payload_too_large" });
  }

  let input;
  try {
    const raw = await readLimitedText(request, 8192);
    if (raw === null) return contactJson(413, { ok: false, error: "payload_too_large" });
    input = JSON.parse(raw);
  } catch {
    return contactJson(400, { ok: false, error: "invalid_json" });
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return contactJson(400, { ok: false, error: "invalid_payload" });
  }
  // A filled honeypot looks successful to a bot, but produces no contact record.
  if (input.website) return contactJson(200, { ok: true });

  const id = /^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(String(input.requestId || ""))
    ? String(input.requestId) : crypto.randomUUID();
  const name = cleanLine(input.name, 120);
  const business = cleanLine(input.business, 180);
  const email = clean(input.email, 180);
  const phone = cleanLine(input.phone, 80);
  const message = clean(input.message, 2000);
  if (!name || !business || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return contactJson(400, { ok: false, error: "required_fields" });
  }

  try {
    const inserted = await env.CONTACT_DB.prepare(
      "INSERT OR IGNORE INTO contact_inquiries (id, submitted_at, name, business, email, phone, message, notification_detail) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, new Date().toISOString(), name, business, email, phone, message, `awaiting Cloudflare email setup for ${CONTACT_PRIMARY} and ${CONTACT_COPY}`).run();
    if (inserted.meta?.changes === 0) {
      const prior = await env.CONTACT_DB.prepare(
        "SELECT notification_status FROM contact_inquiries WHERE id = ?"
      ).bind(id).first();
      const notificationStatus = prior?.notification_status || "pending";
      return contactJson(notificationStatus === "sent" ? 200 : 202,
        { ok: true, id, duplicate: true, notificationStatus });
    }
  } catch (error) {
    console.error("Tideline contact storage failed", error);
    return contactJson(503, { ok: false, error: "storage_unavailable" });
  }

  let notificationStatus = "pending";
  let notificationDetail = `awaiting Cloudflare email setup for ${CONTACT_PRIMARY} and ${CONTACT_COPY}`;
  if (env.EMAIL) {
    const notifications = [];
    for (const recipient of [CONTACT_PRIMARY, CONTACT_COPY]) {
      try {
        const receipt = await env.EMAIL.send({
          to: recipient,
          from: CONTACT_SENDER,
          replyTo: email,
          subject: `TideLine website inquiry from ${business}`,
          text: [
            "New TideLine website inquiry", "",
            `Name: ${name}`,
            `Business: ${business}`,
            `Email: ${email}`,
            `Phone: ${phone || "Not provided"}`,
            "", "Message:", message,
          ].join("\n"),
        });
        notifications.push({ recipient, status: "accepted", messageId: receipt.messageId });
      } catch (error) {
        const code = String(error?.code || "send_failed").slice(0, 80);
        notifications.push({ recipient, status: "pending", code });
        console.error("Tideline email notification failed", recipient, code);
      }
    }
    const accepted = notifications.filter((result) => result.status === "accepted").length;
    notificationStatus = accepted === 2 ? "sent" : accepted === 1 ? "partial" : "pending";
    notificationDetail = JSON.stringify(notifications);
  }
  try {
    await env.CONTACT_DB.prepare(
      "UPDATE contact_inquiries SET notification_status = ?, notification_detail = ? WHERE id = ?"
    ).bind(notificationStatus, notificationDetail, id).run();
  } catch (error) {
    console.error("Tideline contact receipt update failed", error);
  }
  return contactJson(notificationStatus === "sent" ? 200 : 202,
    { ok: true, id, notificationStatus });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.protocol === "http:") {
      return Response.redirect(`https://${url.host}${url.pathname}${url.search}`, 301);
    }
    if (url.hostname === LEGACY_HOST || url.hostname === WWW_HOST) {
      return Response.redirect(`https://${CANONICAL_HOST}${url.pathname}${url.search}`, 301);
    }
    if (url.pathname === CONTACT_PATH) return receiveContact(request, env, url);
    if (url.pathname.startsWith("/api/audit/")) return handleAudit(request, env, url);
    if (url.pathname === "/api/loki/sendblue") return handleTextWebhook(request, env);
    return env.ASSETS.fetch(request);
  },
  async scheduled(_event, env) {
    await sendWeeklyIdeas(env);
  },
};
