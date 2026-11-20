if (/[?&]todo\b/.test(location.search)) document.documentElement.classList.add("show-todo");
// Six to Midnight · press kit page (press-kit/). Facts, quote, contact and setup rows come from js/config.js.
// Missing setup facts show a [NEEDS] placeholder on screen (.todo) and a neutral "Ask us" when printed.
(function () {
  "use strict";
  var C = window.STM || {};
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var base = C.siteUrl ? C.siteUrl.replace(/\/?$/, "/") : new URL("../", location.href).href;
  var short = function (u) { return u.replace(/^https?:\/\//, "").replace(/^www\./, ""); };

  // song count
  var total = Object.keys(C.songs || {}).reduce(function (n, k) { return n + C.songs[k].length; }, 0);
  if (total) $$("[data-song-count]").forEach(function (el) { el.textContent = total; });

  // email + socials
  $$("[data-email]").forEach(function (a) { a.href = "mailto:" + (C.email || ""); if (a.hasAttribute("data-email-text")) a.textContent = C.email || ""; });
  $$("[data-social]").forEach(function (a) { var u = (C.socials || {})[a.dataset.social]; if (u) a.href = u; });

  // links to the site's own pages (absolute once siteUrl is set, so the printed text is a real address)
  var watch = base + "watch/", book = base + "book/";
  $$("[data-kit-watch]").forEach(function (a) { a.href = watch; a.textContent = short(watch); });
  $$("[data-kit-book]").forEach(function (a) { a.href = book; a.textContent = short(book); });

  // QR code to watch/
  var box = $("[data-kit-qr]");
  if (box && window.STMQR) {
    try {
      var q = window.STMQR.make(watch, "M"), n = q.getModuleCount(), d = "", pad = 1, size = n + pad * 2;
      for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) d += "M" + (c + pad) + " " + (r + pad) + "h1v1h-1z";
      box.innerHTML = '<svg viewBox="0 0 ' + size + " " + size + '" shape-rendering="crispEdges"><rect width="' + size + '" height="' + size + '" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
    } catch (e) { box.hidden = true; }
  }

  // one quote (config quotes with kit: true; public posts only, per the consent rule)
  var qBox = $("[data-kit-quote]");
  if (qBox) {
    var Q = (C.quotes || []).filter(function (x) { return x.kit; }).slice(0, 1);
    qBox.innerHTML = Q.map(function (x) { return '<figure><blockquote>"' + esc(x.text) + '"</blockquote><figcaption>' + esc(x.who) + (x.where ? ", " + esc(x.where) : "") + "</figcaption></figure>"; }).join("");
    qBox.hidden = !Q.length;
  }

  // what we need: every rider row; empty values = [NEEDS] on screen, "Ask us" in print
  var needs = $("[data-kit-needs]");
  if (needs) {
    needs.innerHTML = (C.rider || []).map(function (r) {
      var v = r.value ? esc(r.value)
        : '<span class="todo">[NEEDS: ' + esc(r.need || r.label) + ']</span><span class="ask">Ask us</span>';
      return "<li><span>" + esc(r.label) + "</span><span>" + v + "</span></li>";
    }).join("");
  }

  // stage plot note
  var plot = $("[data-kit-plot]");
  if (plot && C.stagePlotNote) plot.textContent = C.stagePlotNote;

  // absolute share image
  var og = $('meta[property="og:image"]');
  if (og && C.siteUrl) og.setAttribute("content", base + "img/og.jpg");

  $$("[data-print]").forEach(function (b) { b.addEventListener("click", function () { window.print(); }); });
})();
