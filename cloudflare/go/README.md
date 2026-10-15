# TideLine Cloudflare release

`go` in the `tideline` Wrangler profile serves `https://tidelinestrats.com` and
`https://go.q-stewart.workers.dev`. The public site is copied from `signallabs/`.
Use `sh cloudflare/go/deploy.sh` from the repository root. The script uploads a
Worker version and deploys it at 100% without changing the existing domain
triggers or Zoho MX records. The `0 14 * * *` daily cron is already attached;
do not run a blanket `wrangler triggers deploy` from this config, because it
also attempts to reapply the externally managed custom domains.
`sh cloudflare/go/deploy.sh --dry-run` validates the
package without uploading it.

`/loki/` is the installable free-test app. An owner enters a business and a
monthly goal, optionally bringing along a completed public audit in the same
browser tab. A private 256-bit bearer token is held on that device. The Worker
stores a first AI-generated move, owner outcome, and subsequent moves in D1.
The 14:00 UTC cron prepares a new move only after an owner closes the current
one; the app loads it on the next visit. There is no external notification,
connected inbox, customer send, paid checkout, or cross-device account recovery
in this test. The owner can delete the workspace and its move history in-app.

Apply `0003_loki_operator.sql` to remote D1 before deploying the Worker. Test
creation, resume, outcome, next move, deletion, app installation, and the cron
individually. Do not claim off-app proactivity or a paid subscription until
notification, identity recovery, billing, and real customer UAT are complete.

`POST /api/contact` saves inquiries to D1 database `tideline-contact` before
attempting notification. Duplicate request IDs never resend. Email delivery
depends on sender and recipient verification; `notificationStatus: "pending"`
means the stored inquiry has not been confirmed delivered. The page tells the
visitor to email Cody at `c.knudsen@tidelinestrats.com` directly if urgent. D1
`contact_inquiries.notification_status` and `notification_detail` are the
private intake and delivery receipts.

The `EMAIL` binding is declared for Cody and Quan in `wrangler.jsonc`. The
Worker records each provider acceptance separately. Verify a real recipient
inbox before calling delivery complete; a saved inquiry or accepted provider
request alone is not proof of arrival. Leave Zoho MX records untouched.

## Cody and Claude: source and deployment access

The live TideLine homepage was checked against `signallabs/index.html` from
commit `f55007d`; this source is now included in the shared repository. Work on
`signallabs/` for the public site and `cloudflare/go/src/` for Worker behavior.
This repository also contains Quan's portfolio; keep TideLine commits scoped to
those two directories.

Cloudflare account: `Q.stewart@tidelinestrats.com's Account`, ID
`58008ae4816f34f96786f0f52834dce5`, namespace `q-stewart.workers.dev`, Worker `go`.
Cody's `c.knudsen@tidelinestrats.com` membership was accepted and includes Super
Administrator. His GitHub login is `KingCanute4`; the write-access invitation to
`quanbuilds/quan-stewart-portfolio` must be accepted before he can push.

Clone the repository and authenticate Wrangler using Cody's own Cloudflare login:

```sh
git clone https://github.com/quanbuilds/quan-stewart-portfolio.git
cd quan-stewart-portfolio
npx --yes --package=wrangler@4.148.0 wrangler login
npx --yes --package=wrangler@4.148.0 wrangler whoami --json
sh cloudflare/go/deploy.sh --dry-run
```

Check that `whoami` includes the account ID above. The script uses a local
Wrangler executable if installed, otherwise the pinned npx version. It has no
Quan-specific filesystem dependency. It defaults to Wrangler's default profile;
Quan can select his existing named login with `TIDELINE_WRANGLER_PROFILE=tideline`.
An existing `CLOUDFLARE_API_TOKEN` overrides profile authentication; a restricted
token remains restricted even when its owner is a superadmin. Do not share tokens.

After approved changes and tests, the production command is:

```sh
sh cloudflare/go/deploy.sh
```

This uploads a version and deploys it at 100% while preserving existing routes.
Check the new version and actual changed page on `https://tidelinestrats.com/`.
This source/access repair does not deploy, change DNS, or migrate accounts.

Premier operations uses a separate account: `Quanmakestrades@gmail.com's Account`,
ID `a9283f25898ab483951c7166eaba15c2`, namespace `signallabs.workers.dev`.
Live membership readback showed only Quan in that account. Consolidating hosting
requires a separate migration of resources and bindings; do not change this
script's target account as a substitute for that migration.

## TideLine website analytics → Voyage

Apply the additive `0004_site_analytics.sql` migration to `tideline-contact`
before deploying the analytics collector. Traffic events use anonymous tab IDs,
allowlisted page names, coarse device classes and referrer hostnames. No form
answers, customer names, URL query strings, session credentials or IP addresses
are stored in traffic events. Respect Global Privacy Control / Do Not Track;
retain traffic for 90 days through the existing daily cron.

The Voyage Worker reads this same-account D1 database through its `TIDELINE_DB`
binding. Its existing sign-in and editor role protect `/api/tideline/analytics`
and the inquiry import action. There is no public analytics read endpoint or
shared analytics password. Open Profile → Admin → TideLine & Loki in Voyage.
Audit/app totals cover retained sessions; deleted sessions are excluded. Audit
records currently expire after 30 days, so they cannot supply 90 days of history.

Inquiry imports require an editor action. They link exact matching contact
emails or create a prospect, contact and inquiry note, with durable source IDs.
Retries preserve later CRM edits and cannot duplicate the same inquiry. Existing
CRM accounts are not silently overwritten and no customer message is sent.


## Public site isolation from Worker request quota

Serve public HTML, styles, images and the public Loki app shell directly through
Workers Static Assets. Only `/api` and `/api/*` run the Worker first. The existing
`signallabs/_headers` still applies CSP, HSTS and other response protections.
This is deliberately different from the private Voyage CRM, which must run its
authentication Worker before serving its assets. Never copy this public-site
routing change into the authenticated CRM.

Static pages remain available when the account's Worker request allowance is
exhausted; dynamic contact, audit, app and analytics endpoints still depend on
that allowance. A new deployment does not reset the daily quota. Alias-domain
redirect code still runs for API requests/missing assets; matched static pages
carry the canonical URL rather than invoking middleware solely for redirects.
No account, domain, billing or database settings are changed.
