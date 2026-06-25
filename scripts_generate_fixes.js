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
function liList(values) { return (values || []).map(v => `<li>${esc(v)}</li>`).join("\\n"); }
function externalLinksFor(item) {
  const links = item.externalLinks || [];
  if (!links.length) return `<div class="meta-row" id="externalRow" hidden><span class="meta-label">External Links</span><div class="external-links" id="caseExternalLinks"></div></div>`;
  return `<div class="meta-row" id="externalRow"><span class="meta-label">External Links</span><div class="external-links" id="caseExternalLinks">${links.map(link => `<a href="${attr(link.url)}" rel="noopener">${esc(link.label)}</a>`).join("")}</div></div>`;
}
function slidesFor(item) {
  const hasImages = item.images && item.images.length;
  return (item.sections || []).map((section, i) => {
    const img = hasImages ? item.images[i % item.images.length] : "";
    const id = `section-${i+1}`;
    return `<article class="${hasImages ? "slide" : "slide has-no-media"}" id="${id}" data-section="${attr(section[0])}">
          ${hasImages ? `<div class="slide-visual">
            <figure>
              <div class="image-frame" tabindex="0" role="button" aria-label="Animate ${attr(section[0])} visual">
                <img src="${attr(img)}" alt="${attr(item.title)} visual ${i+1}" loading="${i === 0 ? "eager" : "lazy"}" />
              </div>
              <figcaption class="image-caption">${esc(item.label)} / ${esc(section[0])}</figcaption>
            </figure>
          </div>` : ""}
          <div class="slide-copy">
            <p class="eyebrow">${String(i+1).padStart(2, "0")} / ${esc(item.category)}</p>
            <h2>${esc(section[0])}</h2>
            <p>${esc(section[1])}</p>
          </div>
        </article>`;
  }).join("\n");
}
function linksFor(item) { return (item.sections || []).map((section,i)=>`<a href="#section-${i+1}">${esc(section[0])}</a>`).join("\n"); }
function pageFor(item) {
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
