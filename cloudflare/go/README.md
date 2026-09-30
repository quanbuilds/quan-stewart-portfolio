# TideLine Cloudflare release

`go` in the `tideline` Wrangler profile serves `https://tidelinestrats.com` and
`https://go.q-stewart.workers.dev`. The public site is copied from `signallabs/`.
Use `sh cloudflare/go/deploy.sh` from the repository root. The script uploads a
Worker version and deploys it at 100% without changing the existing domain
triggers or Zoho MX records, then applies the declared daily cron trigger.
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
