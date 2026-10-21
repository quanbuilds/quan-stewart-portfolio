# TideLine search implementation

Reviewed 2026-10-21. Scope: tidelinestrats.com; WonPlace keeps its own site and sitemap.

## Keyword and intent map

These are relevance-based targets, not claims of measured search demand. No paid keyword tool, volume, difficulty, or rank estimates were used.

| Canonical page | Primary topic | Supporting queries / intent | User action |
|---|---|---|---|
| `/` | business operations consulting for service businesses | systems for owner-led businesses, service business process improvement | Understand TideLine, start an audit, contact the team |
| `/services/` | operations consulting, automation and custom software | service business systems consulting; compare approaches | Choose a service |
| `/services/operations-consulting/` | business operations consulting | operational diagnostic, workflow and handoff mapping, reduce owner dependence | Identify a workflow gap |
| `/services/workflow-automation/` | workflow automation for service businesses | automate admin work, follow-up workflows, existing-tool integrations | Evaluate a repeated task |
| `/services/custom-software/` | custom software for service businesses | custom business apps, internal tools, scheduling and reporting software | Discuss a scoped build |
| `/faq/` | TideLine services and Ask Loki questions | project pricing, existing tools, account ownership, Loki memory and availability | Get a direct answer |
| `/loki/` | Loki app waitlist | Loki by TideLine, business owner assistant, Loki launch | Join the phone waitlist |

Use phrases naturally in titles, descriptions, page headings, and internal links. Do not add a meta-keywords tag or repetitive location/industry doorway pages. Existing operating context supports gymnastics, cheer, dance, wellness, and appointment-heavy teams; no unverified offices, certifications, reviews, case-study results, fixed prices, or savings claims were added.

Directional SERP review used live results for operations consulting, workflow automation, custom software, and owner-led service businesses. Providers use these terms to describe related commercial services, supporting topic relevance but not demand estimates:
- https://streamlineopsgroup.com/about/
- https://totalcontrolconsulting.com/business-operating-system-consulting
- https://www.thefounderspoint.com/

## Implemented

- Seven canonical public HTML pages with unique titles and descriptions, complete Open Graph/Twitter metadata, one H1 per page, and crawlable internal links.
- Five new static pages: services overview, three distinct service details, and visible FAQ answers.
- Organization and WebSite entities; WebPage, Service, BreadcrumbList and FAQPage markup where appropriate. FAQ schema matches the actual visible questions/answers. Exact JSON-LD hashes are allowed by the existing CSP; inline executable JavaScript remains disallowed.
- Homepage keeps the existing tabs, Ask Loki workspace, animations, and interaction. Root deep links open audit, contact, about, or services correctly.
- Sitemap lists only canonical public pages. Robots permits the waitlist and excludes `/api/`. Private conversations and memory are never exported.
- Updated llms.txt describes public content and distinguishes available Ask Loki from the forthcoming app. This file is informational, not an indexing or AI-citation guarantee.
- Existing anonymous analytics classify service pages as services and FAQs as about; no keyword, phone, form, token, or conversation data is collected for SEO.
- Static checks: `python3 scripts/check_tideline_seo.py`.
- Release verification: exact live asset hashes, metadata, sitemap, robots, schema/CSP, image availability, and missing-page HTTP status via `python3 scripts/verify_tideline_seo.py`.

## Search-engine acceptance

Google Search Console has an existing signed-in `q.stewart@tidelinestrats.com` session and verified domain property `sc-domain:tidelinestrats.com`. Submit/reconcile the root sitemap after deployment and record the provider result separately from code verification. The WonPlace sitemap must remain untouched. A successful sitemap submission is not proof that all URLs are indexed or ranking.

Bing Webmaster access and indexing must be verified separately; never invent a successful submission or create duplicate properties. Record the actual browser result in the task evidence.

After crawl data arrives, use Search Console impressions, queries, indexed-page reports, and conversions to refine this map. Indexing, rankings, AI citations, and traffic changes are external outcomes, not release assertions.

## Reference guidance

- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/

Google’s AI guidance uses the same crawlability, helpful-content, and technical foundations as search. FAQ markup is a semantic description of this page; no FAQ rich-result eligibility is promised.
