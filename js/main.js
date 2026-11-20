// Six to Midnight · page behavior for the homepage and /book/.
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
  var timeText = function (g) { return g.time ? esc(g.time) : '<span class="todo">Time TBA</span>'; };
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

  function renderGigs(gigs) {
    var next = gigs[0];

    // ticket card under the hero
    var t = $("[data-next]");
    if (t) {
      if (next) {
        t.innerHTML = '<div class="stub"><div class="d">' + next.d.getDate() + '</div><div class="m">' + DAY[next.d.getDay()] + "<b>" + MON[next.d.getMonth()] + " " + next.d.getFullYear() + "</b></div></div>" +
          '<div class="info"><p class="label">Next show</p><h2>' + esc(next.venue) + "</h2><p>" + longDate(next.d) + " · " + esc(next.town) + " · " + timeText(next) + "</p>" +
          '<div class="row"><a class="btn btn-hot" href="' + esc(next.link || FB) + '" target="_blank" rel="noopener">' + (next.link ? "Get the details" : "Follow for updates") + "</a>" +
          '<a class="btn btn-line" href="' + mapsUrl(next) + '" target="_blank" rel="noopener">Get directions</a></div></div>';
      } else {
        t.closest(".ticket").classList.add("empty");
        t.innerHTML = '<div class="info"><p class="label">Next show</p><p>No shows on the calendar right now. Follow us and you\'ll hear first.</p>' +
          '<div class="row"><a class="btn btn-hot" href="' + esc(IG) + '" target="_blank" rel="noopener">Follow on Instagram</a></div></div>';
      }
    }

    // upcoming list
    var list = $("[data-gigs]");
    if (list) {
      list.innerHTML = gigs.length
        ? '<ul class="gigs">' + gigs.map(function (g) {
            return '<li class="gig"><div class="dt">' + g.d.getDate() + "<small>" + MON[g.d.getMonth()] + "</small></div>" +
              "<div><h3>" + esc(g.venue) + "</h3><p>" + longDate(g.d) + " · " + esc(g.town) + " · " + timeText(g) + "</p></div>" +
              (g.link ? '<a class="btn btn-line btn-sm" href="' + esc(g.link) + '" target="_blank" rel="noopener">Details</a>' : "") + "</li>";
          }).join("") + "</ul>"
        : '<p class="empty">Nothing booked right now. We\'re working on it. Want us at your place? <a href="' + ROOT + 'book/">Book the band.</a></p>';
    }

    // docked bar (phones)
    var dock = $("[data-dock]");
    if (dock && next) {
      dock.innerHTML = '<span class="dot" aria-hidden="true"></span><p><b>' + DAY[next.d.getDay()] + " " + shortDate(next.d) + " · " + esc(next.venue) + "</b>" + esc(next.town) + '</p><a class="btn btn-hot" href="#next">Details</a>';
      dock.hidden = false;
      document.body.classList.add("has-dock");
      // Tuck it away while the hero/ticket or the shows list is on screen, so it never covers them.
      var hide = $$("[data-dock-hide]");
      if ("IntersectionObserver" in window && hide.length) {
        var seen = new Set();
        var io = new IntersectionObserver(function (es) {
          es.forEach(function (e) { if (e.isIntersecting) seen.add(e.target); else seen.delete(e.target); });
          dock.classList.toggle("away", seen.size > 0);
        });
        hide.forEach(function (el) { io.observe(el); });
      }
    }

    $$("[data-hero-next]").forEach(function (el) { if (next) el.textContent = "Next show: " + shortDate(next.d); });
    // lines that mention the next show
    $$("[data-see-live]").forEach(function (el) {
      if (!next) return;
      el.innerHTML = '<a href="' + ROOT + '#next">See us live: ' + DAY[next.d.getDay()] + ", " + shortDate(next.d) + ", " + esc(next.venue) + ", " + esc(String(next.town).replace(/, [A-Z]{2}$/, "")) + "</a>";
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
        bonus.innerHTML = '<span class="label">' + esc(k) + "</span>" + list.map(function (x) { return '<b data-s="' + esc((x[0] + " " + x[1]).toLowerCase()) + '" data-t="' + esc(x[0]) + '" data-a="' + esc(x[1]) + '">' + esc(x[0]) + '</b><span class="muted">' + esc(x[1]) + "</span>"; }).join("");
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
        return '<div><div class="clip' + (m.tall ? " tall" : "") + '"><video controls playsinline preload="none"' + (m.poster ? ' poster="' + esc(asset(m.poster)) + '"' : "") + (m.title ? ' aria-label="' + esc(m.title) + '"' : "") + '><source src="' + esc(asset(m.src)) + '" type="video/mp4"></video></div>' +
          (m.title ? '<p class="clip-title">' + esc(m.title) + "</p>" : "") + "</div>";
      }).join("") + "</div>" +
        '<p class="clip-more"><a class="btn btn-line" data-social="instagram" href="' + esc((C.socials && C.socials.instagram) || "https://www.instagram.com/six.to.midnight/") + '" target="_blank" rel="noopener">More clips on Instagram</a></p>';
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
        return '<a class="btn ' + (i ? "btn-line" : "btn-hot") + '" href="' + esc(r.url) + '" target="_blank" rel="noopener">' + esc(r.label || "Watch on Instagram") + "</a>";
      }).join("") + extra;
    });
  }

  // ---------- setup / tech rider (rows with no value stay hidden) ----------
  function renderRider() {
    var body = $("[data-rider]");
    if (!body) return;
    body.innerHTML = (C.rider || []).filter(function (r) { return r && r.value; })
      .map(function (r) { return '<tr><th scope="row">' + esc(r.label) + "</th><td>" + esc(r.value) + "</td></tr>"; }).join("");
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
      if (!f.name.value.trim() || !f.email.value.trim() || !f.date.value) { say("We just need your name, email and a date.", true); (f.name.value.trim() ? (f.email.value.trim() ? f.date : f.email) : f.name).focus(); return; }
      if (!EMAIL_RE.test(f.email.value.trim())) { say("That email doesn't look right. Mind checking it?", true); f.email.focus(); return; }
      var data = new FormData(form);
      if (C.bookingFormAction) {
        data.append("_subject", "Booking inquiry: " + niceDate(f.date.value));
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
      var labels = { name: "Name", email: "Email", venue: "Venue or event", town: "Town", date: "Date", type: "Type of gig", message: "Anything else" };
      var body = Object.keys(labels).map(function (k) { return labels[k] + ": " + (data.get(k) || ""); }).join("\n");
      say("Opening your email app with your details filled in. Just hit send.<br>Nothing opened? Email us at " + mailLink + ".");
      location.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent("Booking inquiry: " + niceDate(f.date.value)) + "&body=" + encodeURIComponent(body);
    });
  }

  renderShareMeta(); renderLinks(); renderReels(); renderRider(); renderSongs(); renderQuotes(); renderVideos(); wireNewsletter(); wireBooking();
  loadGigs().then(renderGigs);
})();
