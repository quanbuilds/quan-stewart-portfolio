# Loki for owner-led businesses

Status: public business audit implemented; dedicated TideLine messaging line and its provider configuration are pending. This document separates verified Instinct behavior from design choices for TideLine. Reviewed 2026-09-29.

## What Instinct gets right

| Publicly observable pattern | Why it works | TideLine interpretation |
| --- | --- | --- |
| Text or call as the primary interface, with no new dashboard to learn | The assistant meets people in an existing habit | Start Loki over SMS/iMessage from a dedicated TideLine line; keep the web audit as a structured entry point and record of recommendations. |
| Context from connected email, messages, screen, audio, location, and other apps, subject to granted permissions | Recommendations can be grounded in real events | Add narrow, opt-in business connectors one at a time: lead inbox, calendar, CRM, then billing metadata. Show exactly which sources informed each finding. Do not ask for blanket access during the public audit. |
| The agent uses a phone and computer to carry out multi-step work | It can demonstrate a completed workflow, not just produce advice | Give each business an isolated execution environment for read-only observation and preview work. Let it draft an action and show a receipt before it can commit changes. |
| Proactive follow-up on dropped threads | Value arrives without another prompt | Track the owner's stated goals and agreed cadence. Send a concise finding only when a new event or a scheduled review offers a specific next step. Respect PAUSE and STOP immediately. |
| A Vault for sensitive material | Credentials are separated from ordinary chat | Use a credential broker and encrypted per-tenant vault. The model receives a capability to perform a narrow operation, never raw passwords, tokens, or payment details. On a local Mac component, use macOS Keychain for its local secrets; cloud tenants need an equivalent managed vault, not a shared Keychain. |
| Editable connected-data controls and deletion | The user can inspect and revoke access | Give each business a permissions, activity, and deletion view. Revocation must stop future reads and any scheduled tasks, and data deletion must be independently verified. |

Sources: [Instinct product site](https://instinct.com/), [Instinct privacy policy](https://instinct.com/privacy-policy), [Instinct terms, including Vault treatment](https://instinct.com/terms). Instinct publicly says it uses a phone and computer and has a Vault. I did **not** verify a per-customer VM or Apple Keychain implementation from Instinct's own public materials; those are TideLine design goals, not claims about Instinct's internals. [Muse's published design account](https://introducing.muse.ai/) documents a dedicated computer/browser, persistent conversation, goal tracking, approval cards, and artifacts as a separate useful reference.

## The TideLine experience

1. One prompt: the owner describes the business in a sentence. No sign-in or account connection.
2. Loki interviews the owner about one real workflow. It asks one adaptive question at a time and shows observations the owner can correct in the conversation. The owner can request the audit after enough detail is collected.
3. Loki produces three distinct opportunities, each tied to a stated fact or labeled assumption, a first step the owner can take in 48 hours, a possible human-reviewed automation, and a metric. It also gives a two-week pilot. The plan is printable.
4. Once a dedicated line is configured and an inbound/outbound test passes, the owner can separately opt in by phone. The first text asks for one business goal. Inbound replies are handled only from opted-in numbers on that exact line. A later `YES WEEKLY` enables one weekly suggestion; `PAUSE` disables those suggestions and `STOP` ends texting.
5. The assistant starts as an advisor using the audit and text conversation. It has no connected customer data, browser account access, payment authority, or permission to send to the owner's customers. Those require a later customer-specific setup with exact permissions and an activity trail.

## Implementation boundaries

- Public audit runs in the existing Cloudflare Worker with Workers AI, D1 session storage, same-origin checks, bounded inputs, per-IP rate limiting, opaque session access tokens, and no agent tools that can act on outside systems.
- The text path uses a dedicated Sendblue number and a secret-protected inbound webhook that filters for that exact number. Sendblue webhooks are account-wide, so adding this endpoint must preserve any existing TaxTrakr webhook. Provider acceptance, delivery, inbound receipt, and stored agent state are different receipts. The website only offers enrollment when the dedicated line, credentials, webhook, and readiness flag are all configured.
- The existing TaxTrakr Sendblue line is not an acceptable substitute. Sendblue's line-provisioning confirmation charges the card on file; preview and an explicit purchasing decision precede provisioning.
- The current TaxTrakr Sendblue account returned `403 API line provisioning is only available for inbound_only accounts` on the read-only provisioning preview. A separate eligible TideLine account or a provider-assisted line is needed. Sendblue publicly lists its AI Agent dedicated line at $100/month, but actual eligibility and billing must be confirmed before purchase. The plan is inbound-first, so the proposed first outbound setup text must be verified on that line before enrollment opens.
- Weekly proactive messages are implemented as a scheduled Worker handler but no cron trigger is active. Configure a local-time delivery window and test STOP/PAUSE, provider acceptance, delivery receipts, and an inbound reply before scheduling it.
- A per-business VM/browser and credential vault are **future capabilities**. A secure version needs tenant isolation, no shared browser sessions, resource limits, scoped connector tokens, human approvals for customer-facing sends or consequential actions, and an activity log with replayable evidence.
- Keep audit answers for a limited period unless the owner opts in, provide session deletion, and document consent, retention, and model processing before expanding to sensitive data.

References: [Sendblue webhooks](https://docs.sendblue.com/getting-started/webhooks/), [Sendblue line provisioning](https://docs.sendblue.com/api-v2/line-provisioning), [NIST AI RMF human oversight](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/).
