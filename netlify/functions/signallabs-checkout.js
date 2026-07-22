const stripeApiVersion = "2026-02-25.clover";
const auditPrice = 99900;

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

function cleanString(value, max = 240) {
  return String(value || "")
    .replace(/[^\x20-\x7E]/g, "")
    .slice(0, max);
}

function getHeader(headers, name) {
  const lower = name.toLowerCase();
  return headers[name] || headers[lower] || "";
}

function siteOrigin(event) {
  const origin = getHeader(event.headers || {}, "origin");
  if (origin) return origin;
  const host = getHeader(event.headers || {}, "host");
  return host ? `https://${host}` : "https://quanbuilds.netlify.app";
}

async function createCheckoutSession(secretKey, params) {
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${secretKey}`,
      "stripe-version": stripeApiVersion,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
  });

  const data = await response.json();
  if (!response.ok) {
    return { ok: false, status: response.status, data };
  }
  return { ok: true, data };
}

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: json(200, {}).headers, body: "" };
  if (event.httpMethod !== "POST") return json(405, { ok: false, error: "method_not_allowed" });

  const secretKey = process.env.SIGNALLABS_STRIPE_SECRET_KEY;
  const paymentLink = cleanString(process.env.SIGNALLABS_STRIPE_PAYMENT_LINK_URL, 240);
  if (!secretKey && paymentLink) {
    return json(200, { ok: true, url: paymentLink, mode: "payment_link" });
  }

  if (!secretKey) {
    return json(500, { ok: false, error: "missing_signallabs_stripe_key" });
  }

  let payload = {};
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { ok: false, error: "invalid_json" });
  }

  const origin = siteOrigin(event);
  const priceId = cleanString(process.env.SIGNALLABS_STRIPE_AUDIT_PRICE_ID, 120);
  const successUrl = cleanString(process.env.SIGNALLABS_STRIPE_SUCCESS_URL, 300) || `${origin}/signallabs/?checkout=success#pricing`;
  const cancelUrl = cleanString(process.env.SIGNALLABS_STRIPE_CANCEL_URL, 300) || `${origin}/signallabs/?checkout=cancelled#pricing`;
  const params = {
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    "metadata[brand]": "SignalLabs",
    "metadata[offer]": "Full Systems Audit",
    "metadata[source]": "signallabs-pricing",
    "customer_creation": "if_required",
    "client_reference_id": cleanString(payload.clientReference || "signallabs-site", 120),
  };

  if (priceId) {
    params["line_items[0][price]"] = priceId;
    params["line_items[0][quantity]"] = "1";
  } else {
    params["line_items[0][price_data][currency]"] = "usd";
    params["line_items[0][price_data][unit_amount]"] = String(auditPrice);
    params["line_items[0][price_data][product_data][name]"] = "SignalLabs Full Systems Audit";
    params["line_items[0][price_data][product_data][description]"] =
      "Includes 3-7 tools or automations and a 5-hours/week guarantee.";
    params["line_items[0][quantity]"] = "1";
  }

  const session = await createCheckoutSession(secretKey, params);
  if (!session.ok) {
    return json(502, { ok: false, error: "stripe_checkout_failed", details: session.data?.error?.message || "Stripe request failed" });
  }

  return json(200, { ok: true, url: session.data.url, id: session.data.id });
}
