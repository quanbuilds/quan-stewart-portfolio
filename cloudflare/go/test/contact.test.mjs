import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/index.js', import.meta.url), 'utf8');
const worker = (await import(`data:text/javascript,${encodeURIComponent(source)}`)).default;

function setup() {
  const rows = new Map();
  const db = {
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async run() {
              if (!sql.startsWith('INSERT')) throw new Error(`unexpected SQL: ${sql}`);
              if (rows.has(args[0])) return { meta: { changes: 0 } };
              rows.set(args[0], { id: args[0], notification_status: 'pending', notification_detail: args[7], values: args });
              return { meta: { changes: 1 } };
            },
            async first() { return rows.get(args[0]); },
          };
        },
      };
    },
  };
  return { rows, env: { CONTACT_DB: db, ASSETS: { fetch: () => new Response('site') } } };
}

const url = 'https://tidelinestrats.com/api/contact';
const id = 'c1454fe4-1b6b-46e0-ae73-b7c1fbf29b18';
const payload = { requestId: id, name: 'A Person', business: 'Example Co', email: 'person@example.com', message: 'Please contact me.' };
const request = (body = payload, origin = 'https://tidelinestrats.com') => new Request(url, {
  method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body),
});

test('stores a valid inquiry for Cody without claiming an email was sent', async () => {
  const ctx = setup();
  const response = await worker.fetch(request(), ctx.env);
  assert.equal(response.status, 202);
  assert.equal((await response.json()).notificationStatus, 'pending');
  assert.equal(ctx.rows.size, 1);
  assert.match(ctx.rows.get(id).notification_detail, /c\.knudsen@tidelinestrats\.com/);
  const repeat = await worker.fetch(request(), ctx.env);
  assert.equal((await repeat.json()).duplicate, true);
  assert.equal(ctx.rows.size, 1);
});

test('rejects cross-site and invalid requests before writing', async () => {
  const ctx = setup();
  assert.equal((await worker.fetch(request(payload, 'https://other.example'), ctx.env)).status, 403);
  assert.equal((await worker.fetch(request({ ...payload, email: 'bad' }), ctx.env)).status, 400);
  assert.equal((await worker.fetch(request({ ...payload, website: 'spam.example' }), ctx.env)).status, 200);
  assert.equal(ctx.rows.size, 0);
});
