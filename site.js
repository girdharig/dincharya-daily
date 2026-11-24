// Display settings (text size, theme) are applied right away, before the page is drawn.
function applyDisplay() {
  try {
    const t = localStorage.getItem("dina_theme"), z = localStorage.getItem("dina_fs");
    if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t); else document.documentElement.removeAttribute("data-theme");
    document.documentElement.style.fontSize = ["115", "130"].includes(z) ? z + "%" : "";
  } catch (e) { /* settings are optional */ }
}
applyDisplay();
// Shared header, footer and call-to-action band for every page.
const SITE = {
  name: "Dincharya",
  contactEmail: "" // <- put your support email here; it appears in the footer and Privacy page when set
};
const MARK = `<svg viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="22" fill="#1E2340"/>
<circle cx="86" cy="50" r="6" fill="#D9731F"/><circle cx="68" cy="81.2" r="6" fill="#3C6FD1"/><circle cx="32" cy="81.2" r="6" fill="#1E8E5A"/>
<circle cx="14" cy="50" r="6" fill="#B8860B"/><circle cx="32" cy="18.8" r="6" fill="#6B53C9"/><circle cx="68" cy="18.8" r="6" fill="#C23B6B"/>
<path d="M50 33C44 42 39 47 39 55a11 11 0 0 0 22 0C61 47 56 42 50 33Z" fill="#F2B94B"/>
<path d="M50 47C47 52 45 55 45 58.5a5 5 0 0 0 10 0C55 55 53 52 50 47Z" fill="#FFF1C9"/></svg>`;
(function () {
  const d = document.body.dataset, page = d.page || "";
  if (d.chrome === "off") return;
  const link = (href, text, key, cls) => `<a href="${href}"${cls ? ` class="${cls}"` : ""}${key === page ? ' aria-current="page"' : ""}>${text}</a>`;
  const head = document.createElement("header");
  head.className = "top";
  head.innerHTML = `<div class="in"><a class="brand" href="/" aria-label="Dincharya home">${MARK}<span>Dincharya</span></a>
    <nav class="links" aria-label="Main">${link("/about", "About", "about")}${link("/traditions", "Traditions", "traditions")}${link("/stories", "Stories", "stories")}${link("/healthy", "Healthy Living", "healthy")}${link("/faq", "FAQ", "faq")}${link("/feedback", "Feedback", "feedback")}${link("/app?view=sub", tr("Subscribe"), "sub", "pill")}<select id="lang" aria-label="Language" style="width:auto;padding:5px 8px;border-radius:8px">${Object.entries(LANGS).map(([k, n]) => `<option value="${k}"${k === LANG ? " selected" : ""}>${n}</option>`).join("")}</select></nav></div>`;
  head.querySelector("#lang").onchange = e => { try { localStorage.setItem("dina_lang", e.target.value); } catch (x) {} location.reload(); };
  const aa = document.createElement("button"); aa.className = "aa"; aa.type = "button"; aa.textContent = "Aa"; aa.setAttribute("aria-label", "Display settings"); aa.setAttribute("aria-expanded", "false");
  const panel = document.createElement("div"); panel.className = "aa-panel"; panel.hidden = true; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "Display settings");
  panel.innerHTML = '<p><b>Text size</b></p><div class="aa-row" data-k="dina_fs"><button type="button" data-v="100">Normal</button><button type="button" data-v="115">Large</button><button type="button" data-v="130">Extra large</button></div><p><b>Theme</b></p><div class="aa-row" data-k="dina_theme"><button type="button" data-v="auto">Auto</button><button type="button" data-v="light">Light</button><button type="button" data-v="dark">Dark</button></div>';
  const mark = () => panel.querySelectorAll("button").forEach(b => { let cur = "auto"; try { cur = localStorage.getItem(b.parentElement.dataset.k) || (b.parentElement.dataset.k === "dina_fs" ? "100" : "auto"); } catch (x) {} b.setAttribute("aria-pressed", String(cur === b.dataset.v)); });
  panel.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; try { localStorage.setItem(b.parentElement.dataset.k, b.dataset.v); } catch (x) {} applyDisplay(); mark(); });
  aa.addEventListener("click", () => { panel.hidden = !panel.hidden; aa.setAttribute("aria-expanded", String(!panel.hidden)); mark(); });
  head.querySelector(".in").append(aa); head.append(panel);
  document.body.prepend(head);
  if (d.cta !== "off") {
    const band = document.createElement("section");
    band.className = "band";
    band.innerHTML = `<h2>Start tomorrow knowing what it means</h2>
      <p>Free daily email, and an optional short WhatsApp message with a link to the app. Pick your traditions and your time. Stop any time.</p>
      <div class="row" style="justify-content:center"><a class="btn" href="/app?view=sub">Subscribe free</a><a class="btn ghost" href="/app">See today</a></div>`;
    document.body.append(band);
  }
  if (d.footer !== "off") {
    const f = document.createElement("footer");
    f.className = "site";
    f.innerHTML = `<p>${link("/about", "About", "about")}${link("/traditions", "Traditions", "traditions")}${link("/stories", "Stories", "stories")}${link("/healthy", "Healthy Living", "healthy")}${link("/mindful", "Mindful", "mindful")}${link("/faq", "FAQ", "faq")}${link("/feedback", "Feedback", "feedback")}${link("/privacy", "Privacy", "privacy")}${SITE.contactEmail ? `<a href="mailto:${SITE.contactEmail}">${SITE.contactEmail}</a>` : ""}</p>
      <p>Dates for lunar festivals can differ by region and community. When in doubt, follow your own community's calendar.</p>`;
    document.body.append(f);
  }
})();

// Privacy-friendly page counter: no cookies, no IP stored, respects Do Not Track.
(function () {
  try {
    const c = window.APP_CONFIG;
    if (!c || !c.FUNCTIONS_URL || navigator.doNotTrack === "1" || navigator.globalPrivacyControl) return;
    if (/^\/(admin|confirm|unsubscribe|preferences)/.test(location.pathname)) return;
    const body = JSON.stringify({path: location.pathname, ref: document.referrer, tz: Intl.DateTimeFormat().resolvedOptions().timeZone});
    const url = c.FUNCTIONS_URL + "/track";
    if (navigator.sendBeacon) navigator.sendBeacon(url, new Blob([body], {type: "text/plain"}));
    else fetch(url, {method: "POST", body, keepalive: true, headers: {"Content-Type": "text/plain"}});
  } catch (e) { /* never break the page */ }
})();

// Offline support and "install as app".
if ("serviceWorker" in navigator && !/^\/admin/.test(location.pathname)) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}
