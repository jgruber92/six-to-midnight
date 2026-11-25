// Pulls show dates from the band's Google Sheet into js/gigs-data.js.
// That file is what the calendar files (make_ics.js) and Google's show listings (make_seo.js)
// are built from, and the site falls back to it if the live Sheet can't be reached.
//
// Runs at every publish (publish.sh) and every night on GitHub (.github/workflows/nightly-shows.yml).
// No Sheet link in js/config.js (gigsCsvUrl empty) = shows come from `gigs` in config, and this
// writes an empty placeholder.
// If the Sheet can't be reached, the last good copy is kept, so a Google hiccup never wipes the shows.
//
// Run by hand: node scripts/sync_gigs.js
// Test with another CSV: GIGS_CSV_URL=http://localhost:8767/test.csv node scripts/sync_gigs.js
const fs = require("fs");
const path = require("path");
const root = process.env.SITE_ROOT || path.join(__dirname, "..");
const window = {};
new Function("window", fs.readFileSync(path.join(root, "js/config.js"), "utf8"))(window);
const C = window.STM;
const { sheetToGigs } = require(path.join(root, "js/sheet-gigs.js"));
const out = path.join(root, "js/gigs-data.js");
const url = process.env.GIGS_CSV_URL || C.gigsCsvUrl || "";

const write = (data) => {
  const body = "// Built by scripts/sync_gigs.js from the band's Google Sheet. Don't edit by hand.\n" +
    "window.STM_SHEET = " + JSON.stringify(data, null, 1) + ";\n";
  const old = fs.existsSync(out) ? fs.readFileSync(out, "utf8") : "";
  // Ignore the timestamp when deciding if anything changed, so the nightly job only commits real changes.
  const strip = (s) => s.replace(/"synced": "[^"]*"/, "");
  if (strip(old) !== strip(body)) { fs.writeFileSync(out, body); return true; }
  return false;
};

(async () => {
  if (!url) {
    write(null);
    console.log("Shows: from js/config.js (no Sheet link set)");
    return;
  }
  let text;
  try {
    const r = await fetch(url, { redirect: "follow" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    text = await r.text();
    if (/^\s*</.test(text)) throw new Error("got a web page, not CSV (is the Sheet published to the web as CSV?)");
  } catch (e) {
    console.log("Shows: couldn't read the Sheet (" + e.message + "). Kept the last good copy.");
    return;
  }
  const { gigs, skipped } = sheetToGigs(text);
  const changed = write({ synced: new Date().toISOString(), gigs });
  console.log("Shows: " + gigs.length + " from the Sheet" + (changed ? " (updated)" : " (no change)"));
  skipped.forEach((s) => console.log("  Skipped Sheet row " + s.row + ": " + s.reason));
})();
