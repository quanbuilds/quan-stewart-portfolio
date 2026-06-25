window.CASE_STUDIES = [
  {
    slug: "stewartos",
    title: "StewartOS",
    label: "Agentic OS",
    category: "AI operations",
    kicker: "Private operating system",
    deck: "A living command layer for agents, family operations, product work, calendars, reporting, and source-truth memory.",
    lastEdited: "Portfolio source last edited 2026-06-25; StewartOS operating-mode notes updated 2026-06-23.",
    status: "Active internal system.",
    businessModel: "Internal operating infrastructure. No public business model was documented in the source files I inspected.",
    externalLinks: [],
    goal: "Make the machine remember what happened, route work to the right lane, preserve approval boundaries, and keep daily decisions grounded in source truth.",
    approach: "The build grew around daily notes, project status files, agent context maps, reports, approvals, dashboards, and recovery loops instead of a generic chat surface.",
    outcome: "Partially achieved and still evolving. The system has durable source maps and project truth, but some lanes still depend on manual owner decisions and private runtime checks.",
    unknowns: ["Public packaging/pricing for StewartOS is not documented.", "Which parts, if any, should become a client-facing product is not documented."],
    sources: [
      "Agents/context/latest.md",
      "Daily/2026-06-23.md",
      "Dashboard/Source Truth Map.md",
      "PortfolioSite/index.html"
    ],
    images: ["/assets/previews/stewartos.png", "/assets/previews/botler-shell.png", "/assets/previews/contact-sheet.png"],
    sections: [
      ["What We Built", "A private operating layer that ties together agents, daily reports, project memory, calendars, open loops, and decision context."],
      ["Why It Exists", "The goal was not a polished dashboard first. It was survival-grade usefulness: know what moved, what is blocked, what is safe to automate, and what needs a human decision."],
      ["How We Approached It", "The project uses real notes and reports as the product substrate. Every useful surface points back to evidence instead of pretending a summary is the source."],
      ["Where It Stands", "The system works as internal infrastructure, with a clear next question: which pieces should become public, packaged, or client-safe."]
    ]
  },
  {
    slug: "f10rd",
    title: "F10.0R'D / JIM",
    label: "AI Floor Music",
    category: "Music commerce",
    kicker: "Gymnastics floor-music studio",
    deck: "A music studio, catalog, licensing workflow, content engine, outreach machine, and operating dashboard for gymnast-first floor music.",
    lastEdited: "JIM/F10 report refreshed 2026-06-25; JIM repo last git commit observed 2026-05-22.",
    status: "Live commerce/order routes recovered in the latest source report; direct /tracks remains a watch item.",
    businessModel: "Sell premade and custom gymnastics floor music, Studio sessions, licensing workflows, and related customer/order experiences.",
    externalLinks: [
      { label: "Public site", url: "https://www.f100rd.com/" },
      { label: "Shop", url: "https://www.f100rd.com/shop" },
      { label: "Studio", url: "https://www.f100rd.com/studio" },
      { label: "Instagram", url: "https://www.instagram.com/floordstudios/" }
    ],
    goal: "Make quality floor music accessible to gymnasts at any level, while giving coaches and parents a clearer way to preview, request, and buy routine-fit music.",
    approach: "The system combines a public site, shop/order surfaces, catalog APIs, content dashboard, newsletter workflow, approval-gated outreach, and Studio starter links.",
    outcome: "Partially achieved. The latest report shows core public commerce routes returning 200, but some route and scheduler truth remains watchlisted.",
    unknowns: ["Current revenue, conversion rate, and customer count were not present in the inspected public-safe source files.", "Final pricing/catalog strategy beyond current public routes needs owner confirmation."],
    sources: [
      "Downloads/JIM/docs/studio_weekly_newsletter_strategy.md",
      ".openclaw/agents/botler/workspace/reports/jim-f10/latest.md",
      "Projects/F10rd-JIM/Status.md"
    ],
    images: [
      "/assets/case-studies/f10rd/live-home.png",
      "/assets/case-studies/f10rd/studio-teaser.png",
      "/assets/case-studies/f10rd/reel-frame-003s.png",
      "/assets/case-studies/f10rd/reel-frame-014s.png"
    ],
    sections: [
      ["What We Built", "A working music-commerce system around F10.0R'D: public site, catalog, shop/order routes, Studio surfaces, content loops, and JIM-backed operating reports."],
      ["Why It Exists", "The north star in the source docs is simple: every gymnast should have music that actually fits them, not a generic free-pack track or a song three other kids are using."],
      ["How We Approached It", "The build favors field notes, Studio starter links, approval-gated outreach, and customer-visible proof over generic promo mail."],
      ["Where It Stands", "The latest local report says homepage, shop, checkout, order, products, API orders, API checkout, API tracks, and founder digest JSON returned 200. Direct /tracks still needs a route/redirect decision."]
    ]
  },
  {
    slug: "taxtrakr",
    title: "TaxTrakr",
    label: "AI Tax Tracking",
    category: "Tax and SMS",
    kicker: "Text-first deduction capture",
    deck: "A Trakr SMS-based AI expense tracking agent and site for self-employed tax recordkeeping.",
    lastEdited: "TaxTrakr repo last git commit observed 2026-06-08; latest DNS/runtime report updated 2026-06-13.",
    status: "Fallback runtime healthy; branded DNS/canonical host unresolved in latest source report.",
    businessModel: "Beta product for self-employed tax professionals and self-employed workers. Specific pricing was not documented in the inspected source files.",
    externalLinks: [
      { label: "Public site", url: "https://taxtrack.f100rd.com/" },
      { label: "For agents", url: "https://taxtrack.f100rd.com/for-agents" }
    ],
    goal: "Let users capture messy receipts, notes, and expense context by text, then turn that into categorized, CPA-ready records.",
    approach: "The app uses an Express runtime, Twilio/SendBlue style messaging boundaries, Plaid, uploads, CPA packet tests, admin gates, and fail-closed webhook behavior.",
    outcome: "Partially achieved. The fallback site and Railway origin were healthy in the latest report, while branded taxtrakr.ai DNS remained a P1 blocker.",
    unknowns: ["Final public pricing is not documented.", "Exact beta user count and conversion targets are not documented in inspected files."],
    sources: [
      "Downloads/taxtrack/package.json",
      "ProducerOps/Reports/2026-06-14/report-taxtrack-latest.md",
      "Downloads/taxtrack/test/cpa.test.js",
      "Downloads/taxtrack/test/security.test.js"
    ],
    images: [
      "/assets/case-studies/taxtrakr/live-home.png",
      "/assets/case-studies/taxtrakr/live-for-agents.png",
      "/assets/case-studies/taxtrakr/taxtrakr-ui-01.png",
      "/assets/case-studies/taxtrakr/poster-01.png"
    ],
    sections: [
      ["What We Built", "A text-first tax tracking product with site/runtime, lead handling, webhook boundaries, Plaid dependencies, uploads, and CPA packet logic."],
      ["Why It Exists", "Self-employed tax records are usually messy at the point of capture. The product is designed around texting the record in the moment instead of rebuilding it later."],
      ["How We Approached It", "The latest reports emphasize runtime truth: fallback host, health checks, admin redirects, malformed lead rejection, and unsigned webhook rejection."],
      ["Where It Stands", "The fallback runtime passed root, health, and agent-facing checks. The branded taxtrakr.ai domain still needed DNS/canonical repair in the latest source report."]
    ]
  },
  {
    slug: "youcast",
    title: "YouCast",
    label: "Personal Podcasts",
    category: "Private audio",
    kicker: "Daily operator brief",
    deck: "A private morning audio brief that turns calendar, priorities, and trusted sources into a short Telegram-first briefing with transcript.",
    lastEdited: "YouCast product repo last git commit observed 2026-06-11; GTM/funnel docs updated 2026-06-05.",
    status: "Invite-only private beta package documented; delivery reliability has had TTS/production verification blockers.",
    businessModel: "5-seat invite-only beta, free for 7 days, with a documented $19/month founding-rate commercial test after beta.",
    externalLinks: [
      { label: "Public site", url: "https://youcast-app.netlify.app/" },
      { label: "Invite", url: "https://youcast-app.netlify.app/#invite" }
    ],
    goal: "Replace the first 20 minutes of dashboard-checking, inbox-scanning, and news skimming with one private operator brief.",
    approach: "The product is positioned as a private AI operator brief, delivered to Telegram, tuned by reply, and kept evidence-backed/fail-closed.",
    outcome: "Partially achieved. The product package and GTM are concrete, but source status notes say TTS credential/credit issues and final delivery verification remain blockers.",
    unknowns: ["Current number of active beta users is not documented in the inspected source.", "Whether the $19/month test has converted is not documented."],
    sources: [
      ".openclaw/agents/botler/workspace/projects/youcast/PRD.md",
      ".openclaw/agents/botler/workspace/projects/youcast/GTM_STRATEGY.md",
      ".openclaw/agents/botler/workspace/projects/youcast/FUNNEL_PLAN.md",
      "Projects/YouCast/Status.md"
    ],
    images: [
      "/assets/case-studies/youcast/live-home.png",
      "/assets/case-studies/youcast/hero-product.png",
      "/assets/case-studies/youcast/link-to-podcast.png",
      "/assets/case-studies/youcast/device-system.png"
    ],
    sections: [
      ["What We Built", "A private daily operator brief concept and app package: preference management, calendar/news inputs, generated script, audio, transcript, and Telegram-first delivery."],
      ["Why It Exists", "The core wedge is not public podcast creation. It is a private briefing that tells an operator what moved, what is blocked, and what deserves the first hour."],
      ["How We Approached It", "The GTM narrows the audience to solo founders and owner-operators, caps beta seats, and uses daily feedback to tune the next brief."],
      ["Where It Stands", "The offer and funnel are documented. Reliability still depends on restoring or replacing the TTS path and verifying delivery freshness."]
    ]
  },
  {
    slug: "tideflow",
    title: "TideFlow",
    label: "GovCon Agent",
    category: "GovCon workflows",
    kicker: "AI-guided federal-contract intelligence",
    deck: "A government contracting intelligence platform to help small businesses discover, evaluate, and pursue federal contracts.",
    lastEdited: "TideFlow status note updated 2026-06-04; source file mtimes observed 2026-04-22.",
    status: "Validated prospect base, with source notes calling out stale follow-up hygiene, thin named-contact coverage, and QA issues.",
    businessModel: "B2B platform for small businesses pursuing government contracts. Specific pricing was not documented in inspected files.",
    externalLinks: [
      { label: "Public site", url: "https://tideflow.netlify.app/" }
    ],
    goal: "Give small businesses an AI-guided workflow for opportunity discovery, evaluation, and contract pursuit.",
    approach: "The app source uses React, TypeScript, Vite, Tailwind, shadcn/Radix, Supabase auth/Postgres/Edge Functions/Realtime, and Netlify deployment.",
    outcome: "Partially achieved. The app and prospect base exist, but current source notes say follow-up and QA must be repaired before widening.",
    unknowns: ["Pricing model is not documented.", "Current customer count and live retention are not documented."],
    sources: [
      ".openclaw/agents/loki-nsn/agent/TideFlow/README.md",
      "Projects/TideFlow/Status.md",
      "ProducerOps/Reports/2026-06-04/tideflow/latest.md"
    ],
    images: [
      "/assets/case-studies/tideflow/live-home.png",
      "/assets/case-studies/tideflow/war-room-concept.png",
      "/assets/case-studies/tideflow/dibbs-reference-1.png",
      "/assets/case-studies/tideflow/dibbs-reference-2.png"
    ],
    sections: [
      ["What We Built", "A GovCon intelligence app with authenticated product surfaces, AI workflows, Supabase-backed data, and Loki-style assistant framing."],
      ["Why It Exists", "Small businesses need help finding relevant opportunities, understanding fit, and moving through contracting work without losing context."],
      ["How We Approached It", "The architecture leans on Supabase, realtime data, edge functions, React UI, and Netlify deployment for a fast product loop."],
      ["Where It Stands", "The source status says the prospect base is validated, but follow-up hygiene, named-contact coverage, and product QA remain blockers."]
    ]
  },
  {
    slug: "impulse",
    title: "Impulse",
    label: "Trade Review",
    category: "Trading discipline",
    kicker: "Fail-closed trading research",
    deck: "A trading research and review system built around broker receipts, exposure checks, session review, and non-certifying safety boundaries.",
    lastEdited: "Latest Impulse report refreshed 2026-06-24; local Coinbase state files observed 2026-06-25.",
    status: "Flat local exposure reads in latest report, but P&L remains non-certifying because canonical receipt artifacts are missing.",
    businessModel: "Internal trading discipline and audit tooling. No public business model was documented in inspected files.",
    externalLinks: [],
    goal: "Prevent false confidence in trading automation by requiring receipt/P&L proof before accounting or action.",
    approach: "The system separates local broker reads, state files, journal summaries, route checks, and fail-closed approval boundaries.",
    outcome: "Partially achieved. Local/API exposure reads were flat in the latest report, but certified P&L and ledger booking remain blocked.",
    unknowns: ["Public productization path is not documented.", "Whether this becomes a paid trading-review product is not documented."],
    sources: [
      "Trading/Impulse Status.md",
      ".openclaw/agents/botler/workspace/reports/impulse/latest.md",
      "StewartOS/Impulse/research/dashboard/SPEC.md"
    ],
    images: [
      "/assets/case-studies/impulse/demo-02s.jpg",
      "/assets/case-studies/impulse/demo-09s.jpg",
      "/assets/case-studies/impulse/demo-16s.jpg",
      "/assets/case-studies/impulse/demo-23s.jpg"
    ],
    sections: [
      ["What We Built", "A local trading review environment with state snapshots, portfolio routes, journal routes, order/position checks, and daily reports."],
      ["Why It Exists", "Trading systems are dangerous when they sound certain without receipts. Impulse is intentionally built to say no when proof is missing."],
      ["How We Approached It", "The current pattern treats broker reads, canonical receipts, journal summaries, and ledger decisions as separate evidence layers."],
      ["Where It Stands", "The latest report shows zero open orders and zero positions in local reads, but P&L remains unavailable until canonical proof exists."]
    ]
  },
  {
    slug: "deadstroke",
    title: "DeadStroke",
    label: "AR Sports",
    category: "Sports training",
    kicker: "AI billiards performance coach",
    deck: "A pool-training product path using camera-based stroke analysis, coaching feedback, native AR work, and regression testing.",
    lastEdited: "DeadStroke repo last git commit observed 2026-06-11.",
    status: "Source snapshot exists with PWA and native app tracks; native AR regression work is the critical verification path.",
    businessModel: "Sports coaching product. Specific pricing was not documented in inspected files.",
    externalLinks: [],
    goal: "Use a phone camera to watch stroke mechanics, analyze movement, and speak coaching feedback after each shot without wearables.",
    approach: "The web track uses React/Vite, TensorFlow.js MoveNet, Claude via Netlify Functions, Supabase, and Netlify. The native track focuses on AR table detection and device-level checks.",
    outcome: "Partially achieved. The product path and source snapshot exist, but true AR confidence requires device-level verification rather than a generic smoke test.",
    unknowns: ["Pricing, launch date, and current user testing status are not documented.", "The exact AR readiness level needs a fresh device check."],
    sources: [
      "Downloads/deadstroke/README.md",
      "Downloads/deadstroke/deadstroke-native/README.md",
      "Memory: DeadStroke native AR regression testing"
    ],
    images: ["/assets/previews/deadstroke.png", "/assets/previews/contact-sheet.png", "/assets/previews/more-builds.png"],
    sections: [
      ["What We Built", "A sports-coaching product with camera setup guidance, pose analysis, AI coaching functions, sessions, shots, badges, and native AR work."],
      ["Why It Exists", "Pool players need immediate form feedback without stopping to review video manually or wearing special sensors."],
      ["How We Approached It", "The web app focuses on accessible camera-based coaching, while the native track targets AR table detection and shot-context verification."],
      ["Where It Stands", "The source is in place, but AR confidence should be judged from actual iPhone/device checks, not just source inspection."]
    ]
  },
  {
    slug: "reddit-finder",
    title: "Reddit Finder",
    label: "Idea Engine",
    category: "Demand intelligence",
    kicker: "Pain-signal scout",
    deck: "A browser-first opportunity scout that turns public pain signals into scored ideas, PRDs, MVP queues, and review dashboards.",
    lastEdited: "PRD source observed in OpenClaw project files; exact last edit not verified from git.",
    status: "Product brief exists; current production status was not verified in this pass.",
    businessModel: "Internal demand engine and possible product-research tool. Public pricing is not documented.",
    externalLinks: [],
    goal: "Use real public pain signals to decide what is worth building before writing code.",
    approach: "The project is framed as a product/opportunity scout that can move from signal to score, concept, PRD, build queue, shipped, parked, or rejected.",
    outcome: "Unknown from source. The brief exists, but live results and adoption were not documented in inspected files.",
    unknowns: ["Current live build status is unknown.", "Any monetization model is unknown.", "Last edit date needs a direct source timestamp or git repo."],
    sources: [
      ".openclaw/agents/botler/workspace/projects/Reddit-Finder-PRD.md",
      "PortfolioSite/index.html"
    ],
    images: [
      "/assets/case-studies/reddit-finder/saas-evidence.png",
      "/assets/case-studies/reddit-finder/entrepreneur-evidence.png",
      "/assets/case-studies/reddit-finder/productivity-evidence.png",
      "/assets/case-studies/reddit-finder/webdev-evidence.png"
    ],
    sections: [
      ["What We Built", "A concept and product surface for turning public community complaints into structured product opportunities."],
      ["Why It Exists", "The goal is to reduce fake demand by grounding the idea queue in observable public pain."],
      ["How We Approached It", "The portfolio framing emphasizes browser-first scouting, scoring, PRD generation, and build/review workflow states."],
      ["Where It Stands", "This page intentionally stays cautious: I found the PRD path, but not enough current runtime evidence to claim adoption or shipped status."]
    ]
  },
  {
    slug: "botler-shell",
    title: "Botler Shell",
    label: "Face for Agents",
    category: "Agent interface",
    kicker: "Home-office command surface",
    deck: "A control surface for agent status, workflow boards, family rhythm, finance visibility, voice-connected operations, and recovery work.",
    lastEdited: "Agent context notes refreshed 2026-06-23.",
    status: "Active internal interface and runtime concept.",
    businessModel: "Internal agent control surface. Public packaging is not documented.",
    externalLinks: [],
    goal: "Give background agents a visible, recoverable, human-facing operating surface.",
    approach: "The shell ties together operational status, workflows, family systems, finance views, voice routes, and human approval boundaries.",
    outcome: "Partially achieved and active. The internal system exists, but the public/client-safe packaging question remains open.",
    unknowns: ["Which shell features should be public is not documented.", "No standalone pricing or launch model was found."],
    sources: [
      "Agents/context/latest.md",
      ".openclaw/agents/botler/workspace/botler/",
      "PortfolioSite/index.html"
    ],
    images: ["/assets/previews/botler-shell.png", "/assets/previews/stewartos.png", "/assets/previews/family-os.png"],
    sections: [
      ["What We Built", "A visual and operational layer for watching agent work, household rhythm, projects, finance, and recovery status."],
      ["Why It Exists", "Agent systems need a face that makes them accountable to the human operator, not just logs buried in folders."],
      ["How We Approached It", "The system is grounded in status documents, operating modes, Telegram/voice routing, and fail-closed updates."],
      ["Where It Stands", "Useful internally, not yet documented as a public product with pricing or boundaries."]
    ]
  },
  {
    slug: "local-sites",
    title: "Local Sites",
    label: "Site Builds",
    category: "Market tests",
    kicker: "Small-business proof packages",
    deck: "Fast proof packages for local businesses: prospect boards, small site concepts, call scripts, decks, pricing, and follow-up loops.",
    lastEdited: "No-website prospect board activity documented 2026-06-23.",
    status: "Prospect board rebuilt and active as an internal growth/testing lane.",
    businessModel: "Website/service-build offers for local businesses. Specific public pricing was not documented in inspected files.",
    externalLinks: [],
    goal: "Turn local no-website or weak-website opportunities into concrete offers and proof quickly.",
    approach: "The workflow uses prospect boards, enrichment, local proof concepts, and founder-led outreach rather than automated mass sending.",
    outcome: "Partially achieved. The latest daily note says the board was rebuilt to 107 prospects, but sales outcomes were not certified in inspected files.",
    unknowns: ["Final offer/pricing needs owner confirmation.", "Closed deals and current pipeline values were not documented."],
    sources: [
      "Daily/2026-06-23.md",
      "Projects/National Website Prospects/call-board-state.json",
      ".openclaw/agents/botler/workspace/work/local-no-website-leads-2026-06-07/perfect-nails-site-prd.md"
    ],
    images: [
      "/assets/case-studies/local-sites/go2-desktop-frame.jpg",
      "/assets/case-studies/local-sites/go2-mobile-frame.jpg",
      "/assets/case-studies/local-sites/go2-desktop-teaser.jpg",
      "/assets/case-studies/local-sites/go2-mobile-teaser.jpg"
    ],
    sections: [
      ["What We Built", "A local-business site-build lane with prospect tracking, offer concepts, calls, and follow-up structure."],
      ["Why It Exists", "Small businesses often need a simple useful site before they need a large digital strategy."],
      ["How We Approached It", "The work starts with boards and proof packages, then uses personal outreach and follow-up rather than anonymous blast automation."],
      ["Where It Stands", "The prospect board is active, but revenue and pricing require current owner-confirmed source truth."]
    ]
  },
  {
    slug: "family-os",
    title: "Family OS",
    label: "Homeschool/Family",
    category: "Education and home ops",
    kicker: "Household operating rhythm",
    deck: "A family operations layer for homeschool planning, lesson boards, summer schedules, activities, daily notes, and calmer household rhythm.",
    lastEdited: "Homeschool status note updated 2026-06-04.",
    status: "Live internal planning system.",
    businessModel: "Family/household internal system. No public business model was documented.",
    externalLinks: [],
    goal: "Make homeschool and family logistics visible, repeatable, and less emotionally expensive to run.",
    approach: "The system uses lesson notes, staging/sync behavior, school boards, daily context, tablet surfaces, and schedule routines.",
    outcome: "Partially achieved. Summer homeschool planning is live, while background write reliability and 7 PM prep automation still need confirmation.",
    unknowns: ["Whether this should be public or private-only is not documented.", "No pricing model or external audience was found."],
    sources: [
      "Family/Homeschool/Status.md",
      "Family/Homeschool/School Board.md",
      "Calendar/README.md"
    ],
    images: [
      "/assets/case-studies/family-os/calendar-home.png",
      "/assets/case-studies/family-os/calendar-ops.png",
      "/assets/case-studies/family-os/kids-botler.png",
      "/assets/case-studies/family-os/header-vibe.png"
    ],
    sections: [
      ["What We Built", "A home and homeschool operating layer with lessons, boards, schedules, activity planning, and daily family context."],
      ["Why It Exists", "The goal is calm execution: fewer scattered notes, fewer missed preparations, and a visible rhythm for the household."],
      ["How We Approached It", "The source notes show a practical sync/staging design because background writes into Documents were unreliable."],
      ["Where It Stands", "Planning is live, but the prep automation and uptime/write-success distinction still need clean confirmation."]
    ]
  },
  {
    slug: "product-lab",
    title: "More Builds",
    label: "More builds",
    category: "Product lab",
    kicker: "Small bets and infrastructure",
    deck: "A portfolio of product experiments, launch systems, content dashboards, video tools, plugins, and agent memory infrastructure.",
    lastEdited: "Mixed sources; exact unified last edit is not documented.",
    status: "Collection of active and parked experiments.",
    businessModel: "Varies by project. MenuLens, Brick PDF Store, Growth Desk, Secret Flipper, and related tools each need separate owner-confirmed business models.",
    externalLinks: [],
    goal: "Move quickly from idea to working surface while preserving enough source truth to judge what deserves more investment.",
    approach: "The lab keeps product briefs, implementation plans, dashboards, content loops, and internal tools close to live operating work.",
    outcome: "Mixed and intentionally varied. Some artifacts are product briefs, some are shipped utilities, and some are internal infrastructure.",
    unknowns: ["Per-project business models need confirmation.", "Which lab projects should graduate into standalone public case studies needs owner selection."],
    sources: [
      ".openclaw/agents/botler/workspace/projects/menulens/PRD.md",
      ".openclaw/agents/botler/workspace/projects/brick-pdf-store/ARCHITECTURE.md",
      ".openclaw/agents/dev/workspace/secret-flipper/PRD.md",
      "PortfolioSite/index.html"
    ],
    images: [
      "/assets/case-studies/product-lab/brick-concept-montage.png",
      "/assets/case-studies/product-lab/memory-brick-gifts.png",
      "/assets/case-studies/product-lab/youcast-episode-art.png",
      "/assets/case-studies/product-lab/reddit-selfhosted-evidence.png"
    ],
    sections: [
      ["What We Built", "A broader product laboratory around small market tests, product briefs, build queues, content dashboards, and internal launch tooling."],
      ["Why It Exists", "The lab keeps creative throughput high without pretending every idea is already a company."],
      ["How We Approached It", "The work is source-led: PRDs, architecture notes, implementation plans, dashboards, and build surfaces."],
      ["Where It Stands", "Some pieces deserve their own future pages. For now this page is the honest container for the wider build field."]
    ]
  }
];
