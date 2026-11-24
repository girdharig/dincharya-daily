const CFG = window.APP_CONFIG || {};
const COLORS = {hindu:"#D9731F",christian:"#3C6FD1",muslim:"#1E8E5A",buddhist:"#B8860B",jewish:"#6B53C9",sikh:"#C23B6B"};
const NAMES = {hindu:"Hindu",christian:"Christian",muslim:"Muslim",buddhist:"Buddhist",jewish:"Jewish",sikh:"Sikh"};
const TYPES = {festival:"Festival",fast:"Fast",ritual:"Ritual",spiritual:"Spiritual practice"};
const KEY = CFG.SUPABASE_ANON_KEY;
// ---- languages ----
// Add a language: add it to LANGS, add a dictionary below (English string -> translation), and add translated
// event/story rows in the database (event_translations / story_translations). Missing entries fall back to English.
const LANGS = {en: "English", hi: "हिन्दी"};
let LANG = "en";
try { LANG = localStorage.getItem("dina_lang") || (navigator.language || "en").slice(0, 2); } catch (e) {}
if (!LANGS[LANG]) LANG = "en";
document.documentElement.lang = LANG;
const I18N = {hi: {
  "Today": "आज", "Calendar": "कैलेंडर", "Upcoming": "आगामी", "Subscribe": "सदस्यता लें", "Subscribe free": "मुफ़्त सदस्यता लें",
  "Continue": "आगे बढ़ें", "Your day, in your tradition": "आपका दिन, आपकी परंपरा में",
  "Choose the traditions you follow. You can pick more than one and change them any time.": "अपनी परंपराएँ चुनें। आप एक से अधिक चुन सकते हैं और कभी भी बदल सकते हैं।",
  "Festivals, fasts and practice": "त्योहार, व्रत और साधना", "Story for today": "आज की कथा", "Coming up this week": "इस सप्ताह आने वाले",
  "See the full calendar": "पूरा कैलेंडर देखें", "Get this every morning": "यह हर सुबह पाएँ", "Change traditions": "परंपराएँ बदलें",
  "Nothing listed for today.": "आज के लिए कुछ सूचीबद्ध नहीं है।", "Nothing listed for this day.": "इस दिन के लिए कुछ सूचीबद्ध नहीं है।",
  "Loading…": "लोड हो रहा है…", "Share": "साझा करें", "Add to calendar": "कैलेंडर में जोड़ें", "Email": "ईमेल",
  "Also send a short message on WhatsApp": "व्हाट्सऐप पर भी एक छोटा संदेश भेजें", "Get your day every morning": "हर सुबह अपना दिन पाएँ",
  "All": "सभी", "Festivals": "त्योहार", "Fasts": "व्रत", "Rituals": "अनुष्ठान", "The next 90 days.": "अगले 90 दिन।",
  "Install app": "ऐप इंस्टॉल करें", "Picture": "चित्र", "Why it matters": "यह क्यों महत्वपूर्ण है", "What it teaches: ": "यह क्या सिखाती है: ", "Add Dincharya to your home screen": "दिनचर्या को अपनी होम स्क्रीन पर जोड़ें",
  "Opens like an app and works offline.": "ऐप की तरह खुलता है और ऑफ़लाइन भी चलता है।",
  "Dots show festivals and fasts. Daily practices are on the Today tab.": "बिंदु त्योहार और व्रत दर्शाते हैं। दैनिक साधनाएँ ‘आज’ टैब में हैं।",
  "Festival": "त्योहार", "Fast": "व्रत", "Ritual": "अनुष्ठान", "Spiritual practice": "आध्यात्मिक साधना",
  "Hindu": "हिन्दू", "Christian": "ईसाई", "Muslim": "मुस्लिम", "Buddhist": "बौद्ध", "Jewish": "यहूदी", "Sikh": "सिख",
  "Calendar ": "कैलेंडर", "‹ Prev": "‹ पिछला", "Next ›": "अगला ›",
  "A free email with today's festivals, fasts, practice and story. Add WhatsApp if you'd like a short message with a link too.": "आज के त्योहार, व्रत, साधना और कथा वाला मुफ़्त ईमेल। चाहें तो छोटे संदेश और लिंक के लिए व्हाट्सऐप भी जोड़ें।"
}};
// Tradition names follow the language.
if (LANG === "hi") Object.assign(NAMES, {hindu: tr("Hindu"), christian: tr("Christian"), muslim: tr("Muslim"), buddhist: tr("Buddhist"), jewish: tr("Jewish"), sikh: tr("Sikh")});
if (LANG === "hi") Object.assign(TYPES, {festival: tr("Festival"), fast: tr("Fast"), ritual: tr("Ritual"), spiritual: tr("Spiritual practice")});

