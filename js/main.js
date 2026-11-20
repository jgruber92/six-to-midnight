// Six to Midnight · page behavior for every main page (Home, About, Shows, Songs, Watch, Book us).
// Each block only runs if its data- hook is on the page, so pages render only what they have.
// Content lives in js/config.js. Nothing here needs editing for normal updates.
(function () {
  "use strict";
  var C = window.STM || {};
  var ROOT = document.body.getAttribute("data-root") || ""; // "" on the homepage, "../" one folder down
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var EMAIL = C.email || "";
  var IG = (C.socials || {}).instagram || "";
  var FB = (C.socials || {}).facebook || "";
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // Song matching (same rules as js/request.js): ignore apostrophes and punctuation, "&" reads as "and",
  // a standalone "by" is dropped, "going" matches "goin", word by word.
  var norm = function (s) {
    return String(s || "").toLowerCase().replace(/&/g, " and ").replace(/['\u2019]/g, "").replace(/[^a-z0-9]+/g, " ").trim()
      .split(" ").filter(function (w) { return w && w !== "by"; }).map(function (w) { return w.replace(/ing$/, "in"); }).join(" ");
  };
  // Other names fans type (config: artistAliases / titleAliases).
  var artistNames = function (a) { return [a].concat((C.artistAliases || {})[a] || []); };
  var titleNames = function (t) { return [t].concat((C.titleAliases || {})[t] || []); };
  // Whole words only; the last word may still be mid-typing, so it only has to start a word ("fall ou").
  var matches = function (q, target) {
    var t = norm(target).split(" "), qw = norm(q).split(" ");
    return qw.every(function (w, i) {
      return t.some(function (x) { return i === qw.length - 1 ? x.indexOf(w) === 0 : x === w; });
    });
  };
  // Media paths in config are written from the site root; make them work from sub-folders too.
  var asset = function (p) { return /^(https?:)?\/\//.test(p) || !p ? p : ROOT + p; };

  // ---------- dates + gigs ----------
  var toDate = function (s) { var p = String(s).split("-").map(Number); return p[0] && p[1] && p[2] ? new Date(p[0], p[1] - 1, p[2]) : null; };
  var longDate = function (d) { return DAY[d.getDay()] + ", " + MON[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear(); };
  var shortDate = function (d) { return MON[d.getMonth()] + " " + d.getDate(); };
  // "Time TBA" placeholder: plain text on the live site (class .tba, no dashed .todo box). Fill `time` in config gigs.
  var timeText = function (g) { return g.time ? esc(g.time) : '<span class="tba">Time TBA</span>'; };
  var niceDate = function (v) { var d = toDate(v); return d ? longDate(d) : v; };
  var mapsUrl = function (g) { return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(g.venue + " " + g.town); };

  function parseCSV(text) {
    var rows = [], row = [], cell = "", q = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
      else if (ch === '"') q = true;
      else if (ch === ",") { row.push(cell); cell = ""; }
      else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
      else cell += ch;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    var head = (rows.shift() || []).map(function (h) { return h.trim().toLowerCase(); });
    return rows.filter(function (r) { return r.some(function (c) { return c.trim(); }); })
      .map(function (r) { var o = {}; head.forEach(function (h, i) { o[h] = (r[i] || "").trim(); }); return o; });
  }

  function loadGigs() {
    var fallback = Promise.resolve(C.gigs || []);
    var src = C.gigsCsvUrl
      ? fetch(C.gigsCsvUrl, { cache: "no-store" }).then(function (r) { return r.ok ? r.text().then(parseCSV) : C.gigs || []; }).catch(function () { return C.gigs || []; })
      : fallback;
    return src.then(function (gigs) {
      var today = new Date(); today.setHours(0, 0, 0, 0);
      return gigs.map(function (g) { return Object.assign({}, g, { d: toDate(g.date) }); })
        .filter(function (g) { return g.d && g.d >= today; })
        .sort(function (a, b) { return a.d - b.d; });
    });
  }

  // ---------- "Add to calendar" for a gig in config ----------
  // With a parseable time ("8pm", "8:30 PM") it's a 3-hour event; otherwise an all-day event.
  // Two flavors: an .ics file (Apple / Outlook) and a Google Calendar link (works in Instagram/Facebook in-app browsers).
  var pad2 = function (n) { return (n < 10 ? "0" : "") + n; };
  var ymd = function (d) { return d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()); };
  var stamp = function (d) { return ymd(d) + "T" + pad2(d.getHours()) + pad2(d.getMinutes()) + "00"; };
  // Gig time text -> start/end Dates. "8pm", "8:30 PM", "9 p.m.", "8-11pm", "8 to 11pm", "8pm-12am".
  // First number is the start; a start without am/pm takes the end's; no end time = start + 3 hours.
  // Anything else ("TBA", blank, "8") returns null and the event is all-day.
  function parseGigTime(g) {
    var AP = "(?:([ap])\\.?\\s*m\\.?)?";
    var m = new RegExp("^\\D*?(\\d{1,2})(?::(\\d{2}))?\\s*" + AP + "(?:\\s*(?:-|\\u2013|to)\\s*(\\d{1,2})(?::(\\d{2}))?\\s*" + AP + ")?", "i").exec(g.time || "");
    if (!m) return null;
    var sAp = m[3] || m[6];
    if (!sAp) return null;
    var at = function (h, min, ap) { var d = new Date(g.d); d.setHours((+h % 12) + (/p/i.test(ap) ? 12 : 0), +(min || 0), 0, 0); return d; };
    var s = at(m[1], m[2], sAp), e;
    if (m[4]) {
      e = at(m[4], m[5], m[6] || m[3]);
      if (e <= s) e.setDate(e.getDate() + 1); // runs past midnight
    } else e = new Date(s.getTime() + 3 * 3600 * 1000);
    return { start: s, end: e };
  }
  function calEvent(g) {
    var tm = parseGigTime(g);
    var shows = C.siteUrl ? C.siteUrl.replace(/\/?$/, "/") + "shows/" : "";
    var ev = { title: "Six to Midnight live at " + g.venue, where: g.venue + ", " + g.town,
      details: "90s & 2000s rock." + (tm ? "" : " Time TBA, check for updates.") + (shows ? " Shows: " + shows : "") + (IG ? " Instagram: " + IG : "") };
    if (tm) {
      ev.start = stamp(tm.start); ev.end = stamp(tm.end);
    } else {
      var e = new Date(g.d); e.setDate(e.getDate() + 1);
      ev.allDay = true; ev.start = ymd(g.d); ev.end = ymd(e); // end date is exclusive in both formats
    }
    return ev;
  }
  // RFC 5545: lines longer than 75 octets fold onto continuation lines that start with a space.
  function foldIcs(line) {
    var out = [], cur = "", n = 0;
    Array.from(line).forEach(function (ch) {
      var b = unescape(encodeURIComponent(ch)).length; // UTF-8 byte length
      if (n + b > 75) { out.push(cur); cur = " "; n = 1; }
      cur += ch; n += b;
    });
    out.push(cur);
    return out.join("\r\n");
  }
  function icsHref(g) {
    var ev = calEvent(g);
    var icsEsc = function (s) { return String(s || "").replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n"); };
    var now = new Date(), utc = now.getUTCFullYear() + pad2(now.getUTCMonth() + 1) + pad2(now.getUTCDate()) + "T" + pad2(now.getUTCHours()) + pad2(now.getUTCMinutes()) + "00Z";
    var when = ev.allDay ? ["DTSTART;VALUE=DATE:" + ev.start, "DTEND;VALUE=DATE:" + ev.end] : ["DTSTART:" + ev.start, "DTEND:" + ev.end];
    var lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Six to Midnight//Site//EN", "BEGIN:VEVENT",
      "UID:stm-" + ymd(g.d) + "-" + norm(g.venue).replace(/ /g, "-") + "@six-to-midnight", "DTSTAMP:" + utc].concat(when).concat([
      "SUMMARY:" + icsEsc(ev.title), "LOCATION:" + icsEsc(ev.where), "DESCRIPTION:" + icsEsc(ev.details),
      "END:VEVENT", "END:VCALENDAR"]);
    return "data:text/calendar;charset=utf-8," + encodeURIComponent(lines.map(foldIcs).join("\r\n") + "\r\n");
  }
  function googleCalHref(g) {
    var ev = calEvent(g);
    return "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      "&text=" + encodeURIComponent(ev.title) + "&dates=" + ev.start + "/" + ev.end +
      (ev.allDay ? "" : "&ctz=" + encodeURIComponent(C.timeZone || "America/New_York")) +
      "&location=" + encodeURIComponent(ev.where) + "&details=" + encodeURIComponent(ev.details);
  }

  function renderGigs(gigs) {
    var next = gigs[0];

    // next-show ticket. data-next="home": Get show emails. Otherwise (Shows page): details link, or Instagram.
    // Both get Add to calendar (.ics built here from config) and Directions.
    var t = $("[data-next]");
    if (t) {
      var home = t.dataset.next === "home";
      if (next) {
        var first = (home
          ? '<a class="btn btn-hot btn-sm" href="' + ROOT + 'shows/#newsletter">Get show emails</a>'
          : '<a class="btn btn-hot btn-sm" href="' + esc(next.link || IG) + '" target="_blank" rel="noopener">' + (next.link ? "Get the details" : "Follow for updates") + "</a>");
        var cal = '<p class="cal">Add to calendar: <a href="' + icsHref(next) + '" download="six-to-midnight-' + esc(next.date) + '.ics">Apple / Outlook</a> · ' +
          '<a href="' + esc(googleCalHref(next)) + '" target="_blank" rel="noopener">Google</a></p>';
        t.innerHTML = '<div class="stub"><div class="d">' + next.d.getDate() + '</div><div class="m">' + DAY[next.d.getDay()] + "<b>" + MON[next.d.getMonth()] + " " + next.d.getFullYear() + "</b></div></div>" +
          '<div class="info"><p class="label">Next show</p><h2>' + esc(next.venue) + "</h2><p>" + longDate(next.d) + " · " + esc(next.town) + " · " + timeText(next) + "</p>" +
          '<div class="row">' + first + '<a class="btn btn-line btn-sm" href="' + mapsUrl(next) + '" target="_blank" rel="noopener">Directions</a></div>' + cal + "</div>";
      } else if (home) {
        t.closest(".ticket").classList.add("empty");
        t.innerHTML = '<div class="info"><p class="label">Next show</p><p>Nothing on the calendar yet. Follow along and you\'ll hear first.</p>' +
          '<div class="row"><a class="btn btn-hot btn-sm" href="' + esc(IG) + '" target="_blank" rel="noopener">Follow on Instagram</a></div></div>';
      } else {
        t.closest(".ticket").hidden = true; // Shows page: the list below says it instead
      }
    }

    // upcoming list. data-gigs="rest" skips the first gig (it's the featured ticket); the whole
    // "Coming up" block hides when nothing else is booked.
    var list = $("[data-gigs]");
    if (list) {
      var rest = list.dataset.gigs === "rest" ? gigs.slice(1) : gigs;
      list.innerHTML = rest.length
        ? '<ul class="gigs">' + rest.map(function (g) {
            return '<li class="gig"><div class="dt">' + g.d.getDate() + "<small>" + MON[g.d.getMonth()] + "</small></div>" +
              "<div><h3>" + esc(g.venue) + "</h3><p>" + longDate(g.d) + " · " + esc(g.town) + " · " + timeText(g) + "</p></div>" +
              (g.link ? '<a class="btn btn-line btn-sm" href="' + esc(g.link) + '" target="_blank" rel="noopener">Details</a>' : "") + "</li>";
          }).join("") + "</ul>"
        : gigs.length ? ""
        : '<p class="empty">Nothing on the calendar right now. We\'re working on it. Sign up below and you\'ll hear first.</p>' +
          '<p class="empty">Want us at your place? <a href="' + ROOT + 'book/">Book us.</a></p>';
      $$("[data-gigs-head]").forEach(function (h) { h.hidden = !rest.length; });
      var box = list.closest("[data-gigs-section]");
      if (box) box.hidden = !rest.length && !!gigs.length;
    }

    // lines that mention the next show
    $$("[data-see-live]").forEach(function (el) {
      if (!next) return;
      el.innerHTML = '<a href="' + ROOT + 'shows/">See us live: ' + DAY[next.d.getDay()] + ", " + shortDate(next.d) + ", " + esc(next.venue) + ", " + esc(String(next.town).replace(/, [A-Z]{2}$/, "")) + "</a>";
      el.hidden = false;
    });
  }

  // ---------- setlist + "Do we play it?" ----------
  function renderSongs() {
    var groups = C.songs || {};
    var keys = Object.keys(groups);
    var total = keys.reduce(function (n, k) { return n + groups[k].length; }, 0);
    $$("[data-song-count]").forEach(function (el) { el.textContent = total; });
    $$("[data-setlist-link]").forEach(function (el) { if (C.setlistUrl) el.href = C.setlistUrl; else el.hidden = true; });
    var box = $("[data-decades]"), bonus = $("[data-bonus]");
    if (!box) return;
    var html = "";
    keys.forEach(function (k) {
      var list = groups[k];
      var row = function (x) { return '<li data-s="' + esc((x[0] + " " + x[1]).toLowerCase()) + '" data-t="' + esc(x[0]) + '" data-a="' + esc(x[1]) + '"><b>' + esc(x[0]) + "</b><span>" + esc(x[1]) + "</span></li>"; };
      if (list.length < 4 && bonus) { // the one-off 80s bonus gets its own box
        bonus.innerHTML = '<h3 class="label bonus-h">' + esc(k) + "</h3>" + list.map(function (x) { return '<b data-s="' + esc((x[0] + " " + x[1]).toLowerCase()) + '" data-t="' + esc(x[0]) + '" data-a="' + esc(x[1]) + '">' + esc(x[0]) + '</b><span class="muted">' + esc(x[1]) + "</span>"; }).join("");
        return;
      }
      var big = (k.match(/(\d{2})(\d{2})?s/) || [])[0] || k; // "The 90s" -> "90s", "The 2000s" -> "2000s"
      if (big === "2000s") big = "00s";
      html += '<div class="decade"><div class="big" aria-hidden="true">' + esc(big) + '</div><h3 class="sr-only">' + esc(k) + '</h3><p class="count">' + esc(k) + " · " + list.length + " songs</p><ol>" + list.map(row).join("") + "</ol></div>";
    });
    box.innerHTML = html;

    var find = $("[data-find]"), result = $("[data-find-result]"), wrap = $(".setlist");
    if (!find) return;
    // A row matches if the search fits any title/artist name pair; "We play this one!" needs an exact title (or title + artist).
    var pairs = function (x) { var out = []; titleNames(x.t).forEach(function (t) { artistNames(x.a).forEach(function (a) { out.push([t, a]); }); }); return out; };
    var songHit = function (q, x) { return pairs(x).some(function (p) { return matches(q, p[0] + " " + p[1]); }); };
    var songExact = function (q, x) { return pairs(x).some(function (p) { return norm(p[0]) === q || norm(p[0] + " " + p[1]) === q || norm(p[1] + " " + p[0]) === q; }); };
    find.addEventListener("input", function () {
      var q = norm(find.value);
      wrap.classList.toggle("searching", !!q);
      var hits = 0, sure = false, found = [];
      $$(".decade", box).forEach(function (d) {
        var n = 0;
        $$("li", d).forEach(function (li) { var h = !!q && songHit(q, li.dataset); li.classList.toggle("hit", h); if (h) { n++; found.push(li.dataset); if (songExact(q, li.dataset)) sure = true; } });
        d.classList.toggle("none", !!q && !n); hits += n;
      });
      if (bonus) { var bb = $("[data-s]", bonus); var bh = !!q && bb && songHit(q, bb.dataset); bonus.classList.toggle("hit", !!bh); if (bh) { hits++; found.push(bb.dataset); if (songExact(q, bb.dataset)) sure = true; } }
      if (!q) { result.textContent = ""; return; }
      var reqLink = '<a class="link" href="' + ROOT + "request/?song=" + encodeURIComponent(find.value.trim()) + '">Request it.</a>';
      // Only an exact title (or title + artist) gets the "We play this one!" claim; partial matches are just listed.
      // An artist search ("weezer", "fall out boy"): name the songs.
      var oneArtist = found.length && found.every(function (x) { return x.a === found[0].a; }) && artistNames(found[0].a).some(function (a) { return norm(a).indexOf(q) === 0; });
      var artistLine = oneArtist ? "<b>We play " + found.length + " " + esc(found[0].a) + " song" + (found.length === 1 ? "" : "s") + ":</b> " + found.map(function (x) { return esc(x.t); }).join(" / ") : "";
      result.innerHTML = sure ? "<b>We play this one!</b>" : artistLine ? artistLine
        : hits ? hits + " song" + (hits === 1 ? "" : "s") + " in the set match" + (hits === 1 ? "es" : "") + ". Not the one you meant? " + reqLink
        : "Not in the set yet. " + reqLink;
    });
  }

  // ---------- testimonials ----------
  function renderQuotes() {
    var Q = C.quotes || [];
    var cite = function (q) { return esc(q.who) + (q.where ? ", " + esc(q.where) : ""); };
    $$("[data-quotes]").forEach(function (el) {
      var max = el.dataset.quotes === "all" ? Q.length : +el.dataset.quotes || 3;
      // Venue and fan quotes lead; handle-only credits (e.g. @someone) go last on the full list.
      var ordered = max >= Q.length ? Q.filter(function (q) { return !/^@/.test(q.who); }).concat(Q.filter(function (q) { return /^@/.test(q.who); })) : Q;
      var list = ordered.slice(0, max);
      if (!list.length) { el.closest("section").hidden = true; return; }
      var lead = list[0];
      el.innerHTML = '<figure><blockquote class="big">"' + esc(lead.text) + '"</blockquote><figcaption class="who">' + cite(lead) + "</figcaption></figure>" +
        (list.length > 1 ? '<div class="' + (el.dataset.quotes === "all" ? "qgrid" : "small") + '">' + list.slice(1).map(function (q) {
          return '<figure><blockquote>"' + esc(q.text) + '"</blockquote><figcaption>' + cite(q) + "</figcaption></figure>";
        }).join("") + "</div>" : "");
    });
  }

  // ---------- quote swipe row (Home): data-quote-row="3" ----------
  function renderQuoteRow() {
    var Q = C.quotes || [];
    $$("[data-quote-row]").forEach(function (el) {
      var list = Q.slice(0, +el.dataset.quoteRow || 3);
      if (!list.length) { el.closest("section").hidden = true; return; }
      el.innerHTML = list.map(function (q) {
        return '<figure class="q"><blockquote>"' + esc(q.text) + '"</blockquote><figcaption>' + esc(q.who) + (q.where ? ", " + esc(q.where) : "") + "</figcaption></figure>";
      }).join("");
      // Keyboard users can scroll it only while it's a swipe row; on desktop it's a static grid, so no tab stop.
      var tabStop = function () { if (el.scrollWidth > el.clientWidth + 2) el.setAttribute("tabindex", "0"); else el.removeAttribute("tabindex"); };
      tabStop(); window.addEventListener("resize", tabStop);
    });
  }

  // ---------- one featured clip: data-clip="0" (index in config clips) + caption in data-clip-title="0" ----------
  function renderFeatureClip() {
    var clips = C.clips || [];
    $$("[data-clip]").forEach(function (box) {
      var m = clips[+box.dataset.clip || 0];
      if (!m) { var f = box.closest("section"); if (f) f.hidden = true; return; }
      box.innerHTML = '<video controls playsinline preload="none"' + (m.poster ? ' poster="' + esc(asset(m.poster)) + '"' : "") +
        ' aria-label="' + esc(m.label || m.title || "Six to Midnight live clip") + '"><source src="' + esc(asset(m.src)) + '" type="video/mp4"></video>';
    });
    $$("[data-clip-title]").forEach(function (el) {
      var m = clips[+el.dataset.clipTitle || 0];
      if (m && m.title) el.textContent = m.title; else el.hidden = true;
    });
  }

  // ---------- video ----------
  function renderVideos() {
    var clips = (C.clips || []).map(function (c) { return { mp4: c }; })
      .concat((C.videos || []).filter(Boolean).map(function (id) { return { yt: id }; }));
    $$("[data-videos]").forEach(function (box) {
      if (!clips.length) return; // keep the "clips coming soon" panel that's in the HTML
      $$("[data-videos-intro]").forEach(function (el) { el.hidden = false; });
      var tall = clips.every(function (c) { return c.mp4 && c.mp4.tall; });
      box.innerHTML = '<div class="clips' + (tall ? " tall" : clips.length > 1 ? " many" : "") + '">' + clips.map(function (c) {
        if (c.yt) {
          return '<div><div class="clip"><iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(c.yt) + '" title="Six to Midnight live clip" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div></div>';
        }
        var m = c.mp4;
        return '<div><div class="clip' + (m.tall ? " tall" : "") + '"><video controls playsinline preload="none"' + (m.poster ? ' poster="' + esc(asset(m.poster)) + '"' : "") + ((m.label || m.title) ? ' aria-label="' + esc(m.label || m.title) + '"' : "") + '><source src="' + esc(asset(m.src)) + '" type="video/mp4"></video></div>' +
          (m.title ? '<p class="clip-title">' + esc(m.title) + "</p>" : "") + "</div>";
      }).join("") + "</div>" + (box.dataset.videos === "nomore" ? "" :
        '<p class="clip-more"><a class="btn btn-line" data-social="instagram" href="' + esc((C.socials && C.socials.instagram) || "https://www.instagram.com/six.to.midnight/") + '" target="_blank" rel="noopener">More clips on Instagram</a></p>');
    });
  }

  // ---------- Instagram reels as stand-in video proof ----------
  function renderReels() {
    var reels = (C.reels || []).filter(function (r) { return r && r.url; });
    if (!reels.length) return; // keep the plain "Watch on Instagram" button
    $$("[data-reels]").forEach(function (box) {
      var extra = box.dataset.reels === "clip"
        ? '<a class="btn btn-line" href="mailto:' + esc(EMAIL) + "?subject=" + encodeURIComponent("Clip request") + '">Ask for a clip</a>' : "";
      box.innerHTML = reels.map(function (r, i) {
        // data-reels="line": every reel is an outline button (the page has its own single primary button)
        var hot = !i && box.dataset.reels !== "line";
        return '<a class="btn ' + (hot ? "btn-hot" : "btn-line") + '" href="' + esc(r.url) + '" target="_blank" rel="noopener">' + esc(r.label || "Watch on Instagram") + "</a>";
      }).join("") + extra;
    });
  }

  // ---------- setup / tech rider (rows with no value stay hidden) ----------
  function renderRider() {
    var body = $("[data-rider]");
    if (!body) return;
    var rows = (C.rider || []).filter(function (r) { return r && r.value; });
    body.innerHTML = rows.map(function (r) { return '<tr><th scope="row">' + esc(r.label) + "</th><td>" + esc(r.value) + "</td></tr>"; }).join("");
    // Only the PA row so far (and that's already in the quick facts): hide the section and its page-nav link.
    // It shows on its own once more rider rows in config have a value.
    var few = rows.length < 2;
    var sec = body.closest("section"); if (sec) sec.hidden = few;
    $$("[data-setup-link]").forEach(function (el) { el.hidden = few; });
  }

  // ---------- absolute share links once siteUrl is set ----------
  function renderShareMeta() {
    if (!C.siteUrl) return;
    var base = C.siteUrl.replace(/\/?$/, "/");
    var img = $('meta[property="og:image"]');
    if (img) img.setAttribute("content", base + "img/og.jpg");
    var depth = (ROOT.match(/\.\.\//g) || []).length;
    var parts = location.pathname.split("/");
    var here = base + parts.slice(parts.length - depth - 1).join("/");
    var url = $('meta[property="og:url"]');
    if (!url) { url = document.createElement("meta"); url.setAttribute("property", "og:url"); document.head.appendChild(url); }
    url.setAttribute("content", here);
  }

  // ---------- socials, email, extras ----------
  function renderLinks() {
    $$("[data-social]").forEach(function (a) {
      var url = (C.socials || {})[a.dataset.social];
      if (url) a.href = url; else a.hidden = true;
    });
    $$("[data-email]").forEach(function (a) {
      var sub = a.dataset.email;
      a.href = "mailto:" + EMAIL + (sub ? "?subject=" + encodeURIComponent(sub) : "");
      if (a.hasAttribute("data-email-text")) a.textContent = EMAIL;
    });
    $$("[data-presskit]").forEach(function (a) { if (C.pressKitUrl) { a.href = asset(C.pressKitUrl); a.hidden = false; } });
    $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  // ---------- newsletter ----------
  function wireNewsletter() {
    var form = $("[data-newsletter]");
    if (!form) return;
    var input = $("input[type=email]", form), msg = $("[data-newsletter-msg]");
    var say = function (text, bad) { msg.innerHTML = text; msg.classList.toggle("err", !!bad); msg.hidden = false; };
    var heads = $("[data-newsletter-heads]");
    if (heads) heads.hidden = !!C.newsletterAction;
    form.addEventListener("submit", function (e) {
      var v = input.value.trim();
      if (!v) { e.preventDefault(); say("Add your email first.", true); input.focus(); return; }
      if (!EMAIL_RE.test(v)) { e.preventDefault(); say("That email doesn't look right. Mind checking it?", true); input.focus(); return; }
      if (!C.newsletterAction) {
        e.preventDefault();
        // No signup tool yet: hand the address to the visitor's email app so it isn't lost.
        say('Opening your email app with your address filled in. Hit send and you\'re on the list.<br>Nothing opened? Email <a href="mailto:' + esc(EMAIL) + '">' + esc(EMAIL) + "</a>.");
        location.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent("Add me to the show list") + "&body=" + encodeURIComponent("Please add me to the Six to Midnight show list: " + v);
        return;
      }
      // Mailchimp / Kit embed forms: post natively in a new tab (their own confirm page).
      form.action = C.newsletterAction; form.method = "post"; form.target = "_blank";
      input.name = C.newsletterEmailField || "EMAIL";
      say("You're in. We'll email when the next show is booked.");
    });
  }

  // ---------- booking inquiry ----------
  function wireBooking() {
    var form = $("[data-booking]");
    if (!form) return;
    var msg = $("[data-booking-msg]"), btn = $("button[type=submit]", form);
    var say = function (html, bad) { msg.innerHTML = html; msg.classList.toggle("err", !!bad); msg.hidden = false; };
    var mailLink = '<a href="mailto:' + esc(EMAIL) + '">' + esc(EMAIL) + "</a>";
    var now = new Date(), pad = function (n) { return (n < 10 ? "0" : "") + n; };
    if (form.elements.date) form.elements.date.min = now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate());
    var heads = $("[data-booking-heads]");
    if (heads) heads.hidden = !!C.bookingFormAction;

    // "Ask about your event" preselects the private-party type
    $$("[data-gig-type]").forEach(function (a) {
      a.addEventListener("click", function () { var s = form.elements.type; if (s) s.value = a.dataset.gigType; });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = form.elements;
      if (!f.name.value.trim() || !f.email.value.trim()) { say("We just need your name and email.", true); (f.name.value.trim() ? f.email : f.name).focus(); return; }
      var when = f.date.value ? niceDate(f.date.value) : (f.flexible && f.flexible.checked ? "flexible dates" : "date TBD");
      if (!EMAIL_RE.test(f.email.value.trim())) { say("That email doesn't look right. Mind checking it?", true); f.email.focus(); return; }
      var data = new FormData(form);
      if (C.bookingFormAction) {
        data.append("_subject", "Booking inquiry: " + when);
        btn.disabled = true; say("Sending...");
        fetch(C.bookingFormAction, { method: "POST", body: data, headers: { Accept: "application/json" } })
          .then(function (r) {
            if (!r.ok) throw new Error(r.status);
            form.reset(); say("Got it, thanks! We'll check the calendar and get back to you at the email you gave us.");
          })
          .catch(function () { say("That didn't go through. Try again, or email us at " + mailLink + ".", true); })
          .then(function () { btn.disabled = false; });
        return;
      }
      // No endpoint yet: open a prefilled email to the band inbox.
      var labels = { name: "Name", email: "Email", venue: "Venue or event", town: "Town", date: "Date", flexible: "Dates are flexible", type: "Type of gig", message: "Anything else" };
      var body = Object.keys(labels).map(function (k) { return labels[k] + ": " + (data.get(k) || ""); }).join("\n");
      say("Opening your email app with your details filled in. Just hit send.<br>Nothing opened? Email us at " + mailLink + ".");
      location.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent("Booking inquiry: " + when) + "&body=" + encodeURIComponent(body);
    });
  }

  renderShareMeta(); renderLinks(); renderReels(); renderRider(); renderSongs(); renderQuotes(); renderQuoteRow(); renderFeatureClip(); renderVideos(); wireNewsletter(); wireBooking();
  // The next-show ticket grows once gigs render (and fonts/images load after that), which can push an
  // anchor target like shows/#newsletter down the page. Jump to it again once things settle, unless the
  // visitor has already scrolled on their own. behavior "instant" (not "auto": with html{scroll-behavior:smooth}
  // "auto" animates), so a deep link like book/#contact jumps straight there and reduced motion is respected.
  var userScrolled = false;
  ["wheel", "touchmove", "keydown"].forEach(function (ev) { window.addEventListener(ev, function () { userScrolled = true; }, { once: true, passive: true }); });
  var rejump = function () {
    var id = location.hash.slice(1), el = id && document.getElementById(id);
    if (el && !userScrolled) el.scrollIntoView({ behavior: "instant", block: "start" });
  };
  loadGigs().then(renderGigs).then(rejump);
  if (location.hash) {
    window.addEventListener("load", rejump);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(rejump);
  }
})();
