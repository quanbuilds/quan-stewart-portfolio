const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = process.cwd();
const templatePath = path.join(root, "case-studies", "index.html");
const casesPath = path.join(root, "case-studies", "cases.js");
const template = fs.readFileSync(templatePath, "utf8");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(casesPath, "utf8"), sandbox);
const cases = sandbox.window.CASE_STUDIES;
if (!Array.isArray(cases) || !cases.length) throw new Error("No CASE_STUDIES loaded");

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]));
}
function attr(s) { return esc(s); }
function abs(url) { return url.startsWith("http") ? url : `https://quanbuilds.netlify.app${url.startsWith("/") ? "" : "/"}${url}`; }
function headFor(item) {
  const url = `https://quanbuilds.netlify.app/case-studies/${item.slug}/`;
  const title = `${item.title} Case Study | QuanBuilds`;
  const image = item.images && item.images[0] ? abs(item.images[0]) : "";
  const imageTags = image ? `
    <meta property="og:image" content="${image}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="${image}" />` : `
    <meta name="twitter:card" content="summary" />`;
  return `    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(title)}</title>
    <meta name="description" content="${attr(item.deck)}" />
    <link rel="canonical" href="${url}" />
    <meta name="robots" content="index,follow" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${attr(title)}" />
    <meta property="og:description" content="${attr(item.deck)}" />
    ${imageTags}
    <meta name="twitter:title" content="${attr(title)}" />
    <meta name="twitter:description" content="${attr(item.deck)}" />
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="icon" href="/icon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />`;
}
function liList(values) { return (values || []).map(v => `<li>${esc(v)}</li>`).join("\n"); }
function externalLinksFor(item) {
  const links = item.externalLinks || [];
  if (!links.length) return `<div class="meta-row" id="externalRow" hidden><span class="meta-label">External Links</span><div class="external-links" id="caseExternalLinks"></div></div>`;
  return `<div class="meta-row" id="externalRow"><span class="meta-label">External Links</span><div class="external-links" id="caseExternalLinks">${links.map(link => `<a href="${attr(link.url)}" rel="noopener">${esc(link.label)}</a>`).join("")}</div></div>`;
}
function sectionTitle(section) { return Array.isArray(section) ? section[0] : section.title; }
function sectionBody(section) { return Array.isArray(section) ? section[1] : section.body; }
function sectionImage(item, section, index) {
  const hasImages = item.images && item.images.length;
  return Array.isArray(section) ? (hasImages ? item.images[index % item.images.length] : "") : (section.image || (hasImages ? item.images[index % item.images.length] : ""));
}
function sectionMeta(item, section) { return Array.isArray(section) ? item.label : (section.meta || item.label); }
function slidesFor(item) {
  return (item.sections || []).map((section, i) => {
    const title = sectionTitle(section);
    const body = sectionBody(section);
    const img = sectionImage(item, section, i);
    const meta = sectionMeta(item, section);
    const id = `section-${i+1}`;
    return `<article class="${img ? "slide" : "slide has-no-media"}" id="${id}" data-section="${attr(title)}">
          ${img ? `<div class="slide-visual">
            <figure>
              <div class="image-frame" tabindex="0" role="button" aria-label="Animate ${attr(title)} visual">
                <img src="${attr(img)}" alt="${attr(item.title)} visual ${i+1}" loading="${i === 0 ? "eager" : "lazy"}" />
              </div>
              <figcaption class="image-caption">${esc(meta)} / ${esc(title)}</figcaption>
            </figure>
          </div>` : ""}
          <div class="slide-copy">
            <p class="eyebrow">${String(i+1).padStart(2, "0")} / ${esc(item.category)}</p>
            <h2>${esc(title)}</h2>
            <p>${esc(body)}</p>
          </div>
        </article>`;
  }).join("\n");
}
function linksFor(item) { return (item.sections || []).map((section,i)=>`<a href="#section-${i+1}">${esc(sectionTitle(section))}</a>`).join("\n"); }
function agenticosTower() {
  return `<svg class="tower-lines" viewBox="0 0 320 920" aria-hidden="true">
      <path d="M160 8l8 38v118l28 34v122l34 38v214l45 44v244H45V616l45-44V358l34-38V198l28-34V46l8-38Z"/>
      <path d="M160 8v852M136 98v762M184 98v762M112 206v654M208 206v654"/>
      <path d="M148 126v734M172 126v734M100 360v500M220 360v500M76 622v238M244 622v238"/>
      <path d="M136 46h48M128 82h64M118 146h84M104 198h112"/>
      <path d="M144 46l16-38 16 38M136 98l24-52 24 52M124 198l36-34 36 34"/>
      <path d="M124 320l36-42 36 42M90 358l70-80 70 80"/>
      <path d="M90 572l70-70 70 70M90 714l70-70 70 70"/>
      <path d="M45 616l115-114 115 114M45 760l115-116 115 116"/>
      <path d="M45 860h230M20 876h280M0 892h320"/>
      <path d="M124 198v122M196 198v122M124 358v214M196 358v214M124 616v244M196 616v244"/>
      <path d="M108 430h104M124 502h72M108 572h104M124 644h72M108 714h104M124 786h72"/>
      <path d="M160 164l36 34M160 164l-36 34M160 278l70 80M160 278l-70 80M160 502l70 70M160 502l-70 70M160 644l70 70M160 644l-70 70"/>
      <path d="M146 762l14-18 14 18v98h-28v-98Z"/>
      <path d="M130 802l30-36 30 36v58h-60v-58Z"/>
      <path d="M132 810l28-34 28 34M146 830l14-18 14 18"/>
      <path class="tower-spire" d="M160 8v-40M150 46l10-38 10 38"/>
      <path d="M36 860V736l54-52M284 860V736l-54-52"/>
      <circle cx="160" cy="608" r="4"/>
    </svg>`;
}
function agentIcon(name) {
  const icons = {
    Botler: '<path d="M12 3l2.1 5.5L20 10.6l-5.9 2.1L12 18l-2.1-5.3L4 10.6l5.9-2.1L12 3Z"/><path d="M19 4v4M21 6h-4"/>',
    Cash: '<path d="M12 4v16M16 7.5c-1-1-2.4-1.5-4-1.5-2.2 0-4 1.1-4 3 0 4.3 8 1.7 8 6 0 1.9-1.8 3-4 3-1.7 0-3.2-.6-4.2-1.7"/>',
    Dev: '<path d="m9 8-4 4 4 4M15 8l4 4-4 4M13 6l-2 12"/>',
    Jim: '<circle cx="12" cy="8" r="3"/><path d="M5 20c1.4-3.2 3.8-5 7-5s5.6 1.8 7 5"/>',
    Hermes: '<path d="M4 15c7-1 11-4.5 16-11-1.2 6.8-4.8 12-13 15"/><path d="M8 16c2.5-3.4 5.9-5.8 10-7"/>',
    Loki: '<path d="M7 8c-2-3-1-5 1-6 0 3 2 5 4 6 2-1 4-3 4-6 2 1 3 3 1 6"/><path d="M6 9c0 5 2.5 9 6 9s6-4 6-9"/><path d="M9 20h6"/>',
    Impulse: '<path d="M13 2 5 14h6l-1 8 8-12h-6l1-8Z"/>',
    Red: '<path d="M12 3 5 6v5c0 4.6 2.9 8.3 7 10 4.1-1.7 7-5.4 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
    Doc: '<path d="M7 3h7l4 4v14H7V3Z"/><path d="M14 3v5h4M9 13h6M9 17h6"/>',
    Atlas: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9M12 3c-2.5 2.6-3.8 5.6-3.8 9s1.3 6.4 3.8 9"/>',
    Scout: '<path d="m16 8-4 10-4-4-4 2 4-10 4 4 4-2Z"/><path d="m12 10-2 4"/>',
  };
  return `<svg class="agent-icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || '<path d="M12 3l9 9-9 9-9-9 9-9Z"/>'}</svg>`;
}
function controlIcon(name) {
  const icons = {
    Plan: '<path d="M4 12h16M12 4v16"/><path d="m8 8-4 4 4 4M16 8l4 4-4 4"/>',
    Execute: '<path d="M12 3a9 9 0 1 0 9 9"/><path d="M12 7v5l3 3"/><path d="m17 3 4 4-4 4"/>',
    Verify: '<rect x="5" y="5" width="14" height="14" rx="2"/><path d="m8.5 12.5 2.5 2.5 4.5-6"/>',
    Memory: '<path d="M8 7a4 4 0 0 1 8 0v1h1a3 3 0 0 1 0 6h-1v1a4 4 0 0 1-8 0v-1H7a3 3 0 0 1 0-6h1V7Z"/><path d="M8 10h8M8 14h8"/>',
    Approval: '<circle cx="12" cy="12" r="8"/><path d="m8.5 12.5 2.2 2.2 4.8-5.4"/>',
  };
  return `<svg class="control-icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
}
const agentProfiles = [
  {
    name: "Botler",
    role: "Control plane",
    model: "Current OpenClaw profile: openai/gpt-5.5. Heartbeat also uses openai/gpt-5.5.",
    does: "Receives the human request, decides whether the work should stay in the main session or route to a specialist, keeps approval gates visible, and turns scattered work into durable reports.",
    how: "Botler works from the shared memory, run ledger, operating-mode contracts, and project artifacts. It does not treat chat as the source of truth when a file, receipt, route, or deploy can be checked.",
    goal: "Become the dependable front desk for the whole system: one command surface, clear routing, honest fallback disclosure, and no silent downgrade on household-critical or business-critical work."
  },
  {
    name: "Cash",
    role: "Revenue and finance truth",
    model: "Current OpenClaw profile: openai/gpt-5.4.",
    does: "Keeps the money story honest: revenue movement, receivables, outreach proof, P&L gaps, and whether a project actually moved closer to cash.",
    how: "Cash compares claims against ledgers, invoices, outreach trackers, payment receipts, broker/account receipts, and daily KPI artifacts before it lets a number become operator truth.",
    goal: "Reach decision-grade financial reporting: clean daily cash position, booked revenue, overdue proofs, and automatic escalation when the source chain is missing."
  },
  {
    name: "Dev",
    role: "Engineering repair and build execution",
    model: "Current OpenClaw profile: openai/gpt-5.5.",
    does: "Handles implementation, source inspection, deploy repair, runtime debugging, and the narrow code changes needed to unblock products.",
    how: "Dev works against the real repo, the live route, the scheduler state, and the generated artifacts. It pairs with Red and Doc so fixes are checked and recorded instead of merely attempted.",
    goal: "Become a reliable build lane that can take a scoped issue from diagnosis to verified deploy with receipts, while leaving unrelated work untouched."
  },
  {
    name: "Jim",
    role: "F10.0RD growth and storefront operator",
    model: "Current OpenClaw profile: openai/gpt-5.5.",
    does: "Runs the music/storefront lane: content drafts, outbound opportunities, site health checks, catalog status, and approval-gated revenue actions.",
    how: "Jim reads F10.0RD artifacts, content dashboards, draft packets, storefront checks, CRM/inbox trackers, and approval state before recommending a send, post, listing, or follow-up.",
    goal: "Turn F10.0RD into a measurable operating loop where content, outreach, storefront health, orders, and revenue all reconcile cleanly."
  },
  {
    name: "Hermes",
    role: "Runtime and transport layer",
    model: "Current OpenClaw profile: openai/gpt-5.5. Older architecture notes recommended google/gemini-2.5-flash for fast transport work, with escalation to stronger models.",
    does: "Carries runtime/orchestration context, agent communication, task handoffs, and switchboard-style execution without muddying Botler's family/business context.",
    how: "Hermes owns operational heavy lifting: route messages, run bounded tasks, move state between agents, and raise `needs_decision` when the work requires Botler or Quan.",
    goal: "Become the clean transport layer for multi-agent work: reliable handoffs, clear job ownership, and no context bleed between specialists."
  },
  {
    name: "Loki",
    role: "Cleanup, QA routing, and opportunity hygiene",
    model: "Current OpenClaw profile: openai/gpt-5.5.",
    does: "Owns cleanup, optimization, mode switching, TideFlow prospect hygiene, and recurring QA/opportunity movement loops.",
    how: "Loki reads trackers, stale dates, contact coverage, scheduler health, product QA reports, and operating-mode state to keep the machine and project lanes from drifting.",
    goal: "Become the system's reliability and momentum layer: cleaner workspaces, healthier queues, sharper prospects, and mode-aware automation."
  },
  {
    name: "Impulse",
    role: "Trading discipline and market exposure",
    model: "Current OpenClaw profile: openai/gpt-5.5.",
    does: "Monitors trading posture, open orders, positions, broker/source truth, paper signals, and whether live risk is allowed or should fail closed.",
    how: "Impulse refuses to book P&L or trade state without a durable receipt chain: balances, positions, orders, fills, fees, market data, and quote validation.",
    goal: "Become a disciplined trading assistant with certified receipts, decision-grade exposure checks, and risk controls that fail closed when truth is incomplete."
  },
  {
    name: "Red",
    role: "Product QA and adversarial review",
    model: "Current OpenClaw profile: openai/gpt-5.5.",
    does: "Finds broken flows, stale data, routing problems, misleading UI states, and product regressions before users run into them.",
    how: "Red combines static checks, local builds, smoke tests, route probes, and browser QA when tooling/session access exists. It records blockers instead of pretending a full pass happened.",
    goal: "Become the automatic quality gate for every public product: authenticated smoke tests, route checks, console review, stale-data detection, and deploy drift alerts."
  },
  {
    name: "Doc",
    role: "Receipts, repairs, and artifact truth",
    model: "Current OpenClaw profile: openai/gpt-5.5.",
    does: "Repairs receipt chains, corrects stale scheduler/watchdog artifacts, writes clear status truth, and keeps operational records aligned with live state.",
    how: "Doc cross-checks run logs, jobs-state, repair tickets, ledgers, and report files, then patches the durable record without triggering public sends or risky external actions.",
    goal: "Become the audit layer for AgenticOS: every important run should leave a clean, current, verifiable trail."
  },
  {
    name: "Atlas",
    role: "Financial planning and strategy",
    model: "Agent registry model: anthropic/claude-sonnet-4-5.",
    does: "Supports higher-level financial planning, portfolio strategy, debt elimination, wealth-building work, and supervision of research lanes.",
    how: "Atlas works from shared context, Scout research, financial recovery plans, and strategy notes, then turns market and household constraints into practical decisions.",
    goal: "Become a trustworthy strategic advisor with strong tool discipline, clear fallback disclosure, and durable plans that Cash can later verify against real numbers."
  },
  {
    name: "Scout",
    role: "Research and opportunity discovery",
    model: "Agent registry model: google/gemini-2.5-flash.",
    does: "Scans markets, pain points, product opportunities, trends, and expansion signals so Atlas, Botler, and product agents can make better calls.",
    how: "Scout is optimized for fast research passes and usable summaries, with factual accuracy and cited source trails prioritized over novelty.",
    goal: "Become the first-pass research radar for new product wedges, market shifts, competitor signals, and customer pain worth turning into action."
  }
];
function agentSlug(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function agentProfileSections() {
  return agentProfiles.map((agent) => `<article class="agent-section" id="agent-${agentSlug(agent.name)}" data-section="${attr(agent.name)}">
          <div class="agent-section-head">
            ${agentIcon(agent.name)}
            <div>
              <p class="eyebrow">${esc(agent.role)}</p>
              <h3>${esc(agent.name)}</h3>
            </div>
          </div>
          <div class="agent-section-grid">
            <p><strong>What they do</strong>${esc(agent.does)}</p>
            <p><strong>How they work</strong>${esc(agent.how)}</p>
            <p><strong>Model</strong>${esc(agent.model)}</p>
            <p><strong>Long-term goal</strong>${esc(agent.goal)}</p>
          </div>
        </article>`).join("\n");
}
function agenticosVisuals(item) {
  return `<article class="proof-card proof-memory">
          <h3>Memory</h3>
          <div class="editor-mock">
            <div class="editor-tab">001_overview.md</div>
            <pre># Project Overview
This project focuses on building a multi-agent operating system that coordinates specialized agents through a unified control plane.

## Principles
- Clarity over cleverness
- Durable over ephemeral
- Verifiable over assumed</pre>
          </div>
        </article>
        <article class="proof-card proof-ledger">
          <h3>Ledger</h3>
          <table>
            <thead><tr><th>Run</th><th>Status</th><th>Agents</th><th>Started</th></tr></thead>
            <tbody>
              <tr><td>R1024</td><td>✓</td><td>Dev, Hermes</td><td>10:14 AM</td></tr>
              <tr><td>R1023</td><td>✓</td><td>Cash, Jim</td><td>10:02 AM</td></tr>
              <tr><td>R1022</td><td>✓</td><td>Hermes, Loki</td><td>9:48 AM</td></tr>
              <tr><td>R1021</td><td>✓</td><td>Dev, Impulse</td><td>9:31 AM</td></tr>
            </tbody>
          </table>
        </article>
        <article class="proof-card proof-approval">
          <h3>Approval</h3>
          <div class="approval-card">
            <p><strong>Botler</strong> <span>10:14 AM</span></p>
            <p>Run R1024 is ready for review.</p>
            <ul><li>4 files changed</li><li>2 agents executed</li><li>12 verifications passed</li></ul>
            <div><button type="button">Approve</button><button type="button">Reject</button></div>
          </div>
        </article>`;
}
function agenticosSections(item) {
  return (item.sections || []).slice(1).map((section, index) => {
    const sectionIndex = index + 2;
    const title = sectionTitle(section);
    const body = sectionBody(section);
    const visual = sectionImage(item, section, sectionIndex - 1) || item.images?.[0] || "";
    return `<article class="story-panel" id="section-${sectionIndex}" data-section="${attr(title)}">
          <div class="story-copy">
            <p class="eyebrow">${String(sectionIndex).padStart(2, "0")} / ${esc(item.category)}</p>
            <h2>${esc(title)}</h2>
            <p>${esc(body)}</p>
          </div>
          ${visual ? `<figure class="story-visual" data-tilt>
            <img src="${attr(visual)}" alt="${attr(item.title)} ${attr(title)} source artifact" loading="lazy" />
          </figure>` : ""}
        </article>`;
  }).join("\n");
}
function agenticosPageFor(item) {
  const data = JSON.stringify({ slug: item.slug, title: item.title });
  return `<!doctype html>
<html lang="en">
  <head>
${headFor(item)}
    <style>
      :root {
        color-scheme: dark;
        --bg: #070707;
        --fg: #f7f1df;
        --muted: rgba(247, 241, 223, 0.68);
        --line: rgba(247, 241, 223, 0.18);
        --glass: rgba(247, 241, 223, 0.07);
        --glass-strong: rgba(247, 241, 223, 0.11);
        --gold: #c89a3a;
        --gold-soft: rgba(200, 154, 58, 0.18);
        --pad: clamp(18px, 4vw, 56px);
        --max: 1480px;
      }
      [data-theme="light"] {
        color-scheme: light;
        --bg: #f7f5ef;
        --fg: #090907;
        --muted: rgba(9, 9, 7, 0.68);
        --line: rgba(113, 78, 23, 0.28);
        --glass: rgba(255, 252, 242, 0.68);
        --glass-strong: rgba(255, 252, 242, 0.82);
        --gold: #986815;
        --gold-soft: rgba(152, 104, 21, 0.14);
      }
      * { box-sizing: border-box; }
      html { background: var(--bg); scroll-behavior: smooth; }
      body {
        margin: 0;
        overflow-x: hidden;
        background: var(--bg);
        color: var(--fg);
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        line-height: 1.45;
      }
      body::after {
        content: "";
        position: fixed;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        background: var(--bg);
        opacity: 0;
      }
      body::-webkit-scrollbar { width: 0; height: 0; }
      a { color: inherit; text-decoration: none; }
      button, input, textarea { font: inherit; color: inherit; }
      button:focus-visible, a:focus-visible, input:focus-visible, textarea:focus-visible { outline: 1px solid var(--gold); outline-offset: 5px; }
      .topbar {
        position: fixed;
        z-index: 30;
        inset: 0 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
        padding: 24px var(--pad);
        pointer-events: none;
      }
      .topbar a, .theme-toggle {
        pointer-events: auto;
        color: var(--muted);
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.14em;
      }
      .mark {
        color: var(--gold) !important;
        font-family: "Bodoni 72", "Didot", "Baskerville", Georgia, serif;
        font-size: 31px !important;
        font-weight: 500 !important;
        letter-spacing: -0.03em !important;
        text-transform: uppercase;
      }
      .nav-actions {
        display: flex;
        align-items: center;
        gap: clamp(18px, 3vw, 36px);
      }
      .topbar a:hover { color: var(--gold); }
      .theme-toggle {
        width: 32px;
        height: 32px;
        display: grid;
        place-items: center;
        border: 0;
        background: transparent;
        cursor: pointer;
      }
      .theme-toggle::before, .theme-toggle::after {
        content: "";
        grid-area: 1 / 1;
        width: 19px;
        height: 19px;
        border: 1px solid var(--gold);
        transform: rotate(45deg);
      }
      .theme-toggle::after {
        width: 9px;
        height: 9px;
      }
      .case-shell {
        position: relative;
        z-index: 1;
        min-height: 100svh;
      }
      .tower-wrap {
        position: fixed;
        z-index: 1;
        top: 62px;
        bottom: 32px;
        left: 34px;
        width: min(22vw, 315px);
        display: grid;
        align-items: end;
        pointer-events: none;
      }
      .tower-sticky {
        height: calc(100svh - 94px);
        display: grid;
        place-items: end center;
        padding: 0;
        transform: translateY(var(--tower-shift, 0px));
        will-change: transform;
      }
      .tower-lines {
        width: 100%;
        height: 100%;
        fill: none;
        stroke: var(--gold);
        stroke-width: 1.2;
        stroke-linecap: square;
        stroke-linejoin: miter;
        opacity: 0.95;
      }
      .content {
        position: relative;
        z-index: 2;
        width: min(var(--max), 100%);
        margin: 0 auto;
        padding: 92px clamp(38px, 4vw, 58px) 0 clamp(330px, 25vw, 390px);
      }
      .eyebrow, .meta-label, .artifact figcaption, .feedback-status {
        color: var(--muted);
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.16em;
      }
      h1, h2, h3 {
        margin: 0;
        font-family: "Bodoni 72", "Didot", "Baskerville", Georgia, serif;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .hero {
        min-height: 0;
        display: grid;
        grid-template-columns: minmax(0, 0.78fr) minmax(420px, 1.08fr);
        align-items: center;
        gap: clamp(34px, 5vw, 86px);
        padding: 30px 0 18px;
      }
      h1 {
        margin-top: 12px;
        font-size: clamp(66px, 8.6vw, 112px);
        line-height: 0.86;
        text-transform: none;
        letter-spacing: -0.025em;
      }
      .title-rule {
        display: grid;
        grid-template-columns: 1fr 36px 1fr;
        align-items: center;
        gap: 16px;
        margin: 22px 0;
        color: var(--gold);
      }
      .title-rule::before, .title-rule::after {
        content: "";
        height: 1px;
        background: var(--gold);
        opacity: 0.55;
      }
      .title-rule span {
        display: grid;
        place-items: center;
        font-size: 26px;
        line-height: 1;
      }
      .deck {
        max-width: 43ch;
        margin: 28px 0 0;
        color: var(--muted);
        font-size: clamp(16px, 1.45vw, 20px);
        line-height: 1.55;
      }
      .case-meta {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 18px;
        margin-top: 22px;
      }
      .case-meta .meta-row {
        min-height: auto;
        padding: 0;
        border: 0;
        background: transparent;
      }
      .meta-glass, .story-panel, .fact-card, .comment-card, .comment-form input, .comment-form textarea {
        border: 1px solid var(--line);
        background: var(--glass);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
        backdrop-filter: blur(22px) saturate(1.2);
        -webkit-backdrop-filter: blur(22px) saturate(1.2);
      }
      .meta-glass {
        display: none;
      }
      .meta-row {
        min-height: 118px;
        display: grid;
        align-content: start;
        gap: 8px;
        padding: 18px;
        border-right: 1px solid var(--line);
      }
      .meta-row:last-child { border-right: 0; }
      .meta-row strong { font-weight: 600; }
      .jumpbar {
        display: none;
        flex-wrap: wrap;
        gap: 8px;
        padding: 8px;
        margin: 14px 0 20px;
        border: 1px solid var(--line);
        background: color-mix(in srgb, var(--bg) 78%, transparent);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
      }
      .jumpbar a {
        min-height: 34px;
        display: inline-flex;
        align-items: center;
        padding: 9px 12px;
        border: 1px solid transparent;
        color: var(--muted);
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }
      .jumpbar a:hover, .jumpbar a.is-active {
        color: var(--gold);
        border-color: var(--gold);
        background: var(--gold-soft);
      }
      .artifact-grid {
        display: grid;
        grid-template-columns: 1.15fr 1fr 0.86fr;
        gap: 22px;
        align-items: end;
        padding: clamp(18px, 2.4vw, 28px);
        border: 1px solid rgba(200, 154, 58, 0.68);
        border-radius: 12px;
        background: rgba(247, 241, 223, 0.055);
        backdrop-filter: blur(22px) saturate(1.2);
        -webkit-backdrop-filter: blur(22px) saturate(1.2);
      }
      .artifact-grid::before {
        content: "Proof Trail";
        grid-column: 1 / -1;
        color: var(--fg);
        font-family: "Bodoni 72", "Didot", "Baskerville", Georgia, serif;
        font-size: clamp(28px, 3vw, 40px);
      }
      .artifact {
        margin: 0;
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: rgba(10, 10, 10, 0.56);
        transform: translateY(var(--lift, 0px));
        transition: transform 200ms ease, border-color 200ms ease;
      }
      .artifact:nth-child(2) { grid-column: 1; }
      .artifact:nth-child(3) { grid-column: 2; }
      .artifact:nth-child(4) { grid-column: 3; }
      .artifact:nth-child(5) { display: none; }
      .artifact:hover, .story-visual:hover {
        --lift: -4px;
        border-color: var(--gold);
      }
      .artifact img, .story-visual img {
        display: block;
        width: 100%;
        height: auto;
      }
      .artifact figcaption {
        padding: 11px 12px;
        border-top: 1px solid var(--line);
      }
      .story {
        display: grid;
        gap: 22px;
        padding: 0 0 22px;
      }
      .story-panel {
        min-height: 0;
        display: grid;
        grid-template-columns: minmax(0, 0.92fr) minmax(280px, 0.78fr);
        gap: clamp(24px, 5vw, 66px);
        align-items: center;
        border-radius: 12px;
        padding: clamp(22px, 4vw, 46px);
      }
      .story-panel:first-child {
        min-height: 310px;
      }
      .control-card {
        min-height: 310px;
        border-radius: 12px;
        border-color: rgba(200, 154, 58, 0.68);
        background: rgba(247, 241, 223, 0.055);
        box-shadow: inset 0 0 42px rgba(247, 241, 223, 0.025);
      }
      .story-copy {
        display: grid;
        gap: 18px;
      }
      .story-copy h2 {
        font-size: clamp(31px, 3.8vw, 45px);
        line-height: 1;
        text-transform: none;
        letter-spacing: -0.01em;
      }
      .story-copy p {
        margin: 0;
        color: var(--muted);
        font-size: clamp(18px, 2.1vw, 25px);
        line-height: 1.5;
      }
      .story-visual {
        width: 100%;
        margin: 0;
        overflow: hidden;
        border: 1px solid var(--line);
        background: #0b0b0b;
        transform: translateY(var(--lift, 0px));
        transition: transform 200ms ease, border-color 200ms ease;
      }
      .control-list {
        display: grid;
        gap: 12px;
        margin: 0;
        padding: 0;
        list-style: none;
        color: var(--muted);
      }
      .control-list li {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .control-icon {
        width: 15px;
        height: 15px;
        flex: 0 0 auto;
        fill: none;
        stroke: var(--gold);
        stroke-width: 1.55;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .story-visual, .roster-strip, .proof-card {
        border-color: rgba(200, 154, 58, 0.5);
        background: rgba(247, 241, 223, 0.052);
      }
      .proof-card {
        overflow: hidden;
        border: 1px solid rgba(200, 154, 58, 0.5);
        border-radius: 8px;
        padding: clamp(14px, 1.8vw, 20px);
        transform: translateY(var(--lift, 0px));
        transition: transform 200ms ease, border-color 200ms ease;
      }
      .story-visual:hover, .roster-strip:hover, .proof-card:hover, .control-card:hover {
        border-color: rgba(200, 154, 58, 0.88);
      }
      .terminal-panel {
        padding: 0;
      }
      .terminal-panel pre {
        margin: 0;
        min-height: 190px;
        padding: 16px 18px;
        overflow: auto;
        color: #d8d0be;
        background: rgba(7, 7, 7, 0.62);
        font-family: Menlo, Consolas, monospace;
        font-size: clamp(10px, 1vw, 12px);
        line-height: 1.75;
        white-space: pre-wrap;
      }
      .terminal-panel span {
        color: var(--fg);
      }
      .roster-strip {
        position: sticky;
        z-index: 24;
        top: 72px;
        display: flex;
        flex-wrap: nowrap;
        align-items: center;
        gap: 6px;
        width: 100%;
        max-width: min(100%, 1040px);
        overflow-x: auto;
        overscroll-behavior-x: contain;
        scrollbar-width: none;
        -webkit-overflow-scrolling: touch;
        padding: 8px;
        border: 1px solid rgba(200, 154, 58, 0.5);
        border-radius: 32px;
        background:
          linear-gradient(90deg, transparent 0 3%, var(--gold-soft) 18%, transparent 34% 66%, var(--gold-soft) 82%, transparent 97%),
          radial-gradient(circle at var(--agent-rail-x, 50%) var(--agent-rail-y, 50%), rgba(255, 255, 255, 0.20), transparent 28%),
          linear-gradient(115deg, rgba(255, 255, 255, 0.12), transparent 32%),
          var(--glass);
        box-shadow: 0 18px 50px rgba(0, 0, 0, 0.24);
        backdrop-filter: blur(24px) saturate(1.45) contrast(1.04);
        -webkit-backdrop-filter: blur(24px) saturate(1.45) contrast(1.04);
      }
      .roster-strip::-webkit-scrollbar {
        display: none;
      }
      .roster-strip::before {
        content: "Agents";
        flex: 0 0 auto;
        min-width: 82px;
        display: grid;
        place-items: center;
        color: var(--gold);
        font-size: 10px;
        font-weight: 900;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }
      .roster-strip a {
        flex: 0 0 auto;
        min-width: 124px;
        min-height: 54px;
        display: inline-flex;
        justify-content: center;
        align-items: center;
        gap: 10px;
        border: 1px solid var(--line);
        border-radius: 24px;
        padding: 8px 14px;
        color: var(--muted);
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        transition: color 180ms ease, border-color 180ms ease, background 180ms ease, transform 180ms ease;
      }
      .roster-strip a:hover, .roster-strip a.is-active {
        color: var(--fg);
        border-color: var(--gold);
        background: var(--gold-soft);
        transform: translateY(-2px);
      }
      .roster-strip a.is-active {
        box-shadow: inset 0 0 0 1px rgba(200, 154, 58, 0.28);
      }
      .agent-icon {
        width: 30px;
        height: 30px;
        padding: 6px;
        border: 1px solid var(--gold);
        border-radius: 999px;
        fill: none;
        stroke: currentColor;
        stroke-width: 1.7;
        stroke-linecap: round;
        stroke-linejoin: round;
        color: var(--gold);
      }
      .proof-card h3 {
        margin: 0 0 8px;
        color: var(--fg);
        font-family: "Bodoni 72", "Didot", "Baskerville", Georgia, serif;
        font-size: clamp(20px, 2vw, 25px);
        font-weight: 500;
      }
      .agent-deep-dive {
        display: grid;
        gap: 14px;
        padding: 22px 0;
      }
      .agent-deep-dive > .eyebrow {
        color: var(--gold);
      }
      .agent-section {
        display: grid;
        grid-template-columns: minmax(220px, 0.55fr) minmax(0, 1fr);
        gap: clamp(22px, 4vw, 58px);
        padding: clamp(22px, 4vw, 42px);
        border: 1px solid rgba(200, 154, 58, 0.5);
        border-radius: 12px;
        background: rgba(247, 241, 223, 0.052);
        backdrop-filter: blur(22px) saturate(1.2);
        -webkit-backdrop-filter: blur(22px) saturate(1.2);
        scroll-margin-top: 168px;
      }
      .agent-section:hover {
        border-color: rgba(200, 154, 58, 0.88);
      }
      .agent-section-head {
        display: flex;
        align-items: start;
        gap: 16px;
      }
      .agent-section-head .agent-icon {
        width: 44px;
        height: 44px;
        padding: 9px;
      }
      .agent-section h3 {
        font-size: clamp(30px, 3vw, 45px);
        line-height: 0.95;
        text-transform: none;
        letter-spacing: -0.01em;
      }
      .agent-section-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
      }
      .agent-section-grid p {
        margin: 0;
        color: var(--muted);
        line-height: 1.55;
      }
      .agent-section-grid strong {
        display: block;
        margin-bottom: 6px;
        color: var(--fg);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.14em;
      }
      .editor-mock, .proof-ledger table, .approval-card {
        width: 100%;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: rgba(6, 7, 7, 0.66);
        color: #d8d0be;
        font-family: Menlo, Consolas, monospace;
        font-size: 11px;
      }
      .editor-tab {
        padding: 9px 12px;
        border-bottom: 1px solid var(--line);
      }
      .editor-mock pre {
        margin: 0;
        min-height: 160px;
        padding: 14px;
        overflow: auto;
        white-space: pre-wrap;
        line-height: 1.55;
      }
      .proof-ledger table {
        border-collapse: collapse;
        overflow: hidden;
      }
      .proof-ledger th, .proof-ledger td {
        padding: 10px 12px;
        border-bottom: 1px solid rgba(247,241,223,0.09);
        text-align: left;
      }
      .proof-ledger th {
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 9px;
      }
      .approval-card {
        min-height: 160px;
        padding: 16px;
      }
      .approval-card p {
        margin: 0 0 8px;
      }
      .approval-card span {
        color: var(--muted);
        font-size: 10px;
      }
      .approval-card ul {
        margin: 8px 0 14px;
        padding-left: 18px;
      }
      .approval-card button {
        min-height: 30px;
        margin-right: 8px;
        border: 1px solid var(--line);
        border-radius: 4px;
        padding: 6px 14px;
        background: transparent;
        color: var(--fg);
      }
      .approval-card button:first-child {
        background: rgba(67, 132, 77, 0.64);
      }
      .facts, .feedback {
        padding: clamp(56px, 9vw, 120px) 0;
        border-top: 1px solid var(--line);
      }
      .fact-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .fact-card, .comment-card, .inquiry-card {
        display: grid;
        gap: 12px;
        padding: clamp(18px, 3vw, 28px);
      }
      .fact-card h3, .feedback h2 {
        font-size: clamp(32px, 5vw, 70px);
        line-height: 0.92;
      }
      .fact-card p, .source-list, .comment-card p {
        margin: 0;
        color: var(--muted);
      }
      .inquiry-card {
        border-color: rgba(200, 154, 58, 0.68);
      }
      .inquiry-card h3 {
        font-size: clamp(34px, 3.8vw, 58px);
        line-height: 0.96;
      }
      .inquiry-form {
        display: grid;
        gap: 10px;
      }
      .inquiry-form input, .inquiry-form textarea, .inquiry-form select {
        width: 100%;
        min-height: 42px;
        border: 1px solid var(--line);
        border-radius: 4px;
        padding: 11px 12px;
        background: rgba(7, 7, 7, 0.24);
        color: var(--fg);
      }
      .inquiry-form textarea {
        min-height: 96px;
        resize: vertical;
      }
      .inquiry-form .split {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }
      .inquiry-status {
        min-height: 18px;
      }
      .source-list {
        display: grid;
        gap: 8px;
        padding-left: 0;
        list-style: none;
        overflow-wrap: anywhere;
      }
      .feedback-head {
        display: flex;
        justify-content: space-between;
        gap: 18px;
        align-items: end;
        margin-bottom: 20px;
      }
      .feedback-actions, .comment-form {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .like-button, .submit-button {
        min-height: 42px;
        border: 1px solid var(--line);
        background: var(--glass);
        cursor: pointer;
        padding: 11px 14px;
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.14em;
      }
      .like-button:hover, .submit-button:hover {
        color: var(--gold);
        border-color: var(--gold);
      }
      .comment-form {
        display: grid;
        grid-template-columns: 0.35fr 1fr auto;
        margin: 18px 0;
      }
      .comment-form input, .comment-form textarea {
        width: 100%;
        min-height: 42px;
        padding: 11px 12px;
      }
      .comment-form textarea { resize: vertical; }
      .comments { display: grid; gap: 10px; }
      .footer {
        position: relative;
        z-index: 1;
        min-height: 36svh;
        display: grid;
        place-items: center;
        padding: var(--pad);
        border-top: 1px solid var(--gold);
        color: var(--bg);
        background: var(--fg);
        text-align: center;
      }
      .footer a {
        color: var(--bg);
        font-family: "Bodoni 72", "Didot", "Baskerville", Georgia, serif;
        font-size: clamp(38px, 8vw, 112px);
        line-height: 0.88;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; scroll-behavior: auto !important; }
        .tower-sticky { transform: none !important; }
      }
      @media (max-width: 900px) {
        .tower-wrap {
          top: 42px;
          left: 50%;
          bottom: auto;
          width: min(68vw, 285px);
          height: 100svh;
          opacity: 0.42;
          transform: translateX(-50%);
        }
        .tower-sticky {
          height: 100svh;
        }
        .content {
          padding-left: var(--pad);
        }
        .hero, .case-meta, .story-panel, .fact-grid, .comment-form, .artifact-grid, .agent-section, .agent-section-grid, .inquiry-form .split {
          grid-template-columns: 1fr;
        }
        .meta-row {
          min-height: auto;
          border-right: 0;
          border-bottom: 1px solid var(--line);
        }
        .meta-row:last-child { border-bottom: 0; }
        .artifact-grid {
          grid-template-columns: 1fr;
        }
        .story-panel {
          min-height: auto;
        }
        .feedback-head {
          display: grid;
        }
      }
      @media (max-width: 620px) {
        .topbar {
          gap: 14px;
          padding-inline: 18px;
        }
        .brand {
          font-size: 28px !important;
        }
        .nav-links {
          gap: 22px;
        }
        .nav-links a:nth-child(n+4), .theme-toggle {
          display: none;
        }
      }
    </style>
  </head>
  <body>
    <header class="topbar" aria-label="Site header">
      <a class="mark" href="/" aria-label="QuanBuilds home">QS</a>
      <div class="nav-actions">
        <a class="back" href="/#work">All Work</a>
        <button class="theme-toggle" type="button" aria-label="Toggle theme"></button>
      </div>
    </header>
    <div class="case-shell">
      <aside class="tower-wrap" aria-hidden="true">
        <div class="tower-sticky">${agenticosTower()}</div>
      </aside>
      <main class="content">
        <section class="hero" id="top">
          <div class="case-intro">
            <p class="eyebrow">Case Study</p>
            <h1>${esc(item.title)}</h1>
            <div class="title-rule"><span>⌄</span></div>
            <div class="case-meta" aria-label="Project metadata">
              <div class="meta-row"><span class="meta-label">Role</span><strong>System Design</strong></div>
              <div class="meta-row"><span class="meta-label">Type</span><strong>Multi-Agent Operating System</strong></div>
              <div class="meta-row"><span class="meta-label">Team</span><strong>Botler + Agents</strong></div>
              <div class="meta-row"><span class="meta-label">Status</span><strong>Live</strong></div>
            </div>
            <p class="deck">${esc(item.deck)}</p>
          </div>
          <div class="story-panel control-card" id="section-1" data-section="${esc(sectionTitle(item.sections[0]))}">
            <div class="story-copy">
              <h2>${esc(sectionTitle(item.sections[0]))}</h2>
              <p class="eyebrow">Botler</p>
              <ul class="control-list">
                ${["Plan","Execute","Verify","Memory","Approval"].map(name => `<li>${controlIcon(name)}${name}</li>`).join("")}
              </ul>
            </div>
            <figure class="story-visual terminal-panel" data-tilt>
              <pre><span>● botler@control-plane</span>
10:14:01  ▸ Plan created: Analyze inbound request
10:14:03  ▸ Routed to: Dev, Hermes
10:14:03  ▸ Dev: Code changes generated
10:14:05  ▸ Hermes: Contract check passed
10:14:06  ▸ Verification complete
10:14:07  ▸ Awaiting human approval

› _</pre>
            </figure>
          </div>
        </section>
        <nav class="jumpbar" aria-label="Case study sections">
          <a href="#section-1">Control Plane</a>
          <a href="#section-2">Agent Roster</a>
          <a href="#section-3">Proof Trail</a>
          <a href="#section-4">Notes</a>
        </nav>
        <section class="artifact-grid" id="section-3" data-section="Proof Trail" aria-label="AgenticOS source artifacts">
          ${agenticosVisuals(item)}
        </section>
        <section class="agent-deep-dive" id="section-agents" data-section="Agent Details" aria-label="Agent details">
          <aside class="roster-strip" id="section-2" data-section="Agent Roster" aria-label="Agent roster">
            ${agentProfiles.map(agent => `<a href="#agent-${agentSlug(agent.name)}">${agentIcon(agent.name)}${agent.name}</a>`).join("")}
          </aside>
          <p class="eyebrow">Agent Details</p>
          ${agentProfileSections()}
        </section>
        <section class="facts" id="section-4" data-section="Notes" aria-label="Evidence and unknowns">
          <div class="fact-grid">
            <article class="fact-card"><p class="meta-label">Goal</p><h3>What we aimed for</h3><p>${esc(item.goal)}</p></article>
            <article class="fact-card"><p class="meta-label">Approach</p><h3>How we tried</h3><p>${esc(item.approach)}</p></article>
            <article class="fact-card"><p class="meta-label">Outcome</p><h3>Did it work?</h3><p>${esc(item.outcome)}</p></article>
            <article class="fact-card inquiry-card">
              <p class="meta-label">Build Inquiry</p>
              <h3>Want something like this built for you?</h3>
              <p>Tell me what kind of agent system, workflow, or product control plane you want to create.</p>
              <form class="inquiry-form" id="inquiryForm">
                <div class="split">
                  <input id="inquiryName" name="name" autocomplete="name" placeholder="Name" />
                  <input id="inquiryEmail" name="email" autocomplete="email" inputmode="email" placeholder="Email" required />
                </div>
                <div class="split">
                  <select id="inquiryBudget" name="budget" aria-label="Budget">
                    <option value="">Budget range</option>
                    <option value="under-5k">Under $5k</option>
                    <option value="5k-15k">$5k-$15k</option>
                    <option value="15k-plus">$15k+</option>
                  </select>
                  <select id="inquiryTimeline" name="timeline" aria-label="Timeline">
                    <option value="">Timeline</option>
                    <option value="now">Now</option>
                    <option value="30-days">Next 30 days</option>
                    <option value="exploring">Exploring</option>
                  </select>
                </div>
                <textarea id="inquiryMessage" name="message" placeholder="What are you trying to build?" required></textarea>
                <button class="submit-button" type="submit">Send Inquiry</button>
                <p class="feedback-status inquiry-status" id="inquiryStatus" aria-live="polite"></p>
              </form>
            </article>
            <article class="fact-card"><p class="meta-label">Next</p><h3>Reusable pattern</h3><p>This case study is about the operating pattern: scoped agents, durable memory, approval gates, and evidence trails that other teams can adapt.</p></article>
          </div>
        </section>
        <section class="feedback" aria-label="Project feedback">
          <div class="feedback-head">
            <div><p class="eyebrow">Feedback</p><h2>Leave a signal.</h2></div>
            <div class="feedback-actions">
              <button class="like-button" id="likeButton" type="button">Like <span id="likeCount">0</span></button>
              <span class="feedback-status" id="feedbackStatus">Loading feedback</span>
            </div>
          </div>
          <form class="comment-form" id="commentForm">
            <input id="commentName" name="name" autocomplete="name" maxlength="80" placeholder="Name" />
            <textarea id="commentText" name="comment" maxlength="700" required placeholder="What did this make you want to know, build, test, or challenge?"></textarea>
            <button class="submit-button" type="submit">Send</button>
          </form>
          <div class="comments" id="comments"></div>
        </section>
      </main>
    </div>
    <footer class="footer">
      <a href="/#work">Back to the work</a>
    </footer>
    <script>
      const caseData = ${data};
      const formatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });
      const root = document.documentElement;
      const savedTheme = localStorage.getItem("portfolio-theme");
      root.dataset.theme = savedTheme || "dark";
      document.querySelector(".theme-toggle").addEventListener("click", () => {
        const next = root.dataset.theme === "dark" ? "light" : "dark";
        root.dataset.theme = next;
        localStorage.setItem("portfolio-theme", next);
      });

      function payload(extra = {}) {
        return {
          project: caseData.slug,
          path: location.pathname + location.search + location.hash,
          title: document.title,
          referrer: document.referrer,
          viewport: { width: window.innerWidth, height: window.innerHeight },
          connection: navigator.connection?.effectiveType || "",
          ...extra,
        };
      }
      function track(type, data = {}) {
        const body = JSON.stringify({ type, data: payload(data) });
        if (navigator.sendBeacon) {
          navigator.sendBeacon("/.netlify/functions/analytics", new Blob([body], { type: "application/json" }));
          return;
        }
        fetch("/.netlify/functions/analytics", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true }).catch(() => {});
      }
      function postFeedback(data) {
        return fetch("/.netlify/functions/analytics", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ type: "feedback", data: payload(data) }),
        }).then((res) => res.json());
      }
      function postInquiry(data) {
        return fetch("/.netlify/functions/analytics", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ type: "inquiry", data: payload(data) }),
        }).then((res) => res.json());
      }
      function cleanText(value, fallback = "") {
        return String(value || fallback).replace(/[<>]/g, "").slice(0, 700);
      }
      async function loadFeedback() {
        const status = document.getElementById("feedbackStatus");
        try {
          const res = await fetch("/.netlify/functions/analytics?feedback=" + encodeURIComponent(caseData.slug));
          const data = await res.json();
          const summary = data.summary || { likes: 0, comments: [] };
          document.getElementById("likeCount").textContent = summary.likes || 0;
          status.textContent = (summary.commentCount || 0) + " comments";
          const nodes = (summary.comments || []).map((comment) => {
            const card = document.createElement("article");
            card.className = "comment-card";
            const date = comment.ts ? formatter.format(new Date(comment.ts)) : "";
            card.innerHTML = '<p class="meta-label">' + cleanText(comment.name, "Anonymous") + (date ? " / " + date : "") + '</p><p>' + cleanText(comment.comment) + '</p>';
            return card;
          });
          document.getElementById("comments").replaceChildren(...nodes);
        } catch {
          status.textContent = "Feedback unavailable";
        }
      }
      document.getElementById("likeButton").addEventListener("click", async () => {
        document.getElementById("feedbackStatus").textContent = "Saving like";
        try {
          await postFeedback({ action: "like" });
          track("click", { label: "case_like" });
          await loadFeedback();
        } catch {
          document.getElementById("feedbackStatus").textContent = "Like did not save";
        }
      });
      document.getElementById("commentForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        const comment = document.getElementById("commentText").value;
        if (!comment.trim()) return;
        document.getElementById("feedbackStatus").textContent = "Saving comment";
        try {
          await postFeedback({ action: "comment", name: document.getElementById("commentName").value, comment });
          track("click", { label: "case_comment" });
          document.getElementById("commentText").value = "";
          await loadFeedback();
        } catch {
          document.getElementById("feedbackStatus").textContent = "Comment did not save";
        }
      });
      document.getElementById("inquiryForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        const email = document.getElementById("inquiryEmail").value;
        const message = document.getElementById("inquiryMessage").value;
        const status = document.getElementById("inquiryStatus");
        if (!email.trim() || !message.trim()) return;
        status.textContent = "Sending inquiry";
        try {
          await postInquiry({
            action: "build_inquiry",
            name: document.getElementById("inquiryName").value,
            email,
            budget: document.getElementById("inquiryBudget").value,
            timeline: document.getElementById("inquiryTimeline").value,
            message,
          });
          track("click", { label: "case_build_inquiry" });
          event.currentTarget.reset();
          status.textContent = "Inquiry sent";
        } catch {
          status.textContent = "Inquiry did not send";
        }
      });
      document.querySelectorAll("[data-tilt]").forEach((node) => {
        node.addEventListener("click", () => {
          node.animate([{ transform: "translateY(0)" }, { transform: "translateY(-6px)" }, { transform: "translateY(0)" }], { duration: 520, easing: "cubic-bezier(.16,1,.3,1)" });
          track("click", { label: "agenticos_artifact", target: node.querySelector("figcaption")?.textContent || "" });
        });
      });
      const rosterRail = document.querySelector(".roster-strip");
      const agentLinks = Array.from(document.querySelectorAll(".roster-strip a"));
      const agentSections = Array.from(document.querySelectorAll(".agent-section"));
      let activeAgentId = "";
      if (rosterRail) {
        rosterRail.addEventListener("pointermove", (event) => {
          const rect = rosterRail.getBoundingClientRect();
          rosterRail.style.setProperty("--agent-rail-x", event.clientX - rect.left + "px");
          rosterRail.style.setProperty("--agent-rail-y", event.clientY - rect.top + "px");
        });
      }
      function updateAgentRail() {
        if (!agentLinks.length || !agentSections.length) return;
        const targetLine = (rosterRail?.offsetHeight || 0) + 112;
        let current = agentSections[0];
        for (const section of agentSections) {
          if (section.getBoundingClientRect().top <= targetLine) current = section;
        }
        if (current.id === activeAgentId) return;
        activeAgentId = current.id;
        agentLinks.forEach((link) => {
          const active = link.getAttribute("href") === "#" + activeAgentId;
          link.classList.toggle("is-active", active);
          link.setAttribute("aria-current", active ? "true" : "false");
          if (active) link.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        });
      }
      const links = Array.from(document.querySelectorAll(".jumpbar a"));
      const seenSections = new Set();
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((link) => link.classList.toggle("is-active", link.getAttribute("href") === "#" + entry.target.id));
          if (!seenSections.has(entry.target.id)) {
            seenSections.add(entry.target.id);
            track("vital", { label: "case_section_view", target: entry.target.dataset.section });
          }
        });
      }, { rootMargin: "-35% 0px -45% 0px", threshold: 0.01 });
      document.querySelectorAll(".story-panel, .roster-strip, .artifact-grid, .agent-deep-dive, .facts").forEach((panel) => observer.observe(panel));
      const depthMarks = [25, 50, 75, 95];
      const sentDepth = new Set();
      function onScroll() {
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const ratio = window.scrollY / max;
        root.style.setProperty("--tower-shift", (ratio * 52).toFixed(2) + "px");
        updateAgentRail();
        const depth = Math.round(ratio * 100);
        depthMarks.forEach((mark) => {
          if (depth >= mark && !sentDepth.has(mark)) {
            sentDepth.add(mark);
            track("vital", { label: "case_scroll_depth", target: mark + "%" });
          }
        });
      }
      window.addEventListener("scroll", onScroll, { passive: true });
      [15, 45, 90].forEach((seconds) => window.setTimeout(() => track("vital", { label: "case_time", target: seconds + "s" }), seconds * 1000));
      track("pageview", { label: "case_study" });
      loadFeedback();
      onScroll();
    </script>
  </body>
