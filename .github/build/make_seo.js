// SEO files, rebuilt from js/config.js every publish (publish.sh runs this):
//   sitemap.xml + robots.txt  -> tell Google every page to crawl
//   structured data (JSON-LD) -> tells Google "this is a band, these are its shows, these are its socials".
//     Home: band + website + upcoming shows. Shows: upcoming shows. About: band.
//     Written between <!-- seo:start --> and <!-- seo:end --> in each page's <head>.
// Run by hand: node scripts/make_seo.js
const fs = require("fs");
const path = require("path");
const { C, root, pad2, gigs } = require("./gigs-lib");

const SITE = (C.siteUrl || "https://sixtomidnightlive.com/").replace(/\/?$/, "/");
const TZ = C.timeZone || "America/New_York";
const PAGES = ["", "shows/", "book/", "songs/", "watch/", "about/", "request/", "suggest/", "press-kit/"];
const today = new Date();
const isoDay = (d) => d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());

// "2027-02-20T20:00:00-05:00": local Eastern time with the right winter/summer offset.
function isoEastern(d) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: TZ, timeZoneName: "longOffset" }).formatToParts(d);
  const off = (parts.find((p) => p.type === "timeZoneName").value.replace("GMT", "") || "+00:00");
  return isoDay(d) + "T" + pad2(d.getHours()) + ":" + pad2(d.getMinutes()) + ":00" + off;
}

// 1. sitemap + robots
fs.writeFileSync(path.join(root, "sitemap.xml"),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  PAGES.map((p) => "  <url><loc>" + SITE + p + "</loc><lastmod>" + isoDay(today) + "</lastmod></url>").join("\n") +
  "\n</urlset>\n");
fs.writeFileSync(path.join(root, "robots.txt"), "User-agent: *\nAllow: /\n\nSitemap: " + SITE + "sitemap.xml\n");

// 2. structured data
const socials = Object.values(C.socials || {}).filter((u) => /^https?:/.test(u || ""));
const IMG = SITE + "img/og.jpg";
const band = {
  "@type": "MusicGroup",
  "@id": SITE + "#band",
  name: "Six to Midnight",
  alternateName: ["6 to Midnight", "Six to Midnight band", "STM"],
  url: SITE,
  image: IMG,
  logo: SITE + "img/apple-touch-icon.png",
  description: "Five-piece 90s and 2000s rock and pop-punk cover band based in Central Massachusetts. Vocals, two guitars, bass and drums, with our own PA.",
  genre: ["Rock", "Alternative rock", "Pop punk", "Cover band"],
  foundingLocation: { "@type": "Place", name: "Central Massachusetts" },
  areaServed: { "@type": "Place", name: "Central Massachusetts" },
  email: C.email || undefined,
  sameAs: socials,
};
const site = { "@type": "WebSite", "@id": SITE + "#site", name: "Six to Midnight", alternateName: "Six to Midnight band", url: SITE, publisher: { "@id": SITE + "#band" } };

const upcoming = gigs().filter((g) => g.d >= new Date(today.getFullYear(), today.getMonth(), today.getDate()));
const events = upcoming.map((g) => {
  const [town, region] = String(g.town).split(/,\s*/);
  const ev = {
    "@type": "MusicEvent",
    name: "Six to Midnight live at " + g.venue,
    description: "90s and 2000s rock and pop-punk covers from Six to Midnight at " + g.venue + " in " + g.town + ".",
    startDate: g.tm ? isoEastern(g.tm.start) : g.date,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: g.venue, address: { "@type": "PostalAddress", addressLocality: town, addressRegion: region || "MA", addressCountry: "US" } },
    image: IMG,
    url: SITE + "shows/",
    performer: { "@id": SITE + "#band" },
    organizer: Object.assign({ "@type": "Organization", name: g.venue }, g.venueUrl ? { url: g.venueUrl } : {}, g.venueSameAs ? { sameAs: g.venueSameAs } : {}),
  };
  const cover = g.cover !== undefined ? g.cover : C.coverDefault;
  if (cover !== undefined && cover !== "") {
    ev.offers = { "@type": "Offer", price: String(cover), priceCurrency: "USD", availability: "https://schema.org/InStock", url: SITE + "shows/" };
    if (Number(cover) === 0) ev.isAccessibleForFree = true;
  }
  if (g.tm) ev.endDate = isoEastern(g.tm.end);
  return ev;
});

const graph = (items) => JSON.stringify({ "@context": "https://schema.org", "@graph": items }, null, 1).replace(/</g, "\\u003c");
const blocks = {
  "index.html": graph([band, site].concat(events)),
  "shows/index.html": graph([band].concat(events)),
  "about/index.html": graph([band]),
};
Object.keys(blocks).forEach((f) => {
  const p = path.join(root, f);
  let s = fs.readFileSync(p, "utf8");
  const block = '<!-- seo:start (built by scripts/make_seo.js, edit config.js instead) -->\n<script type="application/ld+json">\n' + blocks[f] + "\n</script>\n<!-- seo:end -->\n";
  if (s.includes("<!-- seo:start")) s = s.replace(/<!-- seo:start[\s\S]*?<!-- seo:end -->\n/, block);
  else s = s.replace("</head>", block + "</head>");
  fs.writeFileSync(p, s);
});
console.log("SEO: sitemap (" + PAGES.length + " pages), robots.txt, structured data with " + events.length + " upcoming shows");
