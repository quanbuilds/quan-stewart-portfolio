export function normalizePhone(value) {
  const raw = String(value ?? "").trim();
  if (!/^[+\d\s().-]+$/.test(raw) || raw.length > 40) return null;
  let digits = raw.replace(/\D/g, "");
  if (!raw.startsWith("+") && digits.length === 10) digits = "1" + digits;
  if (!raw.startsWith("+") && !(digits.length === 11 && digits.startsWith("1"))) return null;
  if (!/^[1-9]\d{7,14}$/.test(digits)) return null;
  if (digits.startsWith("1") && (digits.length !== 11 || !/^1[2-9]\d{2}[2-9]\d{6}$/.test(digits))) return null;
  return "+" + digits;
}
const reply = (status, body) => Response.json(body, {status, headers: {"cache-control": "no-store", "x-content-type-options": "nosniff"}});
export async function receiveWaitlist(request, env, url) {
  if (request.method !== "POST") return reply(405, {ok:false,error:"method_not_allowed"});
  if (request.headers.get("origin") !== url.origin) return reply(403, {ok:false,error:"origin_not_allowed"});
  if (!request.headers.get("content-type")?.startsWith("application/json")) return reply(415, {ok:false,error:"json_required"});
  try {
    const {success} = await env.CONTACT_RATE_LIMIT.limit({key:"loki-waitlist:" + (request.headers.get("cf-connecting-ip") || "unknown")});
    if (!success) return reply(429, {ok:false,error:"rate_limited"});
  } catch { return reply(503, {ok:false,error:"unavailable"}); }
  let input;
  try {
    const reader = request.body?.getReader();
    const chunks=[]; let size=0;
    if (!reader) return reply(400,{ok:false,error:"invalid_json"});
    while (true) {
      const {done,value}=await reader.read(); if(done) break;
      size+=value.byteLength;
      if(size>2048) { await reader.cancel(); return reply(413,{ok:false,error:"payload_too_large"}); }
      chunks.push(value);
    }
    const bytes=new Uint8Array(size); let offset=0;
    for(const chunk of chunks) {bytes.set(chunk,offset);offset+=chunk.length;}
    input=JSON.parse(new TextDecoder().decode(bytes));
  } catch {return reply(400,{ok:false,error:"invalid_json"});}
  if (!input || typeof input !== "object" || Array.isArray(input)) return reply(400,{ok:false,error:"invalid_payload"});
  if (input.website) return reply(200,{ok:true});
  const phone=normalizePhone(input.phone);
  if (!phone || input.consent !== true) return reply(400,{ok:false,error:"phone_and_consent_required"});
  try {
    const inserted=await env.CONTACT_DB.prepare("INSERT OR IGNORE INTO loki_waitlist (phone, submitted_at) VALUES (?, ?)").bind(phone,new Date().toISOString()).run();
    return reply(200,{ok:true,duplicate:inserted?.meta?.changes===0});
  } catch { return reply(503,{ok:false,error:"storage_unavailable"}); }
}
