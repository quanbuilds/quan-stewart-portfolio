import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";

function analyticsStore() {
  return getStore({
    name: "portfolio-analytics",
    siteID: process.env.NETLIFY_SITE_ID || process.env.SITE_ID,
    token: process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_AUTH_TOKEN,
  });
}
const allowedTypes = new Set(["pageview", "click", "case_open", "client_error", "resource_error", "vital", "feedback", "inquiry"]);
const allowedHosts = new Set(["quanbuilds.netlify.app", "quan-stewart-portfolio.netlify.app", "localhost", "127.0.0.1"]);
const maxBodyBytes = 10 * 1024;
const feedbackProjects = new Set([
  "stewartos",
  "f10rd",
  "taxtrakr",
  "youcast",
  "tideflow",
  "impulse",
  "deadstroke",
  "reddit-finder",
  "botler-shell",
  "local-sites",
  "family-os",
  "product-lab",
]);

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

function cleanString(value, max = 240) {
  return String(value || "")
    .replace(/[^\x20-\x7E]/g, "")
    .slice(0, max);
}

function getHeader(headers, name) {
  const lower = name.toLowerCase();
  return headers[name] || headers[lower] || "";
}

function hashValue(value) {
  const salt = process.env.PORTFOLIO_ANALYTICS_SALT || process.env.PORTFOLIO_ANALYTICS_TOKEN || "portfolio-analytics";
  return crypto.createHash("sha256").update(`${salt}:${value || "unknown"}`).digest("hex").slice(0, 24);
}

function parseCountry(headers) {
  const direct = cleanString(getHeader(headers, "x-country") || getHeader(headers, "x-nf-country"), 80);
  if (direct) return direct;
  const geo = getHeader(headers, "x-nf-geo");
  if (!geo) return "";
  const candidates = [geo];
  try {
    candidates.push(Buffer.from(String(geo), "base64").toString("utf8"));
  } catch {
    // Keep the raw header candidate only.
  }
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      return cleanString(parsed.country?.code || parsed.country || "", 80);
    } catch {
      const match = String(candidate).match(/country[^A-Za-z0-9]+([A-Z]{2})/i);
      if (match?.[1]) return cleanString(match[1], 80);
    }
  }
  return "";
}

function isSameSite(headers) {
  const origin = getHeader(headers, "origin");
  if (!origin) return true;
  try {
    return allowedHosts.has(new URL(origin).hostname);
  } catch {
    return false;
  }
}

function readToken(event) {
  return (
    getHeader(event.headers || {}, "x-portfolio-analytics-token") ||
    event.queryStringParameters?.token ||
    ""
  );
}

function hasReadAccess(event) {
  const expected = process.env.PORTFOLIO_ANALYTICS_TOKEN;
  return Boolean(expected && readToken(event) === expected);
}

function cleanEvent(payload, event) {
  const now = new Date();
  const type = allowedTypes.has(payload.type) ? payload.type : "pageview";
  const data = payload.data && typeof payload.data === "object" ? payload.data : {};
  const headers = event.headers || {};
  const ip =
    getHeader(headers, "x-nf-client-connection-ip") ||
    getHeader(headers, "client-ip") ||
    getHeader(headers, "x-forwarded-for").split(",")[0];
  const ua = cleanString(getHeader(headers, "user-agent"), 280);

  return {
    id: `${now.toISOString()}-${Math.random().toString(36).slice(2, 10)}`,
    ts: now.toISOString(),
    type,
    path: cleanString(data.path || payload.path || "/", 220),
    title: cleanString(data.title, 120),
    referrer: cleanString(data.referrer, 260),
    target: cleanString(data.target, 180),
    label: cleanString(data.label, 180),
    project: cleanString(data.project, 80),
    action: cleanString(data.action, 40),
    email: cleanString(data.email, 120),
    budget: cleanString(data.budget, 80),
    timeline: cleanString(data.timeline, 80),
    comment: cleanString(data.comment, 700),
    name: cleanString(data.name, 80),
    message: cleanString(data.message, 400),
    source: cleanString(data.source, 220),
    line: Number.isFinite(Number(data.line)) ? Number(data.line) : null,
    column: Number.isFinite(Number(data.column)) ? Number(data.column) : null,
    viewport: {
      width: Number.isFinite(Number(data.viewport?.width)) ? Number(data.viewport.width) : null,
      height: Number.isFinite(Number(data.viewport?.height)) ? Number(data.viewport.height) : null,
    },
    connection: cleanString(data.connection, 60),
    userAgent: ua,
    visitorHash: hashValue(`${ip}|${ua}`),
    country: parseCountry(headers),
  };
}

