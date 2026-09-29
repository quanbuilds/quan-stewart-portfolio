# TideLine Cloudflare release

`go` in the `tideline` Wrangler profile serves `https://tidelinestrats.com` and
`https://go.q-stewart.workers.dev`. The public site is copied from `signallabs/`.
Use `sh cloudflare/go/deploy.sh` from the repository root. The script uploads a
Worker version and deploys it at 100% without changing the existing domain
triggers or Zoho MX records. `sh cloudflare/go/deploy.sh --dry-run` validates the
package without uploading it.

`POST /api/contact` saves inquiries to D1 database `tideline-contact` before
attempting notification. Duplicate request IDs never resend. Current production
has no `EMAIL` binding, so each submission returns HTTP 202 with
`notificationStatus: "pending"`; the page tells the visitor to email Cody
at `c.knudsen@tidelinestrats.com` directly if urgent. D1
`contact_inquiries.notification_status` and `notification_detail` are the
private intake and delivery receipts.

To complete automatic delivery, enable Cloudflare Email Sending for
`tidelinestrats.com`, verify `c.knudsen@tidelinestrats.com` as an allowed
recipient if Cloudflare requires it, and add a restricted `send_email` binding
named `EMAIL` to `wrangler.jsonc` with `destination_address` set to Cody's
address. The Worker already uses that binding when present and records the
returned message ID. Verify a real provider receipt and recipient inbox before
calling delivery complete. As of 2026-09-27, the TideLine account returned
`Unauthorized [code: 2036]` for `wrangler email sending settings`, and Email
Routing had no verified destination addresses. Leave Zoho MX records untouched.
