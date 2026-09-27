import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/index.js', import.meta.url), 'utf8');
const worker = (await import(`data:text/javascript,${encodeURIComponent(source)}`)).default;

function setup(notificationStatus = 200) {
  const rows = new Map();
  const calls = [];
  const db = {
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async run() {
              if (sql.startsWith('INSERT')) {
                if (rows.has(args[0])) return { meta: { changes: 0 } };
                rows.set(args[0], { id: args[0], notification_status: 'pending', values: args });
                return { meta: { changes: 1 } };
              }
              if (sql.startsWith('UPDATE')) {
                Object.assign(rows.get(args[2]), { notification_status: args[0], notification_detail: args[1] });
                return { meta: { changes: 1 } };
              }
              throw new Error(`unexpected SQL: ${sql}`);
            },
            async first() {
              return rows.get(args[0]);
            },
          };
        },
      };
    },
  };
  return {
    rows,
    calls,
    env: { CONTACT_DB: db, ASSETS: { fetch: () => new Response('site') } },
    fetch: async (url, options) => {
      calls.push({ url, options });
      return new Response('', { status: notificationStatus });
    },
  };
}

const url = 'https://tidelinestrats.com/api/contact';
const id = 'c1454fe4-1b6b-46e0-ae73-b7c1fbf29b18';
const payload = { requestId: id, name: 'A Person', business: 'Example Co', email: 'person@example.com', message: 'Please contact me.' };
const request = (body = payload, origin = 'https://tidelinestrats.com') => new Request(url, {
  method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body),
});

async function dispatch(ctx, req) {
  const original = globalThis.fetch;
  globalThis.fetch = ctx.fetch;
  try { return await worker.fetch(req, ctx.env); }
  finally { globalThis.fetch = original; }
}

test('stores a valid inquiry, then posts one form notification', async () => {
  const ctx = setup();
  const response = await dispatch(ctx, request());
  assert.equal(response.status, 200);
  assert.equal((await response.json()).notificationStatus, 'accepted');
  assert.equal(ctx.rows.size, 1);
  assert.equal(ctx.rows.get(id).notification_status, 'accepted');
  assert.equal(ctx.calls.length, 1);
  const sent = new URLSearchParams(ctx.calls[0].options.body);
  assert.equal(sent.get('form-name'), 'tideline-contact');
  assert.equal(sent.get('email'), payload.email);
  assert.equal(sent.get('request-id'), id);
  assert.equal(ctx.calls[0].url, 'https://quanbuilds.netlify.app/tideline-contact-form.html');
  const repeat = await dispatch(ctx, request());
  assert.equal((await repeat.json()).duplicate, true);
  assert.equal(ctx.calls.length, 1);
});

test('keeps the inquiry and reports a pending notification when Netlify fails', async () => {
  const ctx = setup(503);
  const response = await dispatch(ctx, request());
  assert.equal(response.status, 202);
  assert.equal((await response.json()).notificationStatus, 'pending');
  assert.equal(ctx.rows.get(id).notification_detail, 'http_503');
});

test('rejects cross-site and invalid requests before writing', async () => {
  const ctx = setup();
  assert.equal((await dispatch(ctx, request(payload, 'https://other.example'))).status, 403);
  assert.equal((await dispatch(ctx, request({ ...payload, email: 'bad' }))).status, 400);
  assert.equal((await dispatch(ctx, request({ ...payload, website: 'spam.example' }))).status, 200);
  assert.equal(ctx.rows.size, 0);
  assert.equal(ctx.calls.length, 0);
});