</html>`;
}
function pageFor(item) {
  if (item.slug === "stewartos") return agenticosPageFor(item);
  let html = template;
  html = html.replace(/    <meta charset="utf-8" \/>[\s\S]*?    <link rel="canonical" href="https:\/\/quanbuilds\.netlify\.app\/case-studies\/" \/>/, headFor(item));
  html = html.replace(/<p class="eyebrow" id="caseKicker">[\s\S]*?<\/p>/, `<p class="eyebrow" id="caseKicker">${esc(item.kicker)}</p>`);
  html = html.replace(/<h1 id="caseTitle">[\s\S]*?<\/h1>/, `<h1 id="caseTitle">${esc(item.title)}</h1>`);
  html = html.replace(/<p class="deck" id="caseDeck">[\s\S]*?<\/p>/, `<p class="deck" id="caseDeck">${esc(item.deck)}</p>`);
  html = html.replace(/<strong id="caseCategory">[\s\S]*?<\/strong>/, `<strong id="caseCategory">${esc(item.category)}</strong>`);
  html = html.replace(/<strong id="caseStatus">[\s\S]*?<\/strong>/, `<strong id="caseStatus">${esc(item.status)}</strong>`);
  html = html.replace(/<strong id="caseEdited">[\s\S]*?<\/strong>/, `<strong id="caseEdited">${esc(item.lastEdited)}</strong>`);
  html = html.replace(/<strong id="caseBusiness">[\s\S]*?<\/strong>/, `<strong id="caseBusiness">${esc(item.businessModel)}</strong>`);
  html = html.replace(/<div class="meta-row" id="externalRow">[\s\S]*?<\/div><\/div>/, externalLinksFor(item));
  html = html.replace(/<div class="jumptrack" id="jumptrack"><\/div>/, `<div class="jumptrack" id="jumptrack">${linksFor(item)}</div>`);
  html = html.replace(/<section class="slides" id="slides" aria-label="Scrollytelling case study"><\/section>/, `<section class="slides" id="slides" aria-label="Scrollytelling case study">
        ${slidesFor(item)}
      </section>`);
  html = html.replace(/<p id="caseGoal">[\s\S]*?<\/p>/, `<p id="caseGoal">${esc(item.goal)}</p>`);
  html = html.replace(/<p id="caseApproach">[\s\S]*?<\/p>/, `<p id="caseApproach">${esc(item.approach)}</p>`);
  html = html.replace(/<p id="caseOutcome">[\s\S]*?<\/p>/, `<p id="caseOutcome">${esc(item.outcome)}</p>`);
  html = html.replace(/<ul class="source-list" id="caseUnknowns">[\s\S]*?<\/ul>/, `<ul class="source-list" id="caseUnknowns">${liList(item.unknowns)}</ul>`);
  html = html.replace(/<ul class="source-list" id="caseSources">[\s\S]*?<\/ul>/, `<ul class="source-list" id="caseSources">${liList(item.sources)}</ul>`);
  return html;
}

for (const item of cases) {
  const dir = path.join(root, "case-studies", item.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), pageFor(item));
}

// sitemap
const today = new Date().toISOString().slice(0,10);
const urls = [
  ["https://quanbuilds.netlify.app/", "1.0"],
  ["https://quanbuilds.netlify.app/signallabs/", "0.7"],
  ...cases.map(item => [`https://quanbuilds.netlify.app/case-studies/${item.slug}/`, "0.8"]),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([loc,priority]) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`).join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(root, "sitemap.xml"), sitemap);

