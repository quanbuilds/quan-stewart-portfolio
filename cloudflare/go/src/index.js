const NETLIFY_ORIGIN = "https://quanbuilds.netlify.app";
const CANONICAL_HOST = "tidelinestrats.com";
const LEGACY_HOST = "go.signallabs.workers.dev";
const WWW_HOST = "www.tidelinestrats.com";
const CONTACT_PATH = "/api/contact";

function contactJson(status, body) {
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}

function clean(value, max) {
  return String(value ?? "").trim().slice(0, max);
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
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return contactJson(415, { ok: false, error: "json_required" });
  }
  if (Number(request.headers.get("content-length") || 0) > 8192) {
    return contactJson(413, { ok: false, error: "payload_too_large" });
  }

  let input;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 8192) return contactJson(413, { ok: false, error: "payload_too_large" });
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
  const name = clean(input.name, 120);
  const business = clean(input.business, 180);
  const email = clean(input.email, 180);
  const phone = clean(input.phone, 80);
  const message = clean(input.message, 2000);
  if (!name || !business || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return contactJson(400, { ok: false, error: "required_fields" });
  }

  try {
    const inserted = await env.CONTACT_DB.prepare(
      "INSERT OR IGNORE INTO contact_inquiries (id, submitted_at, name, business, email, phone, message) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, new Date().toISOString(), name, business, email, phone, message).run();
    if (inserted.meta?.changes === 0) {
      const prior = await env.CONTACT_DB.prepare(
        "SELECT notification_status FROM contact_inquiries WHERE id = ?"
      ).bind(id).first();
      const notificationStatus = prior?.notification_status || "pending";
      return contactJson(notificationStatus === "accepted" ? 200 : 202,
        { ok: true, id, duplicate: true, notificationStatus });
    }
  } catch (error) {
    console.error("Tideline contact storage failed", error);
    return contactJson(503, { ok: false, error: "storage_unavailable" });
  }

  let notificationStatus = "pending";
  let notificationDetail = "form_submission_failed";
  try {
    const payload = new URLSearchParams({
      "form-name": "tideline-contact",
      name, business, email, phone, message,
      "request-id": id,
    });
    const notification = await fetch(`${NETLIFY_ORIGIN}/tideline-contact-form.html`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: payload.toString(),
    });
    if (notification.ok) {
      notificationStatus = "accepted";
      notificationDetail = "netlify_form_accepted";
    } else {
      notificationDetail = `http_${notification.status}`;
    }
  } catch (error) {
    console.error("Tideline contact notification failed", error);
  }
  try {
    await env.CONTACT_DB.prepare(
      "UPDATE contact_inquiries SET notification_status = ?, notification_detail = ? WHERE id = ?"
    ).bind(notificationStatus, notificationDetail, id).run();
  } catch (error) {
    console.error("Tideline contact receipt update failed", error);
  }
  return contactJson(notificationStatus === "accepted" ? 200 : 202, { ok: true, id, notificationStatus });
}

function isAllowedOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const hostname = new URL(origin).hostname;
    return hostname === CANONICAL_HOST || hostname === LEGACY_HOST || hostname === WWW_HOST;
  } catch {
    return false;
  }
}

async function proxyNetlifyFunction(request, url) {
  const headers = new Headers(request.headers);
  headers.set("origin", NETLIFY_ORIGIN);
  headers.delete("host");
  return fetch(new Request(`${NETLIFY_ORIGIN}${url.pathname}${url.search}`, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    redirect: "manual",
  }));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === LEGACY_HOST || url.hostname === WWW_HOST) {
      return Response.redirect(`https://${CANONICAL_HOST}${url.pathname}${url.search}`, 301);
    }
    if (url.pathname === CONTACT_PATH) return receiveContact(request, env, url);
    if (url.pathname.startsWith("/.netlify/functions/")) {
      if (!isAllowedOrigin(request)) return Response.json({ ok: false, error: "origin_not_allowed" }, { status: 403 });
      return proxyNetlifyFunction(request, url);
    }
    return env.ASSETS.fetch(request);
  },
};
