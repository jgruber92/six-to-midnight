// Builds one real .ics file per gig in js/config.js into cal/YYYY-MM-DD.ics.
// Why: phones (iPhone Safari, Instagram/Facebook in-app browsers) block "data:" calendar links,
// but they open a hosted .ics file with the "Add to Calendar" sheet.
// publish.sh runs this automatically. Run by hand: node scripts/make_ics.js
const fs = require("fs");
const path = require("path");
const { C, root, pad2, gigs } = require("./gigs-lib");
const IG = (C.socials || {}).instagram || "";
const ymd = (d) => d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate());
const stamp = (d) => ymd(d) + "T" + pad2(d.getHours()) + pad2(d.getMinutes()) + "00";
const norm = (s) => String(s || "").toLowerCase().replace(/&/g, " and ").replace(/['\u2019]/g, "").replace(/[^a-z0-9]+/g, " ").trim()
  .split(" ").filter((w) => w && w !== "by").map((w) => w.replace(/ing$/, "in")).join(" ");
const timeShown = (g) => String(g.time || "").replace(/(\d)\s*(?:-|\u2013)\s*(\d)/, "$1 to $2");

function foldIcs(line) {
  const out = []; let cur = "", n = 0;
  Array.from(line).forEach((ch) => {
    const b = Buffer.byteLength(ch);
    if (n + b > 75) { out.push(cur); cur = " "; n = 1; }
    cur += ch; n += b;
  });
  out.push(cur);
  return out.join("\r\n");
}
const icsEsc = (s) => String(s || "").replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");

const dir = path.join(root, "cal");
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir);
const now = new Date();
const utc = now.getUTCFullYear() + pad2(now.getUTCMonth() + 1) + pad2(now.getUTCDate()) + "T" + pad2(now.getUTCHours()) + pad2(now.getUTCMinutes()) + "00Z";
const shows = C.siteUrl ? C.siteUrl.replace(/\/?$/, "/") + "shows/" : "";
let count = 0;
gigs().forEach((g) => {
  const tm = g.tm;
  let when;
  if (tm) when = ["DTSTART:" + stamp(tm.start), "DTEND:" + stamp(tm.end)];
  else { const e = new Date(g.d); e.setDate(e.getDate() + 1); when = ["DTSTART;VALUE=DATE:" + ymd(g.d), "DTEND;VALUE=DATE:" + ymd(e)]; }
  const details = "90s and 2000s rock" + (tm ? ", " + timeShown(g) + "." : ". Time TBA, check for updates.") + (shows ? " Shows: " + shows : "") + (IG ? " Instagram: " + IG : "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Six to Midnight//Site//EN", "METHOD:PUBLISH", "BEGIN:VEVENT",
    "UID:stm-" + ymd(g.d) + "-" + norm(g.venue).replace(/ /g, "-") + "@six-to-midnight", "DTSTAMP:" + utc, ...when,
    "SUMMARY:" + icsEsc("Six to Midnight live at " + g.venue), "LOCATION:" + icsEsc(g.venue + ", " + g.town),
    "DESCRIPTION:" + icsEsc(details), "END:VEVENT", "END:VCALENDAR"];
  fs.writeFileSync(path.join(dir, g.date + ".ics"), lines.map(foldIcs).join("\r\n") + "\r\n");
  count++;
});
console.log("Calendar files: " + count + " in cal/");
