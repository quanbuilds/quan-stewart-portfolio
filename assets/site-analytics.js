(() => {
  const endpoint = "/.netlify/functions/analytics";
  const startedAt = performance.now();
  let maxDepth = 0;
  let lastSection = "";
  let lastAttentionAt = 0;
  let exitSent = false;

  function projectSlug() {
    const match = location.pathname.match(/\/case-studies\/([^/]+)/);
    return match?.[1] || "";
  }

  function scrollDepth() {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    return Math.max(0, Math.min(100, Math.round((window.scrollY / max) * 100)));
  }

  function pointFromEvent(event) {
    return {
      x: Math.round(event.clientX),
      y: Math.round(event.clientY),
      percentX: Math.round((event.clientX / Math.max(1, window.innerWidth)) * 100),
      percentY: Math.round((event.clientY / Math.max(1, window.innerHeight)) * 100),
    };
  }

  function elementLabel(node) {
    const target = node?.closest?.("a, button, input, textarea, select, [role='button'], [role='link'], [data-case], .work-card, .slide, section, article");
    if (!target) return "";
    return (
      target.getAttribute("aria-label") ||
      target.dataset?.case ||
      target.dataset?.section ||
      target.id ||
      target.textContent?.trim()?.replace(/\s+/g, " ").slice(0, 120) ||
      target.tagName.toLowerCase()
    );
  }

  function payload(extra = {}) {
    return {
      project: projectSlug(),
      path: `${location.pathname}${location.search}${location.hash}`,
      title: document.title,
      referrer: document.referrer,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      connection: navigator.connection?.effectiveType || "",
      scrollDepth: maxDepth,
      durationMs: Math.round(performance.now() - startedAt),
      ...extra,
    };
  }

  function track(type, data = {}) {
    const body = JSON.stringify({ type, data: payload(data) });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([body], { type: "application/json" }));
      return;
    }
    fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }

  function updateDepth() {
    maxDepth = Math.max(maxDepth, scrollDepth());
  }

  function trackAttention(event) {
    const now = performance.now();
    if (now - lastAttentionAt < 2600) return;
    lastAttentionAt = now;
    updateDepth();
    const section = event.target?.closest?.("[data-section], section, article, .slide, header, footer");
    lastSection = elementLabel(section) || lastSection;
    track("attention", {
      label: "pointer_attention",
      section: lastSection,
      element: elementLabel(event.target),
      point: pointFromEvent(event),
    });
  }

  function trackExit(label = "page hidden") {
    if (exitSent) return;
    exitSent = true;
    updateDepth();
    track("exit", {
      label,
      section: lastSection,
      scrollDepth: maxDepth,
      durationMs: Math.round(performance.now() - startedAt),
    });
  }

  window.addEventListener("scroll", updateDepth, { passive: true });
  window.addEventListener("pointermove", trackAttention, { passive: true });
  document.addEventListener("click", (event) => {
    updateDepth();
    const target = event.target?.closest?.("a, button, [role='button'], [role='link'], [data-case], .work-card");
    track("click_map", {
      label: elementLabel(target || event.target) || "document click",
      element: elementLabel(event.target),
      target: target?.href || target?.getAttribute?.("href") || "",
      point: pointFromEvent(event),
    });
  }, { capture: true });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") trackExit("tab hidden");
  });
  window.addEventListener("pagehide", () => trackExit("pagehide"));
})();
