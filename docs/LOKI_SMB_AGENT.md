# Loki by TideLine

Status: free, installable owner-app test. Billing and connected business tools
are not enabled.

Loki helps an owner pursue one monthly business goal. It offers one practical
move grounded in the owner's description or completed complimentary audit,
asks what happened, saves that outcome, and prepares the next move. A daily
Cloudflare cron creates a move after the current move has been resolved. The
owner sees it on opening the app; external push or text notifications are not
part of this test.

The app is a progressive web app at `/loki/`, linked from the public TideLine
site and audit. It can be installed from a supported browser. Its access token
is stored on that browser only, so clearing storage loses access. No customer
data or passwords should be entered. The backend rate-limits AI generation,
requires the bearer token for subsequent access, checks origin on writes,
stores token hashes rather than tokens, and never sends or changes anything
outside the app. The owner can delete their workspace and move history.

Before a paid launch, TideLine needs verified account identity and recovery,
subscription billing, a permissioned connector that can produce evidence from
real business events, off-app notifications, privacy/retention terms, usage
limits, and measured owner outcomes. Each external action should show the
source evidence and require an explicit approval. These are product gates, not
claims of current capability.

Instinct's public site describes proactive follow-up, persistent context, and
phone/computer operation. Loki borrows the interaction pattern, not Instinct's
branding or any unverified VM/Keychain architecture. Source:
https://instinct.com/ .