function cleanFeedback(payload, event) {
  const data = payload.data && typeof payload.data === "object" ? payload.data : {};
  const now = new Date();
  const project = cleanString(data.project, 80);
  const action = cleanString(data.action, 20);
  const allowedProject = feedbackProjects.has(project) ? project : "unknown";
  const allowedAction = action === "comment" ? "comment" : "like";
  const base = cleanEvent(payload, event);

  return {
    id: `${now.toISOString()}-${Math.random().toString(36).slice(2, 10)}`,
    ts: now.toISOString(),
    project: allowedProject,
    action: allowedAction,
    name: cleanString(data.name || "Anonymous", 80),
    comment: allowedAction === "comment" ? cleanString(data.comment, 700) : "",
    path: base.path,
    visitorHash: base.visitorHash,
    country: base.country,
  };
}

function cleanInquiry(payload, event) {
  const data = payload.data && typeof payload.data === "object" ? payload.data : {};
  const now = new Date();
  const base = cleanEvent(payload, event);

  return {
    id: `${now.toISOString()}-${Math.random().toString(36).slice(2, 10)}`,
    ts: now.toISOString(),
    project: cleanString(data.project, 80),
    name: cleanString(data.name, 80),
    email: cleanString(data.email, 120),
    budget: cleanString(data.budget, 80),
    timeline: cleanString(data.timeline, 80),
    message: cleanString(data.message, 700),
    path: base.path,
    visitorHash: base.visitorHash,
    country: base.country,
  };
}

function dayKey(ts) {
  return ts.slice(0, 10);
}

async function listEvents(limit = 500) {
  const store = analyticsStore();
  const listed = await store.list({ prefix: "events/" });
  const keys = listed.blobs
    .map((blob) => blob.key)
    .sort()
    .slice(-Math.max(1, Math.min(limit, 2000)));

  const events = [];
  for (const key of keys) {
    const item = await store.get(key, { type: "json" });
    if (item) events.push(item);
  }
  return events.sort((a, b) => String(b.ts).localeCompare(String(a.ts)));
}

async function listFeedback(project, limit = 250) {
  const allowedProject = feedbackProjects.has(project) ? project : "";
  if (!allowedProject) return [];

  const store = analyticsStore();
  const listed = await store.list({ prefix: `feedback/${allowedProject}/` });
  const keys = listed.blobs
    .map((blob) => blob.key)
    .sort()
    .slice(-Math.max(1, Math.min(limit, 1000)));

  const feedback = [];
  for (const key of keys) {
    const item = await store.get(key, { type: "json" });
    if (item) feedback.push(item);
  }
  return feedback.sort((a, b) => String(b.ts).localeCompare(String(a.ts)));
}

function summarizeFeedback(feedback) {
  const likes = feedback.filter((item) => item.action === "like");
  const comments = feedback.filter((item) => item.action === "comment" && item.comment);
  const uniqueLikeVisitors = new Set(likes.map((item) => item.visitorHash).filter(Boolean));

  return {
    likes: uniqueLikeVisitors.size || likes.length,
    rawLikes: likes.length,
    commentCount: comments.length,
    comments: comments.slice(0, 40).map((item) => ({
      id: item.id,
      ts: item.ts,
      name: item.name || "Anonymous",
      comment: item.comment,
    })),
  };
}

