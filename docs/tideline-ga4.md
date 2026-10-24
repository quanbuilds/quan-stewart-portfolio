# TideLine GA4

Owner authorized a new setup after the earlier wrong-account setup was removed. The Analytics account menu was verified as q.stewart@tidelinestrats.com immediately before creation and again on the created property. Every Google URL retains an explicit authuser selection. Do not fall back to the browser default account.

- Account: TideLine Strategies / 413284100
- Property: TideLine Strategies — Website / 560552440
- Website stream: TideLine public website / 16194574972
- Measurement: G-LCY7Q7N774
- Reporting zone: America/Chicago; currency USD
- Owner account: q.stewart@tidelinestrats.com

The public tag loads only on known TideLine public routes, never local previews or unrelated hosts. Global Privacy Control and Do Not Track disable it. Ads consent is denied, Google signals and ad personalization disabled. Only origin/path and referrer origin are sent. Query strings, hashes, form contents, names, email, phone and CRM IDs are excluded. UTM sources/mediums use a fixed allowlist. Automatic enhanced measurement was disabled in the stream; section and conversion events are explicitly controlled.

`generate_lead` means the contact endpoint returned successful storage and a nonduplicate record. `sign_up` means the waitlist endpoint successfully stored a new record. Both exclude honeypots. Browser events can be blocked or dropped and are not a replacement for the private CRM/intake ledger. First-party conversion storage is unchanged. No messages or sequences are sent.

Collection and reporting are separate gates: public tag/CSP deployment, a successful collection request, GA4 realtime receipt, then authorized read-only reporting into Voyage. The new property has no historical data. Existing first-party series must remain clearly labeled and cannot be backfilled as GA4 history. API reporting credentials are server-side only; never expose them in HTML, logs, browser storage or a public config.
