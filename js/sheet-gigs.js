// Shows from a Google Sheet. Shared by the website (js/main.js) and the build scripts
// (scripts/sync_gigs.js, nightly job), so both read the Sheet the same way.
//
// Sheet columns (header row, any order, any capitalization):
//   date | venue | town | time | link | venue website | venue instagram | cover
// Only date and venue are required.
// Dates the band can type: 2027-02-20, 2/20/2027, 2/20/27, Feb 20 2027, Sat, Feb 20, 2027, Feb 20.
// (A date with no year means the next Feb 20 from today.) Bad rows are skipped and listed in `skipped`.
(function (root) {
  var MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  var pad2 = function (n) { return (n < 10 ? "0" : "") + n; };

  function parseCSV(text) {
    var rows = [], row = [], cell = "", q = false;
    text = String(text || "").replace(/^﻿/, "");
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
      else if (ch === '"') q = true;
      else if (ch === ",") { row.push(cell); cell = ""; }
      else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
      else cell += ch;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  // Header text -> field name. "Venue website", "venue url", "VenueURL" all become venueUrl.
  function fieldName(h) {
    var k = String(h || "").toLowerCase().replace(/[^a-z]/g, "");
    if (k === "venuewebsite" || k === "venueurl" || k === "venuelink" || k === "website") return "venueUrl";
    if (k === "cover" || k === "covercharge" || k === "price") return "cover";
    if (k === "venueinstagram" || k === "instagram" || k === "venuesocials" || k === "venuesocial" || k === "socials") return "venueSocial";
    if (k === "city") return "town";
    if (k === "details" || k === "eventlink" || k === "tickets") return "link";
    return k;
  }

  // Any reasonable date -> "YYYY-MM-DD", or "" if it can't be read. `today` is for dates typed without a year.
  function normDate(v, today) {
    var s = String(v || "").trim(), m, y, mo, d;
    if (!s) return "";
    today = today || new Date();
    if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s))) { y = +m[1]; mo = +m[2]; d = +m[3]; }
    else if ((m = /^(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2,4}))?$/.exec(s))) {
      mo = +m[1]; d = +m[2]; y = m[3] ? +m[3] : 0; if (y && y < 100) y += 2000;
    } else {
      var t = s.toLowerCase().replace(/(\d)(st|nd|rd|th)\b/g, "$1").replace(/[,.]/g, " ");
      var mi = -1;
      MONTHS.forEach(function (name, i) { if (mi < 0 && new RegExp("\\b" + name).test(t)) mi = i; });
      var yr = /\b(\d{4})\b/.exec(t);
      m = /\b(\d{1,2})\b/.exec(t.replace(/\b\d{4}\b/g, " "));
      if (mi < 0 || !m) return "";
      mo = mi + 1; d = +m[1]; y = yr ? +yr[1] : 0;
    }
    if (!y) { // no year: the next time this date comes around
      y = today.getFullYear();
      var start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      if (new Date(y, mo - 1, d) < start) y++;
    }
    var dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return "";
    return y + "-" + pad2(mo) + "-" + pad2(d);
  }

  // CSV text -> { gigs: [...], skipped: [{row, reason}] }. Gigs come back sorted by date.
  function sheetToGigs(text, today) {
    var rows = parseCSV(text);
    var head = (rows.shift() || []).map(fieldName);
    var gigs = [], skipped = [];
    rows.forEach(function (r, i) {
      if (!r.some(function (c) { return String(c).trim(); })) return; // blank row
      var g = {};
      head.forEach(function (h, j) { if (h) g[h] = String(r[j] || "").trim(); });
      var rowNo = i + 2; // as the band sees it in the Sheet (row 1 is the header)
      var date = normDate(g.date, today);
      if (!date) { skipped.push({ row: rowNo, reason: "can't read the date \"" + (g.date || "") + "\"" }); return; }
      if (!g.venue) { skipped.push({ row: rowNo, reason: "no venue" }); return; }
      var out = { date: date, venue: g.venue, town: g.town || "", time: g.time || "", link: g.link || "" };
      var vu = String(g.venueUrl || "");
      if (vu && !/^https?:\/\//i.test(vu) && /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(vu)) vu = "https://" + vu;
      if (/^https?:\/\//i.test(vu)) out.venueUrl = vu;
      // Venue Instagram (or other social pages): "@brothers.tavern", "instagram.com/brothers.tavern" or a full link.
      // Several allowed, separated by spaces or commas. Tells Google which venue this is.
      var so = String(g.venueSocial || "").split(/[\s,]+/).map(function (v) {
        if (/^@[\w.]+$/.test(v)) return "https://www.instagram.com/" + v.slice(1);
        if (v && !/^https?:\/\//i.test(v) && /^[\w-]+(\.[\w-]+)+\/\S+$/.test(v)) return "https://" + v;
        return /^https?:\/\//i.test(v) ? v : "";
      }).filter(Boolean);
      if (so.length) out.venueSameAs = so;
      if (g.cover !== undefined && g.cover !== "") {
        var c = String(g.cover).replace(/[$\s]/g, "");
        if (/^free$/i.test(c)) out.cover = 0; else if (/^\d+(\.\d+)?$/.test(c)) out.cover = Number(c);
      }
      if (out.link && !/^https?:\/\//i.test(out.link)) out.link = "https://" + out.link;
      gigs.push(out);
    });
    gigs.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    return { gigs: gigs, skipped: skipped };
  }

  var api = { parseCSV: parseCSV, normDate: normDate, sheetToGigs: sheetToGigs };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SheetGigs = api;
})(typeof window !== "undefined" ? window : this);
