// Sun and Moon calculations that run in the browser, no network needed.
// Sunrise/sunset: NOAA solar position algorithm (about 1 to 2 minutes). Moon phases: Meeus, Astronomical Algorithms ch. 49 (about 1 minute).
const Astro = (() => {
  const R = Math.PI / 180, D = 180 / Math.PI;
  const sin = x => Math.sin(x * R), cos = x => Math.cos(x * R), tan = x => Math.tan(x * R);
  const CITIES = [
    ["New Delhi", 28.6139, 77.209, "Asia/Kolkata"], ["Mumbai", 19.076, 72.8777, "Asia/Kolkata"], ["Bengaluru", 12.9716, 77.5946, "Asia/Kolkata"],
    ["Chennai", 13.0827, 80.2707, "Asia/Kolkata"], ["Kolkata", 22.5726, 88.3639, "Asia/Kolkata"], ["Hyderabad", 17.385, 78.4867, "Asia/Kolkata"],
    ["Pune", 18.5204, 73.8567, "Asia/Kolkata"], ["Ahmedabad", 23.0225, 72.5714, "Asia/Kolkata"], ["Jaipur", 26.9124, 75.7873, "Asia/Kolkata"],
    ["Lucknow", 26.8467, 80.9462, "Asia/Kolkata"], ["Chandigarh", 30.7333, 76.7794, "Asia/Kolkata"], ["Amritsar", 31.634, 74.8723, "Asia/Kolkata"],
    ["Patna", 25.5941, 85.1376, "Asia/Kolkata"], ["Bhopal", 23.2599, 77.4126, "Asia/Kolkata"], ["Varanasi", 25.3176, 82.9739, "Asia/Kolkata"],
    ["Guwahati", 26.1445, 91.7362, "Asia/Kolkata"], ["Kochi", 9.9312, 76.2673, "Asia/Kolkata"], ["Thiruvananthapuram", 8.5241, 76.9366, "Asia/Kolkata"],
    ["Colombo", 6.9271, 79.8612, "Asia/Colombo"], ["Kathmandu", 27.7172, 85.324, "Asia/Kathmandu"], ["Dhaka", 23.8103, 90.4125, "Asia/Dhaka"],
    ["Karachi", 24.8607, 67.0011, "Asia/Karachi"], ["Lahore", 31.5204, 74.3587, "Asia/Karachi"], ["Dubai", 25.2048, 55.2708, "Asia/Dubai"],
    ["Doha", 25.2854, 51.531, "Asia/Qatar"], ["Riyadh", 24.7136, 46.6753, "Asia/Riyadh"], ["Jerusalem", 31.7683, 35.2137, "Asia/Jerusalem"],
    ["Singapore", 1.3521, 103.8198, "Asia/Singapore"], ["Kuala Lumpur", 3.139, 101.6869, "Asia/Kuala_Lumpur"], ["Bangkok", 13.7563, 100.5018, "Asia/Bangkok"],
    ["London", 51.5072, -0.1276, "Europe/London"], ["New York", 40.7128, -74.006, "America/New_York"], ["Toronto", 43.6532, -79.3832, "America/Toronto"],
    ["Chicago", 41.8781, -87.6298, "America/Chicago"], ["Los Angeles", 34.0522, -118.2437, "America/Los_Angeles"], ["Sydney", -33.8688, 151.2093, "Australia/Sydney"],
    ["Melbourne", -37.8136, 144.9631, "Australia/Melbourne"], ["Auckland", -36.8485, 174.7633, "Pacific/Auckland"], ["Nairobi", -1.2921, 36.8219, "Africa/Nairobi"],
    ["Johannesburg", -26.2041, 28.0473, "Africa/Johannesburg"]].map(([name, lat, lon, tz]) => ({name, lat, lon, tz}));

  function sunPos(jd) {
    const t = (jd - 2451545) / 36525;
    const l0 = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360;
    const m = 357.52911 + t * (35999.05029 - 0.0001537 * t);
    const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
    const c = sin(m) * (1.914602 - t * (0.004817 + 0.000014 * t)) + sin(2 * m) * (0.019993 - 0.000101 * t) + sin(3 * m) * 0.000289;
    const om = 125.04 - 1934.136 * t, lam = l0 + c - 0.00569 - 0.00478 * sin(om);
    const e0 = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60, eps = e0 + 0.00256 * cos(om);
    const dec = Math.asin(sin(eps) * sin(lam)) * D, y = tan(eps / 2) ** 2;
    const eq = 4 * D * (y * sin(2 * l0) - 2 * e * sin(m) + 4 * e * y * sin(m) * cos(2 * l0) - 0.5 * y * y * sin(4 * l0) - 1.25 * e * e * sin(2 * m));
    return {dec, eq};
  }
  function riseSet(jd, lat, lon, rise) {
    const {dec, eq} = sunPos(jd), cosH = cos(90.833) / (cos(lat) * cos(dec)) - tan(lat) * tan(dec);
    if (cosH > 1 || cosH < -1) return null;               // sun never rises or never sets
    const ha = Math.acos(cosH) * D;
    return 720 - 4 * (lon + (rise ? ha : -ha)) - eq;      // minutes after 0h UT
  }
  // y, m (1-12), d = the calendar date at the place. Returns {rise, set} as Dates, or nulls in polar day/night.
  function sunTimes(y, m, d, lat, lon) {
    const day0 = Date.UTC(y, m - 1, d), base = day0 / 86400000 + 2440587.5, out = {rise: null, set: null};
    for (const rise of [true, false]) {
      let mins = riseSet(base + 0.5 - lon / 360, lat, lon, rise);
      if (mins === null) return out;
      mins = riseSet(base + mins / 1440, lat, lon, rise);
      if (mins === null) return out;
      out[rise ? "rise" : "set"] = new Date(day0 + mins * 60000);
    }
    return out;
  }

  // Meeus ch. 49. k integer = new moon, k + 0.5 = full moon. Returns a Date (UT).
  const TERMS = [ // [new, full, E power, M, M', F]
    [-0.4072, -0.40614, 0, 0, 1, 0], [0.17241, 0.17302, 1, 1, 0, 0], [0.01608, 0.01614, 0, 0, 2, 0], [0.01039, 0.01043, 0, 0, 0, 2],
    [0.00739, 0.00734, 1, -1, 1, 0], [-0.00514, -0.00515, 1, 1, 1, 0], [0.00208, 0.00209, 2, 2, 0, 0], [-0.00111, -0.00111, 0, 0, 1, -2],
    [-0.00057, -0.00057, 0, 0, 1, 2], [0.00056, 0.00056, 1, 1, 2, 0], [-0.00042, -0.00042, 0, 0, 3, 0], [0.00042, 0.00042, 1, 1, 0, 2],
    [0.00038, 0.00038, 1, -1, 0, -2], [-0.00024, -0.00024, 1, -1, 2, 0], [-0.00007, -0.00007, 0, 2, 1, 0], [0.00004, 0.00004, 0, 0, 2, -2],
    [0.00004, 0.00004, 0, 3, 0, 0], [0.00003, 0.00003, 0, 1, 1, -2], [0.00003, 0.00003, 0, 0, 2, 2], [-0.00003, -0.00003, 0, 1, 1, 2],
    [0.00003, 0.00003, 0, -1, 1, 2], [-0.00002, -0.00002, 0, -1, 1, -2], [-0.00002, -0.00002, 0, 1, 3, 0], [0.00002, 0.00002, 0, 0, 4, 0]];
  function phaseDate(k) {
    const T = k / 1236.85, T2 = T * T, T3 = T2 * T, T4 = T3 * T, full = Math.abs(k % 1) > 0.25;
    let jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T2 - 0.00000015 * T3 + 0.00000000073 * T4;
    const E = 1 - 0.002516 * T - 0.0000074 * T2;
    const M = 2.5534 + 29.1053567 * k - 0.0000014 * T2 - 0.00000011 * T3;
    const Mp = 201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4;
    const F = 160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4;
    const Om = 124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3;
    for (const [n, f, ep, a, b, c] of TERMS) jde += (full ? f : n) * E ** ep * sin(a * M + b * Mp + c * F);
    jde += (full ? -0.00017 : -0.00017) * sin(Om);
    return new Date((jde - 2440587.5) * 86400000 - 69.2 * 1000);   // TT to UT (delta-T about 69 s in 2026)
  }
  const kFor = date => Math.floor((date.getUTCFullYear() + (date.getUTCMonth() + 0.5) / 12 - 2000) * 12.3685);
  function phasesAround(date) {
    const out = []; for (let k = kFor(date) - 2; k <= kFor(date) + 4; k += 0.5) out.push({k, full: Math.abs(k % 1) > 0.25, at: phaseDate(k)}); return out;
  }
  function nextPhase(date, kind) { return phasesAround(date).find(p => p.at > date && p.full === (kind === "full")).at; }
  const NAMES = [[0.03, "New moon", "🌑"], [0.22, "Waxing crescent", "🌒"], [0.28, "First quarter", "🌓"], [0.47, "Waxing gibbous", "🌔"], [0.53, "Full moon", "🌕"], [0.72, "Waning gibbous", "🌖"], [0.78, "Last quarter", "🌗"], [0.97, "Waning crescent", "🌘"], [1.01, "New moon", "🌑"]];
  function moonInfo(date) {
    const ph = phasesAround(date), prevNew = [...ph].reverse().find(p => !p.full && p.at <= date), fullAfter = ph.find(p => p.full && p.at > prevNew.at);
    let frac;                                   // 0 = new, 0.5 = full, back to 1 = new
    if (date < fullAfter.at) frac = 0.5 * (date - prevNew.at) / (fullAfter.at - prevNew.at);
    else { const nextNew = ph.find(p => !p.full && p.at > fullAfter.at); frac = 0.5 + 0.5 * (date - fullAfter.at) / (nextNew.at - fullAfter.at); }
    const [, name, icon] = NAMES.find(n => frac < n[0]);
    return {frac, name, icon, lit: Math.round((1 - Math.cos(2 * Math.PI * frac)) / 2 * 20) * 5, nextFull: nextPhase(date, "full"), nextNew: nextPhase(date, "new")};
  }
  const fmtTime = (date, tz) => date ? new Intl.DateTimeFormat(undefined, {hour: "numeric", minute: "2-digit", timeZone: tz}).format(date) : "–";
  const hm = ms => Math.floor(ms / 3600000) + "h " + String(Math.round(ms % 3600000 / 60000)).padStart(2, "0") + "m";
  return {CITIES, sunTimes, nextPhase, moonInfo, phaseDate, fmtTime, hm};
})();
if (typeof module !== "undefined") module.exports = Astro;
