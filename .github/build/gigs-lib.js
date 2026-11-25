// Shared by make_ics.js and make_seo.js: loads js/config.js and reads gig times
// with the same rules as js/main.js parseGigTime.
const fs = require("fs");
const path = require("path");
const root = process.env.SITE_ROOT || path.join(__dirname, "..");
const window = {};
new Function("window", fs.readFileSync(path.join(root, "js/config.js"), "utf8"))(window);
const C = window.STM;
// Shows from the Google Sheet (js/gigs-data.js, written by sync_gigs.js) when a Sheet link is set.
const dataFile = path.join(root, "js/gigs-data.js");
if ((process.env.GIGS_CSV_URL || C.gigsCsvUrl) && fs.existsSync(dataFile)) {
  new Function("window", fs.readFileSync(dataFile, "utf8"))(window);
}
const SOURCE = window.STM_SHEET && window.STM_SHEET.gigs ? window.STM_SHEET.gigs : C.gigs || [];

const pad2 = (n) => (n < 10 ? "0" : "") + n;
function parseGigTime(g) {
  const AP = "(?:([ap])\\.?\\s*m\\.?)?";
  const m = new RegExp("^\\D*?(\\d{1,2})(?::(\\d{2}))?\\s*" + AP + "(?:\\s*(?:-|\\u2013|to)\\s*(\\d{1,2})(?::(\\d{2}))?\\s*" + AP + ")?", "i").exec(g.time || "");
  if (!m) return null;
  const sAp = m[3] || m[6];
  if (!sAp) return null;
  const at = (h, min, ap) => { const d = new Date(g.d); d.setHours((+h % 12) + (/p/i.test(ap) ? 12 : 0), +(min || 0), 0, 0); return d; };
  const s = at(m[1], m[2], sAp);
  let e;
  if (m[4]) { e = at(m[4], m[5], m[6] || m[3]); if (e <= s) e.setDate(e.getDate() + 1); }
  else e = new Date(s.getTime() + 3 * 3600 * 1000);
  return { start: s, end: e };
}
// Gigs with a real date, each with g.d (local midnight) and g.tm (start/end or null).
function gigs() {
  return SOURCE.filter((g) => /^\d{4}-\d{2}-\d{2}$/.test(g.date || "")).map((g) => {
    const [y, mo, da] = g.date.split("-").map(Number);
    const out = Object.assign({}, g, { d: new Date(y, mo - 1, da) });
    out.tm = parseGigTime(out);
    return out;
  });
}
module.exports = { C, root, pad2, gigs };