const configured = () => CFG.SUPABASE_URL && !CFG.SUPABASE_URL.includes("YOUR_PROJECT_REF");

async function rpc(name, args) {
  const r = await fetch(`${CFG.SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST", headers: {apikey: KEY, "Content-Type": "application/json"}, body: JSON.stringify(args)});
  if (!r.ok) throw new Error("Request failed (" + r.status + ")");
  return r.json();
}
// Calls an Edge Function. Always resolves to {ok, message, ...}.
async function fn(name, body) {
  try {
    const r = await fetch(`${CFG.FUNCTIONS_URL}/${name}`, {
      method: "POST", headers: {apikey: KEY, "Content-Type": "application/json"}, body: JSON.stringify(body)});
    let j = {}; try { j = await r.json(); } catch {}
    return {...j, ok: r.ok && j.ok !== false, message: j.message || (r.ok ? "Done." : "Something went wrong. Try again.")};
  } catch { return {ok: false, message: "Can't reach the server. Check your connection and try again."}; }
}
function tr(s) { return (I18N[LANG] && I18N[LANG][s]) || s; }
function el(t, a = {}, kids = []) {
  const e = document.createElement(t);
  for (const k in a) { if (a[k] == null) continue; if (k === "class") e.className = a[k]; else if (k === "text") e.textContent = tr(a[k]);
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), a[k]); else e.setAttribute(k, a[k]); }
  [].concat(kids).forEach(x => e.append(typeof x === "string" ? tr(x) : x)); return e;
}
const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const fmt = d => d.toLocaleDateString(undefined, {weekday: "long", month: "long", day: "numeric"});
const tzName = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
function chipPicker(selected, onChange) {
  const box = el("div", {class: "chips"});
  Object.keys(NAMES).forEach(k => {
    const b = el("button", {type: "button", class: "chip", style: "--cc:" + COLORS[k], "aria-pressed": String(selected.includes(k))}, [el("i"), NAMES[k]]);
    b.onclick = () => { const i = selected.indexOf(k); i < 0 ? selected.push(k) : selected.splice(i, 1);
      b.setAttribute("aria-pressed", String(selected.includes(k))); onChange && onChange(selected); };
    box.append(b);
  });
  return box;
}
const FONTS = '<link href="https://fonts.googleapis.com/css2?family=Newsreader:wght@400;600&family=Instrument+Sans:wght@400;500;600&display=swap" rel="stylesheet">';

// WhatsApp number verification (used on the confirm and preferences pages).
function waVerify(token, mount, masked, onDone) {
  mount.replaceChildren();
  const msg = el("p", {class: "msg", role: "status"});
  const code = el("input", {type: "text", id: "wacode", inputmode: "numeric", autocomplete: "one-time-code", maxlength: "6", placeholder: "6-digit code"});
  const send = el("button", {type: "button", class: "btn ghost", text: "Send code on WhatsApp"});
  const check = el("button", {type: "button", class: "btn", text: "Verify"});
  const show = (r) => { msg.className = "msg " + (r.ok ? "ok" : "bad"); msg.textContent = r.message; };
  send.onclick = async () => { send.disabled = true; show(await fn("whatsapp", {token, action: "send_code"})); setTimeout(() => send.disabled = false, 30000); };
  check.onclick = async () => {
    if (!/^\d{6}$/.test(code.value.trim())) return show({ok: false, message: "Enter the 6-digit code."});
    check.disabled = true; const r = await fn("whatsapp", {token, action: "verify", code: code.value.trim()}); check.disabled = false;
    if (r.ok) { mount.replaceChildren(el("p", {class: "msg ok", text: r.message})); onDone && onDone(); } else show(r);
  };
  mount.append(el("h2", {text: "Verify your WhatsApp"}), el("p", {class: "sub", text: "We'll send a 6-digit code to " + masked + "."}), send,
    el("label", {for: "wacode", text: "Code"}), code, check, msg);
}

// ---- data, sharing and calendar helpers ----
async function rest(path) {
  const r = await fetch(`${CFG.SUPABASE_URL}/rest/v1/${path}`, {headers: {apikey: KEY}});
  if (!r.ok) throw new Error("Request failed (" + r.status + ")");
  return r.json();
}
function downloadText(name, mime, content) {
  const a = el("a", {href: URL.createObjectURL(content instanceof Blob ? content : new Blob([content], {type: mime})), download: name});
  document.body.append(a); a.click(); a.remove();
}
function icsFor(title, text, date) {
  const d = date.replace(/-/g, ""), next = iso(new Date(new Date(date + "T00:00").getTime() + 864e5)).replace(/-/g, "");
  const esc = s => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Dincharya//EN", "BEGIN:VEVENT",
    "UID:" + d + "-" + title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "@dincharya", "DTSTAMP:" + stamp,
    "DTSTART;VALUE=DATE:" + d, "DTEND;VALUE=DATE:" + next, "SUMMARY:" + esc(title), "DESCRIPTION:" + esc(text + " " + location.origin + "/app"),
    "END:VEVENT", "END:VCALENDAR"].join("\r\n");
}
async function shareText(title, text) {
  const url = location.origin + "/app", msg = title + ": " + text;
  if (navigator.share) { try { await navigator.share({title, text: msg, url}); } catch (e) { /* cancelled */ } return; }
  window.open("https://wa.me/?text=" + encodeURIComponent(msg + " " + url), "_blank", "noopener");
}
// Word-wrap helper (pure, so it can be tested): `width` measures a string in pixels.
function wrapText(width, text, maxWidth, maxLines) {
  const words = String(text).split(/\s+/).filter(Boolean), lines = []; let cur = "";
  for (const w of words) {
    const next = cur ? cur + " " + w : w;
    if (width(next) <= maxWidth || !cur) cur = next; else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) { const keep = lines.slice(0, maxLines); let last = keep[maxLines - 1]; while (last && width(last + "…") > maxWidth) last = last.slice(0, -1); keep[maxLines - 1] = last.trimEnd() + "…"; return keep; }
  return lines;
}
// Draws a 1080x1350 picture card (artwork on top, words below) and shares or downloads it.
async function sharePicture(title, text, art) {
  try {
    const W = 1080, H = 1350, ART_H = 640, cv = document.createElement("canvas"); cv.width = W; cv.height = H; const g = cv.getContext("2d");
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    const svg = await (await fetch("img/" + (art || "hero") + ".svg")).text();
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej;
      i.src = URL.createObjectURL(new Blob([svg.replace("<svg ", '<svg width="1200" height="800" ')], {type: "image/svg+xml"})); });
    g.fillStyle = "#1E2340"; g.fillRect(0, 0, W, H);
    const s = Math.max(W / img.width, ART_H / img.height); g.drawImage(img, (W - img.width * s) / 2, (ART_H - img.height * s) / 2, img.width * s, img.height * s);
    const fade = g.createLinearGradient(0, ART_H - 160, 0, ART_H); fade.addColorStop(0, "rgba(30,35,64,0)"); fade.addColorStop(1, "#1E2340"); g.fillStyle = fade; g.fillRect(0, ART_H - 160, W, 160);
    g.fillStyle = "#fff"; g.font = "600 66px Newsreader, Georgia, serif"; g.textBaseline = "top";
    let y = ART_H + 10; wrapText(t => g.measureText(t).width, title, W - 140, 3).forEach(l => { g.fillText(l, 70, y); y += 78; });
    g.fillStyle = "#D5D9EE"; g.font = "400 36px 'Instrument Sans', system-ui, sans-serif"; y += 14;
    wrapText(t => g.measureText(t).width, text, W - 140, Math.max(2, Math.floor((H - 130 - y) / 50))).forEach(l => { g.fillText(l, 70, y); y += 50; });
    g.fillStyle = "#F2B94B"; g.font = "600 34px 'Instrument Sans', system-ui, sans-serif"; g.fillText("🪔 Dincharya  ·  www.dincharya.co.in", 70, H - 90);
    const blob = await new Promise(r => cv.toBlob(r, "image/png")), file = new File([blob], title.replace(/[^\w]+/g, "-").toLowerCase() + ".png", {type: "image/png"});
    if (navigator.canShare && navigator.canShare({files: [file]})) await navigator.share({files: [file], title});
    else downloadText.call(null, file.name, "image/png", blob);
  } catch (e) { if (e && e.name === "AbortError") return; shareText(title, text); }   // fall back to plain text sharing
}
// Small "Share", "Picture" and optional "Add to calendar" buttons for a card.
function cardActions(title, text, date, art) {
  const box = el("div", {class: "acts"}, [el("button", {type: "button", class: "linkbtn", text: "Share", "aria-label": "Share " + title, onclick: () => shareText(title, text)}),
    el("button", {type: "button", class: "linkbtn", text: "Picture", "aria-label": "Share " + title + " as a picture", onclick: () => sharePicture(title, text, art)})]);
  if (date) box.append(el("button", {type: "button", class: "linkbtn", text: "Add to calendar", "aria-label": "Add " + title + " to calendar", onclick: () => downloadText(title.replace(/[^\w]+/g, "-") + ".ics", "text/calendar", icsFor(title, text, date))}));
  return box;
}
