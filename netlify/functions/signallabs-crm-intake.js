import { getStore } from "@netlify/blobs";
import { sendSignalLabsEmail } from "./_signallabs-email.js";

const allowedHosts = new Set(["quanbuilds.netlify.app", "quan-stewart-portfolio.netlify.app", "localhost", "127.0.0.1"]);
const maxBodyBytes = 8 * 1024;

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST,OPTIONS",
      "access-control-allow-headers": "content-type",
    },
    body: JSON.stringify(body),
  };
}

function cleanString(value, max = 700) {
  return String(value || "")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "")
    .slice(0, max);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getHeader(headers, name) {
  const lower = name.toLowerCase();
  return headers[name] || headers[lower] || "";
}

function isSameSite(headers) {
  const origin = getHeader(headers || {}, "origin");
  if (!origin) return true;
  if (origin === "null") return true;
  try {
    return allowedHosts.has(new URL(origin).hostname);
  } catch {
    return false;
  }
}

function crmIntakeStore() {
  return getStore({
    name: "signallabs-crm-intake",
    siteID: process.env.NETLIFY_SITE_ID || process.env.SITE_ID,
    token: process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_AUTH_TOKEN,
  });
}

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: json(200, {}).headers, body: "" };
  if (event.httpMethod !== "POST") return json(405, { ok: false, error: "method_not_allowed" });
  if (!isSameSite(event.headers)) return json(403, { ok: false, error: "origin_not_allowed" });
  if (Buffer.byteLength(event.body || "", "utf8") > maxBodyBytes) return json(413, { ok: false, error: "payload_too_large" });

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { ok: false, error: "invalid_json" });
  }

  const now = new Date();
  const contact = cleanString(payload.contact, 180);
  const email = cleanString(payload.email || (contact.includes("@") ? contact : ""), 180);
  const phone = cleanString(payload.phone || (contact && !contact.includes("@") ? contact : ""), 80);
  const message = cleanString(payload.message || payload.notes, 700);
  const need = cleanString(payload.need || "Free 15-minute mini assessment", 160);
  const name = cleanString(payload.name, 120);
  const business = cleanString(payload.business, 180);
  const source = cleanString(payload.source || "signallabs-site-contact", 120);
  const sector = cleanString(payload.sector, 140);
  const annualRevenue = cleanString(payload.annualRevenue, 140);
  const teamSize = cleanString(payload.teamSize, 40);
  const currentTools = cleanString(payload.currentTools, 300);
  if (!name || !business || !email || !email.includes("@")) {
    return json(400, { ok: false, error: "name_business_and_valid_email_required" });
  }
  const record = {
    id: `${now.toISOString()}-${Math.random().toString(36).slice(2, 10)}`,
    date_added: now.toISOString().slice(0, 10),
    company: business,
    contact_name: name,
    role: "",
    phone,
    email,
    city: "",
    state: "",
    source,
    stage: "inbound_site_contact",
    need_or_pain: message,
    offer_angle: `SignalLabs inquiry: ${need}`,
    last_touch_at: now.toISOString(),
    next_follow_up_at: "",
    owner: "Cash",
    next_action: "Review website inquiry and follow up.",
    notes: `inbound_site_intake=true; attach_to=national-ai-concierge-call-list; sector=${sector || "not_provided"}; annual_revenue_or_valuation=${annualRevenue || "not_provided"}; team_size=${teamSize || "not_provided"}`,
    category: need,
    current_tools_signal: currentTools,
    sector,
    annual_revenue_or_valuation: annualRevenue,
    team_size: teamSize,
    offer_lane: "ai_concierge_systems_audit",
    systems_pain: message,
    first_meeting_goal: "Qualify need and offer mini assessment or systems audit.",
  };

  let stored = false;
  try {
    const store = crmIntakeStore();
    await store.setJSON(`national-ai-call-list/${record.id}.json`, record);
    stored = true;
  } catch {
    // Email delivery can still work even if blob storage is not configured.
  }

  const owner = process.env.SIGNALLABS_REPORT_TO || "quan.stewart@icloud.com";
  const delivery = await sendSignalLabsEmail({
    to: owner,
    subject: `SignalLabs inquiry - ${record.company || record.contact_name || "website lead"}`,
    text: [
      "New SignalLabs inquiry",
      "",
      `Name: ${record.contact_name || "Not provided"}`,
      `Business: ${record.company || "Not provided"}`,
      `Email: ${email || "Not provided"}`,
      `Phone: ${phone || "Not provided"}`,
      `Sector: ${sector || "Not provided"}`,
      `Annual revenue or valuation: ${annualRevenue || "Not provided"}`,
      `Team size: ${teamSize || "Not provided"}`,
      `Current tools: ${currentTools || "Not provided"}`,
      `Need: ${record.category || "Not provided"}`,
      "",
      "What keeps leaking:",
      record.need_or_pain || "Not provided",
    ].join("\n"),
    html: `
      <div style="font-family:Avenir Next,Helvetica,Arial,sans-serif;background:#ebe7dc;padding:28px;color:#151512;">
        <div style="max-width:680px;background:#f5f1e7;border:1px solid rgba(21,21,18,.2);padding:24px;">
          <p style="margin:0 0 14px;color:#b8892f;font-weight:800;letter-spacing:.12em;text-transform:uppercase;">SignalLabs inquiry</p>
          <p><strong>Name:</strong> ${escapeHtml(record.contact_name || "Not provided")}</p>
          <p><strong>Business:</strong> ${escapeHtml(record.company || "Not provided")}</p>
          <p><strong>Email:</strong> ${escapeHtml(email || "Not provided")}</p>
          <p><strong>Phone:</strong> ${escapeHtml(phone || "Not provided")}</p>
          <p><strong>Sector:</strong> ${escapeHtml(sector || "Not provided")}</p>
          <p><strong>Annual revenue or valuation:</strong> ${escapeHtml(annualRevenue || "Not provided")}</p>
          <p><strong>Team size:</strong> ${escapeHtml(teamSize || "Not provided")}</p>
          <p><strong>Current tools:</strong> ${escapeHtml(currentTools || "Not provided")}</p>
          <p><strong>Need:</strong> ${escapeHtml(record.category || "Not provided")}</p>
          <p><strong>What keeps leaking:</strong><br />${escapeHtml(record.need_or_pain || "Not provided")}</p>
        </div>
      </div>
    `,
  });

  const accepted = stored || delivery.sent;
  return json(accepted ? 200 : 502, { ok: accepted, id: record.id, stored, emailSent: delivery.sent, delivery: delivery.reason });
}
