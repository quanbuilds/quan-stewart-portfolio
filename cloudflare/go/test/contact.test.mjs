import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/index.js', import.meta.url), 'utf8');
const worker = (await import(`data:text/javascript,${encodeURIComponent(source)}`)).default;

function setup(send, rateAllowed = true) {
  const rows = new Map();
  const sent = [];
  const db = {
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async run() {
              if (sql.startsWith('INSERT')) {
                if (rows.has(args[0])) return { meta: { changes: 0 } };
                rows.set(args[0], { id: args[0], notification_status: 'pending', notification_detail: args[7], values: args });
                return { meta: { changes: 1 } };
              }
              if (sql.startsWith('UPDATE')) {
                Object.assign(rows.get(args[2]), { notification_status: args[0], notification_detail: args[1] });
                return { meta: { changes: 1 } };
              }
              throw new Error(`unexpected SQL: ${sql}`);
            },
            async first() { return rows.get(args[0]); },
          };
        },
      };
    },
  };
  const env = {
    CONTACT_DB: db,
    CONTACT_RATE_LIMIT: { limit: async () => ({ success: rateAllowed }) },
    ASSETS: { fetch: () => new Response('site') },
  };
  if (send) env.EMAIL = { send: async (message) => { sent.push(message); return send(message); } };
  return { rows, sent, env };
}

const url = 'https://tidelinestrats.com/api/contact';
const id = 'c1454fe4-1b6b-46e0-ae73-b7c1fbf29b18';
const payload = { requestId: id, name: 'A Person', business: 'Example Co', email: 'person@example.com', message: 'Please contact me.' };
const request = (body = payload, origin = 'https://tidelinestrats.com') => new Request(url, {
  method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body),
});

test('stores an inquiry without claiming delivery when email is unavailable', async () => {
  const ctx = setup();
  const response = await worker.fetch(request(), ctx.env);
  assert.equal(response.status, 202);
  assert.equal((await response.json()).notificationStatus, 'pending');
  assert.equal(ctx.rows.size, 1);
  assert.match(ctx.rows.get(id).notification_detail, /c\.knudsen@tidelinestrats\.com/);
  assert.match(ctx.rows.get(id).notification_detail, /q\.stewart@tidelinestrats\.com/);
  const repeat = await worker.fetch(request(), ctx.env);
  assert.equal((await repeat.json()).duplicate, true);
  assert.equal(ctx.rows.size, 1);
});

test('Cloudflare email binding addresses Cody and Quan in one inquiry notification', async () => {
  const ctx = setup(async () => ({ messageId: 'email-123' }));
  const response = await worker.fetch(request(), ctx.env);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).notificationStatus, 'sent');
  assert.equal(ctx.sent.length, 1);
  assert.equal(ctx.sent[0].to, 'c.knudsen@tidelinestrats.com');
  assert.equal(ctx.sent[0].cc, 'q.stewart@tidelinestrats.com');
  assert.equal(ctx.sent[0].replyTo, payload.email);
  assert.match(ctx.sent[0].text, /Please contact me/);
  assert.equal(ctx.rows.get(id).notification_detail, 'cloudflare:email-123');
  await worker.fetch(request(), ctx.env);
  assert.equal(ctx.sent.length, 1);
});

test('email failure preserves the inquiry and reports pending', async () => {
  const ctx = setup(async () => { throw Object.assign(new Error('Unavailable'), { code: 'E_SENDER_NOT_VERIFIED' }); });
  const response = await worker.fetch(request(), ctx.env);
  assert.equal(response.status, 202);
  assert.equal((await response.json()).notificationStatus, 'pending');
  assert.equal(ctx.rows.get(id).notification_detail, 'cloudflare_error:E_SENDER_NOT_VERIFIED');
});

test('rejects cross-site and invalid requests before writing', async () => {
  const ctx = setup();
  assert.equal((await worker.fetch(request(payload, 'https://other.example'), ctx.env)).status, 403);
  assert.equal((await worker.fetch(request({ ...payload, email: 'bad' }), ctx.env)).status, 400);
  assert.equal((await worker.fetch(request({ ...payload, website: 'spam.example' }), ctx.env)).status, 200);
  assert.equal(ctx.rows.size, 0);
});

test('rate limits contact attempts before reading or storing submissions', async () => {
  const ctx = setup(undefined, false);
  const response = await worker.fetch(request(), ctx.env);
  assert.equal(response.status, 429);
  assert.equal((await response.json()).error, 'rate_limited');
  assert.equal(ctx.rows.size, 0);
});

test('bounds streamed request bodies and strips control characters from email subjects', async () => {
  const ctx = setup(async () => ({ messageId: 'email-456' }));
  const oversized = request({ ...payload, message: 'x'.repeat(9000) });
  oversized.headers.delete('content-length');
  assert.equal((await worker.fetch(oversized, ctx.env)).status, 413);
  assert.equal(ctx.rows.size, 0);
  const valid = request({ ...payload, business: 'Example\r\nBcc: attacker@example.com' });
  assert.equal((await worker.fetch(valid, ctx.env)).status, 200);
  assert.equal(ctx.sent[0].subject.includes('\n'), false);
});

test('redirects insecure requests before serving the site or contact API', async () => {
  const ctx = setup();
  const response = await worker.fetch(new Request('http://tidelinestrats.com/api/contact?source=test'), ctx.env);
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('location'), 'https://tidelinestrats.com/api/contact?source=test');
  assert.equal(ctx.rows.size, 0);
});
