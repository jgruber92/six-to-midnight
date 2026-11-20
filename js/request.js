// Six to Midnight · /request/ song request page.
// Setlist, next gig, inbox and the form endpoint (songRequestAction) all come from js/config.js.
(function () {
  "use strict";
  var S = window.STM || {};
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  // Ignore apostrophes and punctuation, treat "going" like "goin", match word by word.
  // "&" reads as "and"; a standalone "by" ("creep by radiohead") is dropped.
  var norm = function (s) {
    return String(s || "").toLowerCase().replace(/&/g, " and ").replace(/['\u2019]/g, "").replace(/[^a-z0-9]+/g, " ").trim()
      .split(" ").filter(function (w) { return w && w !== "by"; }).map(function (w) { return w.replace(/ing$/, "in"); }).join(" ");
  };
  var matches = function (q, target) { var t = norm(target); return norm(q).split(" ").every(function (w) { return t.indexOf(w) > -1; }); };
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var EMAIL = S.email || "";
  var ENDPOINT = S.songRequestAction || "";

  var songs = [];
  Object.keys(S.songs || {}).forEach(function (k) { (S.songs[k] || []).forEach(function (x) { songs.push({ t: x[0], a: x[1] }); }); });

  // next upcoming gig from the config list (the homepage can also read a Sheet; this page stays offline-simple)
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var gig = (S.gigs || []).map(function (g) { var p = String(g.date).split("-").map(Number); return Object.assign({}, g, { d: new Date(p[0], p[1] - 1, p[2]) }); })
    .filter(function (g) { return g.d >= today; }).sort(function (a, b) { return a.d - b.d; })[0];

  var form = $("req"), song = $("song"), artist = $("artist"), list = $("suggest"), done = $("done");
  var err = $("err"), inset = $("inset"), atshow = $("atshow"), fail = $("fail"), go = form.querySelector(".go");

  document.querySelectorAll("[data-social]").forEach(function (a) { var u = (S.socials || {})[a.dataset.social]; if (u) a.href = u; });
  if (!ENDPOINT) $("nomail").hidden = false;
  if (S.siteUrl) { // absolute share image once the site address is known
    var og = document.querySelector('meta[property="og:image"]');
    if (og) og.setAttribute("content", S.siteUrl.replace(/\/?$/, "/") + "img/og.jpg");
  }

  // Suggestions: any title/artist name pair, including config aliases ("STP", "RHCP"). Kept on one line for the QA probe scripts.
  function find(q) { if (!norm(q)) return []; var A = S.artistAliases || {}, T = S.titleAliases || {}; return songs.filter(function (s) { return [s.t].concat(T[s.t] || []).some(function (t) { return [s.a].concat(A[s.a] || []).some(function (a) { return matches(q, t + " " + a); }); }); }).slice(0, 5); }
  function exact(t) { var n = norm(t); return n ? songs.filter(function (s) { return norm(s.t) === n; })[0] : null; }

  // RESOLVE-START: is the typed text a song we play? Strict on purpose: partial words ("dirtbag")
  // are only offered as suggestions to tap, never claimed automatically.
  var words = function (x) { var n = norm(x); return n ? n.split(" ") : []; };
  // Other names fans use (config: artistAliases / titleAliases). Matching only.
  var AA = S.artistAliases || {}, TA = S.titleAliases || {};
  var artistNames = function (s) { return [s.a].concat(AA[s.a] || []); };
  var titleNames = function (s) { return [s.t].concat(TA[s.t] || []); };
  var hasAll = function (needles, hay) { return needles.every(function (w) { return hay.indexOf(w) > -1; }); };
  function artistOk(s, artistText) {
    var typed = words(artistText); if (!typed.length) return true;
    return artistNames(s).some(function (name) {
      var real = words(name);
      return norm(name).replace(/ /g, "") === typed.join("") || hasAll(typed, real); // typed words are whole words of the name ("foo" ~ "Foo Fighters")
    });
  }
  function resolve(text, artistText) {
    var n = norm(text); if (!n) return null;
    var tw = words(text);
    var hits = songs.filter(function (s) {
      if (!artistOk(s, artistText)) return false;
      return titleNames(s).some(function (t) {
        var title = norm(t);
        if (n === title) return true;                                                    // (a) the title
        if (artistNames(s).some(function (a) { return n === norm(t + " " + a) || n === norm(a + " " + t); })) return true; // (b) title + artist
        var titleW = words(t);
        if (!hasAll(titleW, tw)) return false;                                           // (c) every title word, as whole words...
        var extra = tw.filter(function (w) { return titleW.indexOf(w) < 0; });
        return extra.length > 0 && artistNames(s).some(function (a) { return hasAll(extra, words(a)); }); // ...plus only that song's artist words
      });
    });
    var ex = hits.filter(function (s) { return titleNames(s).some(function (t) { return norm(t) === n; }); });
    return ex.length === 1 ? ex[0] : hits.length === 1 ? hits[0] : null;
  }
  // Not a sure match, but close: same title by another artist, or (with no artist typed) 1-3 suggestions.
  function nearMisses(text, artistText) {
    var n = norm(text); if (!n) return [];
    var same = songs.filter(function (s) { return titleNames(s).some(function (t) { return norm(t) === n; }); });
    if (same.length || words(artistText).length) return same;
    var m = find(text);
    if (!m.length) { var tw = words(text); m = songs.filter(function (s) { return hasAll(words(s.t), tw); }); } // "killing in the name of"
    return m.length && m.length <= 3 ? m : [];
  }
  // RESOLVE-END

  function close() { list.hidden = true; song.setAttribute("aria-expanded", "false"); }
  function showList() {
    var m = find(song.value);
    if (!m.length || (m.length === 1 && exact(song.value))) { close(); list.innerHTML = ""; return; }
    list.innerHTML = m.map(function (s, i) {
      return '<li role="option" id="opt' + i + '" tabindex="-1" data-i="' + i + '"><b>' + esc(s.t) + "</b><span>" + esc(s.a) + "</span><em>In the set</em></li>";
    }).join("");
    list._m = m; list.hidden = false; song.setAttribute("aria-expanded", "true");
  }
  var picked = null; // the suggestion the fan tapped, if any. Typing again clears it.
  function current() { return picked || resolve(song.value, artist.value); }
  function updateHint() { inset.hidden = !current(); }
  function pick(i) { var s = list._m[i]; song.value = s.t; artist.value = s.a; picked = s; close(); updateHint(); }

  song.addEventListener("input", function () { picked = null; err.hidden = true; showList(); updateHint(); });
  artist.addEventListener("input", function () { picked = null; updateHint(); });
  list.addEventListener("mousedown", function (e) { var li = e.target.closest("li"); if (li) { e.preventDefault(); pick(+li.dataset.i); } });
  list.addEventListener("click", function (e) { var li = e.target.closest("li"); if (li) { pick(+li.dataset.i); song.focus(); } });
  song.addEventListener("keydown", function (e) {
    if (e.key === "Escape") close();
    if (e.key === "ArrowDown" && !list.hidden) { e.preventDefault(); list.firstChild.focus(); }
  });
  list.addEventListener("keydown", function (e) {
    var li = e.target.closest("li"); if (!li) return;
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(+li.dataset.i); song.focus(); }
    if (e.key === "ArrowDown" && li.nextSibling) { e.preventDefault(); li.nextSibling.focus(); }
    if (e.key === "ArrowUp") { e.preventDefault(); (li.previousSibling || song).focus(); }
    if (e.key === "Escape") { close(); song.focus(); }
  });
  song.addEventListener("blur", function () { setTimeout(function () { if (!list.contains(document.activeElement)) close(); }, 150); });
  atshow.addEventListener("change", function () { $("showhelp").hidden = !atshow.checked; });

  // Prefill from the homepage search ("Not in the set yet. Request it"): /request/?song=...
  var pre = new URLSearchParams(location.search).get("song");
  if (pre) { song.value = pre.slice(0, 120); updateHint(); }

  function mailtoHref(d) {
    var body = "Song: " + d.song + "\nArtist: " + d.artist + "\nName: " + d.name + "\nAt a show: " + (d.live ? "yes" : "no") + "\nNote: " + d.note;
    return "mailto:" + EMAIL + "?subject=" + encodeURIComponent("Song request: " + d.song + (d.artist ? " by " + d.artist : "")) + "&body=" + encodeURIComponent(body);
  }

  function showDone(d, hit) {
    var title, msg, add = "";
    if (hit) {
      title = "We play this one!";
      msg = d.live ? "Yell for it tonight."
        : "Come to a show and yell for it." + (gig ? " Next one: " + DAY[gig.d.getDay()] + ", " + MON[gig.d.getMonth()] + " " + gig.d.getDate() + ", " + gig.venue + ", " + String(gig.town).replace(/, [A-Z]{2}$/, "") + "." : "");
    } else {
      title = "Added to the list";
      msg = "It's on the list. We'll bring it up at practice.";
      var near = nearMisses(d.song, d.artist);
      if (near.length === 1) add = "We play " + near[0].t + " by " + near[0].a + ". If that's the one, yell for it.";
      else if (near.length > 1) add = "We play " + near.map(function (x) { return x.t; }).join(" / ") + ". If it's one of those, yell for it.";
      else if (d.live) add = "That one's not in the set yet. Pick one we play and we'll try to get to it.";
    }
    done.dataset.state = hit ? "inset" : "new";
    $("doneSong").textContent = d.song + (d.artist ? " · " + d.artist : "");
    // With no inbox connected nothing is saved yet, so the title asks for the send tap.
    $("doneTitle").textContent = ENDPOINT ? title : "One more tap: hit send";
    // No endpoint: nothing is saved until they hit send, so don't say "added" yet.
    $("doneMsg").textContent = ENDPOINT ? msg : hit ? title + " " + msg
      : "Hit send and it goes on the list. If we already play it, yell for it at the show.";
    $("doneAdd").textContent = add; $("doneAdd").hidden = !add;
    $("seeSet").hidden = !!hit;
    var mail = $("doneMail"), mnote = $("doneMailNote");
    if (!ENDPOINT) {
      mail.href = mailtoHref(d); mail.hidden = false;
      mnote.innerHTML = "Opening your email app. Hit send and it's on its way to us.<br>No email app? Send your request to <a href=\"mailto:" + esc(EMAIL) + "\">" + esc(EMAIL) + "</a>.";
      mnote.hidden = false;
    } else { mail.hidden = true; mnote.hidden = true; }
    form.hidden = true; done.hidden = false; done.focus();
    window.scrollTo(0, 0);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    fail.hidden = true;
    if (!song.value.trim()) { err.hidden = false; song.focus(); return; }
    err.hidden = true;
    var d = { song: song.value.trim(), artist: artist.value.trim(), name: $("name").value.trim(), live: atshow.checked, note: $("note").value.trim() };
    var hit = current(); // the fan's own text is never rewritten; a blank artist is filled in for the email only
    if (hit && !d.artist && norm(d.song) === norm(hit.t)) d.artist = hit.a;

    if (!ENDPOINT) { // honest fallback: nothing is saved, so hand it to the visitor's email app
      showDone(d, hit);
      location.href = mailtoHref(d);
      return;
    }
    go.disabled = true; go.textContent = "Sending...";
    var fd = new FormData();
    fd.append("song", d.song); fd.append("artist", d.artist); fd.append("name", d.name);
    fd.append("at_show", d.live ? "yes" : "no"); fd.append("note", d.note); fd.append("in_set", hit ? "yes" : "no");
    fd.append("_subject", "Song request: " + d.song);
    fetch(ENDPOINT, { method: "POST", body: fd, headers: { Accept: "application/json" } })
      .then(function (r) { if (!r.ok) throw new Error(r.status); showDone(d, hit); })
      .catch(function () {
        fail.innerHTML = "That didn't go through. Try again, or email it to <a class=\"link\" href=\"" + esc(mailtoHref(d)) + "\">" + esc(EMAIL) + "</a>.";
        fail.hidden = false;
      })
      .then(function () { go.disabled = false; go.textContent = "Send my request"; });
  });

  $("again").addEventListener("click", function () {
    form.reset(); picked = null; close(); inset.hidden = true; err.hidden = true; $("showhelp").hidden = true;
    done.hidden = true; form.hidden = false; song.focus();
  });
})();