// branded 404
fs.writeFileSync(path.join(root, "404.html"), `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Page Not Found | QuanBuilds</title>
    <meta name="robots" content="noindex,follow" />
    <link rel="canonical" href="https://quanbuilds.netlify.app/404.html" />
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <style>
      :root { color-scheme: light; --bg:#f7f5ef; --fg:#080808; --muted:rgba(8,8,8,.62); --line:rgba(8,8,8,.24); --gold:#a77a24; }
      * { box-sizing: border-box; }
      body { margin:0; min-height:100svh; display:grid; place-items:center; padding:32px; background:var(--bg); color:var(--fg); font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
      main { max-width:820px; display:grid; gap:24px; text-align:center; }
      h1 { margin:0; font-family:"Bodoni 72","Didot","Baskerville",Georgia,serif; font-size:clamp(56px,13vw,150px); line-height:.86; letter-spacing:.04em; text-transform:uppercase; font-weight:500; }
      p { margin:0 auto; max-width:54ch; color:var(--muted); font-size:clamp(17px,2vw,23px); }
      nav { display:flex; flex-wrap:wrap; justify-content:center; gap:12px; }
      a { color:inherit; text-decoration:none; border:1px solid var(--line); border-radius:999px; padding:11px 15px; font-size:12px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; }
      a:hover { color:var(--gold); border-color:var(--gold); }
    </style>
  </head>
  <body>
    <main>
      <p>404 / Nothing useful lives at this URL.</p>
      <h1>Lost Signal.</h1>
      <p>Head back to the work, jump to contact, or open the SignalLabs page.</p>
      <nav aria-label="Recovery links">
        <a href="/#work">Work</a>
        <a href="/#contact">Contact</a>
        <a href="/signallabs/">SignalLabs</a>
      </nav>
    </main>
  </body>
</html>
`);

console.log(`generated ${cases.length} case-study pages + sitemap + 404`);
