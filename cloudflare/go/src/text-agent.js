import { parseBody, sendText, auditStopWords } from './audit.js';
const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
function clean(v, max) { return String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max); }
function ack(status = 200) { return new Response('', {status, headers:{'cache-control':'no-store'}}); }
async function equalSecret(received, expected) {
  if (!received || !expected) return false;
  const a = new TextEncoder().encode(received), b = new TextEncoder().encode(expected);
  if (a.length !== b.length) return false;
  let result = 0; for (let i=0; i<a.length; i++) result |= a[i] ^ b[i]; return result === 0;
}
async function record(env, id, optinId, direction, content, receipt = '') {
  return env.CONTACT_DB.prepare('INSERT OR IGNORE INTO loki_text_messages (id, optin_id, direction, content, created_at, provider_receipt) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, optinId, direction, content, new Date().toISOString(), receipt).run();
}
async function answerGoal(env, optin, inbound) {
  const audit = await env.CONTACT_DB.prepare('SELECT business_hint, result_json FROM loki_audits WHERE id = ?').bind(optin.audit_id).first();
  if (!env.AI || !audit) return '';
  const prompt = `You are Loki, a practical SMB optimization assistant for TideLine Strategies. The owner opted in by text. Their business: ${audit.business_hint}. Their preliminary audit: ${clean(audit.result_json, 4000)}. Their goal or message: ${inbound}. Reply as a concise text, under 450 characters. Give one useful observation or first step and ask one focused question. Ground claims in what the owner said, mark uncertain assumptions, never invent live account access or promise savings. Never send or commit on their behalf.`;
  const result = await env.AI.run(MODEL, { messages:[{role:'system',content:'Provide a concise, careful business consulting text. No markdown.'},{role:'user',content:prompt}], max_tokens:180, temperature:0.3 });
  return clean(typeof result?.response === 'string' ? result.response : '', 450);
}
export async function handleTextWebhook(request, env) {
  if (request.method !== 'POST') return ack(405);
  if (env.LOKI_TEXT_READY !== 'true' || !env.SENDBLUE_WEBHOOK_SECRET || !env.SENDBLUE_NUMBER) return ack(503);
  if (!await equalSecret(request.headers.get('sb-signing-secret'), env.SENDBLUE_WEBHOOK_SECRET)) return ack(403);
  const body = await parseBody(request); if (!body) return ack(400);
  if (body.is_outbound || body.to_number !== env.SENDBLUE_NUMBER) return ack();
  const phone = clean(body.from_number, 20), content = clean(body.content, 1000), messageId = clean(body.message_handle || body.id, 120);
  if (!/^\+1\d{10}$/.test(phone) || !content || !messageId) return ack();
  const optin = await env.CONTACT_DB.prepare('SELECT * FROM loki_text_optins WHERE phone_e164 = ? ORDER BY consent_at DESC LIMIT 1').bind(phone).first();
  if (!optin || !['sent','active','stopped'].includes(optin.status)) return ack();
  const added = await record(env, messageId, optin.id, 'inbound', content);
  if (added.meta?.changes !== 1) return ack();
  const command = content.toUpperCase().trim();
  if (auditStopWords.has(command)) {
    await env.CONTACT_DB.prepare('UPDATE loki_text_optins SET status = ?, weekly_enabled = 0, last_inbound_at = ? WHERE id = ?').bind('stopped',new Date().toISOString(),optin.id).run();
    return ack();
  }
  if (optin.status === 'stopped') return ack();
  if (command === 'PAUSE') {
    await env.CONTACT_DB.prepare('UPDATE loki_text_optins SET weekly_enabled = 0, last_inbound_at = ? WHERE id = ?').bind(new Date().toISOString(),optin.id).run();
    const sent = await sendText(env, phone, 'Loki: Weekly ideas are paused. Text YES WEEKLY to resume, or STOP to opt out.');
    if(sent.ok) await record(env, crypto.randomUUID(), optin.id, 'outbound', 'Weekly ideas are paused.', sent.receipt);
    return ack();
  }
  if (command === 'YES WEEKLY') {
    await env.CONTACT_DB.prepare('UPDATE loki_text_optins SET weekly_enabled = 1, status = ?, last_inbound_at = ? WHERE id = ?').bind('active',new Date().toISOString(),optin.id).run();
    const sent = await sendText(env, phone, 'Loki: Weekly business improvement ideas are on. I will keep them tied to your goal. Text PAUSE to stop weekly ideas or STOP to opt out.');
    if(sent.ok) await record(env, crypto.randomUUID(), optin.id, 'outbound', 'Weekly ideas enabled.', sent.receipt);
    return ack();
  }
  await env.CONTACT_DB.prepare('UPDATE loki_text_optins SET goal = CASE WHEN goal = ? THEN ? ELSE goal END, status = ?, last_inbound_at = ? WHERE id = ?').bind('',clean(content,300),'active',new Date().toISOString(),optin.id).run();
  try {
    const reply = await answerGoal(env, optin, content);
    if(reply) {
      const suffix = optin.goal ? '' : ' Reply YES WEEKLY for one practical idea each week, or STOP to opt out.';
      const text = (reply + suffix).slice(0, 620);
      const sent = await sendText(env, phone, text);
      if(sent.ok) await record(env, crypto.randomUUID(), optin.id, 'outbound', text, sent.receipt);
    }
  } catch (error) { console.error('Loki text reply failed', String(error?.message || error)); }
  return ack();
}
export async function sendWeeklyIdeas(env) {
  if (env.LOKI_TEXT_READY !== 'true' || !env.AI || !env.SENDBLUE_NUMBER || !env.SENDBLUE_API_KEY || !env.SENDBLUE_API_SECRET) return {sent:0};
  const cutoff = new Date(Date.now() - 7*24*60*60*1000).toISOString();
  const due = await env.CONTACT_DB.prepare("SELECT o.*, a.business_hint, a.result_json FROM loki_text_optins o JOIN loki_audits a ON a.id = o.audit_id WHERE o.status = 'active' AND o.weekly_enabled = 1 AND o.goal != '' AND (o.last_proactive_at = '' OR o.last_proactive_at < ?) ORDER BY o.consent_at LIMIT 10").bind(cutoff).all();
  let sentCount = 0;
  for (const row of due.results || []) {
    try {
      const prompt = `You are Loki, TideLine's SMB optimization assistant. Business: ${row.business_hint}. Owner goal: ${row.goal}. Audit: ${clean(row.result_json,3000)}. Offer ONE new, practical weekly action the owner can do themselves. Under 350 characters. Cite the audit fact it follows from, and ask whether they want help. No invented data, guarantees, or external actions.`;
      const result = await env.AI.run(MODEL,{messages:[{role:'system',content:'Write one concise weekly business improvement text. No markdown.'},{role:'user',content:prompt}],max_tokens:140,temperature:0.3});
      const content = clean(typeof result?.response === 'string' ? result.response : '',350);
      if (!content) continue;
      const sent = await sendText(env,row.phone_e164,`Loki: ${content} Reply PAUSE to stop weekly ideas or STOP to opt out.`);
      if (!sent.ok) continue;
      await record(env,crypto.randomUUID(),row.id,'outbound',content,sent.receipt);
      await env.CONTACT_DB.prepare('UPDATE loki_text_optins SET last_proactive_at = ? WHERE id = ? AND status = ?').bind(new Date().toISOString(),row.id,'active').run();
      sentCount++;
    } catch (error) { console.error('Loki weekly idea failed', row.id, String(error?.message || error)); }
  }
  return {sent:sentCount};
}