function summarize(events) {
  const byType = {};
  const byPath = {};
  const byDay = {};
  const byCountry = {};
  const byReferrer = {};
  const visitorsByDay = {};
  const errors = [];
  const clicks = [];
  const feedback = [];
  const inquiries = [];
  const suspicious = [];

  for (const event of events) {
    byType[event.type] = (byType[event.type] || 0) + 1;
    byPath[event.path] = (byPath[event.path] || 0) + 1;
    byDay[dayKey(event.ts)] = (byDay[dayKey(event.ts)] || 0) + 1;
    const country = event.country || "unknown";
    byCountry[country] = (byCountry[country] || 0) + 1;
    const referrer = event.referrer ? event.referrer.replace(/^https?:\/\/(www\.)?/i, "").split("/")[0] : "direct";
    byReferrer[referrer] = (byReferrer[referrer] || 0) + 1;
    visitorsByDay[dayKey(event.ts)] = visitorsByDay[dayKey(event.ts)] || new Set();
    if (event.visitorHash) visitorsByDay[dayKey(event.ts)].add(event.visitorHash);
    if (event.type.includes("error")) errors.push(event);
    if (event.type === "click" || event.type === "case_open") clicks.push(event);
    if (event.type === "feedback") feedback.push(event);
    if (event.type === "inquiry") inquiries.push(event);
    if (/bot|crawl|spider|scanner|curl|python|httpclient|masscan|zgrab/i.test(event.userAgent || "")) suspicious.push(event);
  }

  return {
    total: events.length,
    byType,
    byPath: Object.entries(byPath)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([path, count]) => ({ path, count })),
    byDay,
    visitorsByDay: Object.fromEntries(Object.entries(visitorsByDay).map(([day, visitors]) => [day, visitors.size])),
    byCountry: Object.entries(byCountry).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([country, count]) => ({ country, count })),
    byReferrer: Object.entries(byReferrer).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([referrer, count]) => ({ referrer, count })),
    recentErrors: errors.slice(0, 25),
    recentClicks: clicks.slice(0, 25),
    recentFeedback: feedback.slice(0, 25),
    recentInquiries: inquiries.slice(0, 25),
    suspicious: suspicious.slice(0, 25),
  };
}

async function rateLimit(event) {
  const headers = event.headers || {};
  const ip =
    getHeader(headers, "x-nf-client-connection-ip") ||
    getHeader(headers, "client-ip") ||
    getHeader(headers, "x-forwarded-for").split(",")[0];
  const visitor = hashValue(`${ip}|${getHeader(headers, "user-agent")}`);
  const minute = new Date().toISOString().slice(0, 16);
  const key = `rate/${minute}/${visitor}.json`;
  const store = analyticsStore();
  const current = (await store.get(key, { type: "json" })) || { count: 0 };
  current.count += 1;
  await store.setJSON(key, current);
  return current.count <= 90;
}

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return json(204, { ok: true });
  }

  if (event.httpMethod === "POST") {
    if (!isSameSite(event.headers || {})) return json(403, { ok: false, error: "origin_not_allowed" });
    if (Buffer.byteLength(event.body || "", "utf8") > maxBodyBytes) return json(413, { ok: false, error: "body_too_large" });
    if (!(await rateLimit(event))) return json(429, { ok: false, error: "rate_limited" });

    let payload = {};
    try {
      payload = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { ok: false, error: "invalid_json" });
    }

    const item = cleanEvent(payload, event);
    const store = analyticsStore();
    await store.setJSON(`events/${item.ts}-${item.id}.json`, item);

    if (item.type === "feedback") {
      const feedback = cleanFeedback(payload, event);
      if (feedback.project !== "unknown") {
        await store.setJSON(`feedback/${feedback.project}/${feedback.ts}-${feedback.id}.json`, feedback);
      }
      return json(200, { ok: true, feedback: feedback.project !== "unknown" });
    }

    if (item.type === "inquiry") {
      const inquiry = cleanInquiry(payload, event);
      await store.setJSON(`inquiries/${inquiry.ts}-${inquiry.id}.json`, inquiry);
      return json(200, { ok: true, inquiry: true });
    }

    return json(200, { ok: true });
  }

  if (event.httpMethod === "GET") {
    const feedbackProject = cleanString(event.queryStringParameters?.feedback, 80);
    if (feedbackProject) {
      const feedback = await listFeedback(feedbackProject);
      return json(200, {
        ok: true,
        generatedAt: new Date().toISOString(),
        project: feedbackProject,
        summary: summarizeFeedback(feedback),
      });
    }

    if (!hasReadAccess(event)) return json(401, { ok: false, error: "analytics_token_required" });
    const limit = Number(event.queryStringParameters?.limit || 500);
    const events = await listEvents(limit);
    return json(200, {
      ok: true,
      generatedAt: new Date().toISOString(),
      summary: summarize(events),
      events: events.slice(0, 250),
    });
  }

  return json(405, { ok: false, error: "method_not_allowed" });
}
