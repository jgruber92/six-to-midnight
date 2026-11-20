// =============================================================
// SIX TO MIDNIGHT · site settings
// Everything the band might change lives here. Edit, save, push.
// =============================================================
window.STM = {
  // Full public address of the site, ending in "/" (e.g. "https://sixtomidnight.com/").
  // Leave empty until it's published. When set, pages use it for absolute og:image / og:url links.
  siteUrl: "https://sixtomidnightlive.com/",

  email: "sixtomidnight6200@gmail.com", // band inbox (from Facebook page; confirm)

  socials: {
    instagram: "https://www.instagram.com/six.to.midnight/",
    facebook: "https://www.facebook.com/sixtomidnight6200",
    youtube: "", // add channel link when ready
  },

  // Gig dates. When the shared Google Sheet is set up:
  // File > Share > Publish to web > Sheet1 > CSV, paste the link here.
  // Sheet columns: date (YYYY-MM-DD) | venue | town | time | link
  gigsCsvUrl: "",

  // Used until the Sheet link above is filled in.
  // time: shown as written. For "Add to calendar" these formats are understood:
  //   "8pm", "8:30 PM", "9 p.m.", "8-11pm", "8 to 11pm", "8pm-12am" (no end time = 3 hours).
  //   Blank or anything else ("TBA") = all-day event and "Time TBA" on the site.
  gigs: [
    { date: "2027-02-20", venue: "Brother's Tavern", town: "Milford, MA", time: "8-11pm", link: "" },
  ],


  // Testimonials: real comments from the band's Facebook/Instagram (pulled 2026-11-19).
  // Light cleanup only (typos, profanity). First name + last initial. Family members left out.
  // RULE: only quotes posted publicly (social media, public reviews) or used with the person's permission.
  // Never quote private emails or DMs without permission.
  quotes: [
    // Order matters: the first one leads on /book/. Whole-band praise leads.
    // home: true = one of the two quotes on Home. kit: true = the quote on the press kit (press-kit/).
    { text: "You guys kicked ass last night!", who: "Karen J.", where: "after Valley Pub", home: true },
    { text: "Show was amazing.", who: "Damien L.", where: "after Pinz, Milford" },
    { text: "Fantastic, tight band. Singer's got some unbelievable chops!", who: "Jorge C.", where: "on Facebook", home: true, kit: true },
    { text: "I have goosebumps. Sooo good, you guys!", who: "Karina R.", where: "on our Creep cover" },
    { text: "Guitar on point! Great cover!", who: "Lisa N.", where: "on our Creep cover" },
    { text: "This song is SUCH a banger.", who: "@literary_nat", where: "on Instagram" },
  ],

  // Newsletter signup. Paste the form "action" URL from Mailchimp/Kit.
  // Empty = the form shows a thank-you but saves nothing.
  newsletterAction: "",
  newsletterEmailField: "EMAIL", // Mailchimp uses EMAIL, Kit uses email_address

  // Song requests (/request/ page + QR card). Paste a Formspree or Google Form endpoint.
  // Empty = the form opens a prefilled email to the band inbox instead.
  songRequestAction: "https://script.google.com/macros/s/AKfycbww5pKwOwOJVHbuJv10TVd_UrhwoIbSJ2UMYLGfNXhBuRX29kU-7ga-q9HU_J4Z2_Vz4A/exec?form=song",

  // "Bring us to your bar" venue suggestions (suggest/ page). Same setup as song requests:
  // paste a Formspree or Google Form endpoint. Empty = the form opens a prefilled email to the band inbox.
  // Suggestions are private: they are never shown on the site.
  venueSuggestAction: "https://script.google.com/macros/s/AKfycbww5pKwOwOJVHbuJv10TVd_UrhwoIbSJ2UMYLGfNXhBuRX29kU-7ga-q9HU_J4Z2_Vz4A/exec?form=suggest",

  // The ready-made message fans share with a bar (suggest/ page). The booking page link
  // (siteUrl + "book/") is added to the end automatically.
  shareMessage: "Hey, you should book Six to Midnight. They're a 90s and 2000s rock band from Central Mass, they bring their own PA, and they're a lot of fun. They're @six.to.midnight on Instagram. Here's their booking page:",

  // Facebook reviews link (Shows + Book us). Leave EMPTY until Jeff confirms reviews are turned on
  // for the Facebook page, e.g. "https://www.facebook.com/sixtomidnight6200/reviews". Empty = the links stay hidden.
  reviewsUrl: "",

  // Crowd photos for the "We help spread the word" block on /book/. Empty = the photo row stays hidden.
  // e.g. { src: "img/gallery/crowd-01.jpg", alt: "Crowd singing along at Brother's Tavern", width: 1200, height: 1200 }
  crowdPhotos: [],

  // Booking form. Paste a Formspree (or similar) endpoint here.
  // Empty = the form opens an email to the band inbox instead.
  bookingFormAction: "https://script.google.com/macros/s/AKfycbww5pKwOwOJVHbuJv10TVd_UrhwoIbSJ2UMYLGfNXhBuRX29kU-7ga-q9HU_J4Z2_Vz4A/exec?form=booking",

  // Setlist (from Jeff's "Band Setlist" Spotify playlist, 41 songs, 2026-11-19).
  // Grouped by release decade. Add or remove lines here and the site updates.
  setlistUrl: "https://open.spotify.com/playlist/03Zaf2SRnZOYW9AtCvN4lC",
  songs: {
    "The 90s": [
      ["Man in the Box", "Alice In Chains"],
      ["Killing In The Name", "Rage Against The Machine"],
      ["Creep", "Radiohead"],
      ["Plush", "Stone Temple Pilots"],
      ["Shine", "Collective Soul"],
      ["Far Behind", "Candlebox"],
      ["Comedown", "Bush"],
      ["Say It Ain't So", "Weezer"],
      ["You Oughta Know", "Alanis Morissette"],
      ["Hey Man Nice Shot", "Filter"],
      ["Brain Stew", "Green Day"],
      ["If You Could Only See", "Tonic"],
      ["How's It Going to Be", "Third Eye Blind"],
      ["Shimmer", "Fuel"],
      ["My Own Worst Enemy", "Lit"],
      ["All The Small Things", "blink-182"],
      ["Learn to Fly", "Foo Fighters"],
    ],
    "The 2000s": [
      ["Teenage Dirtbag", "Wheatus"],
      ["The Middle", "Jimmy Eat World"],
      ["How You Remind Me", "Nickelback"],
      ["One Last Breath", "Creed"],
      ["Aerials", "System Of A Down"],
      ["Control", "Puddle Of Mudd"],
      ["Like a Stone", "Audioslave"],
      ["Show Me How to Live", "Audioslave"],
      ["My Friends Over You", "New Found Glory"],
      ["Seven Nation Army", "The White Stripes"],
      ["Ocean Avenue", "Yellowcard"],
      ["I Believe In A Thing Called Love", "The Darkness"],
      ["Scars", "Papa Roach"],
      ["Slither", "Velvet Revolver"],
      ["Joker And The Thief", "Wolfmother"],
      ["Sugar, We're Goin Down", "Fall Out Boy"],
      ["Dance, Dance", "Fall Out Boy"],
      ["Dani California", "Red Hot Chili Peppers"],
      ["Face Down", "The Red Jumpsuit Apparatus"],
      ["Never Too Late", "Three Days Grace"],
      ["Teenagers", "My Chemical Romance"],
      ["Passion's Killing Floor", "HIM"],
      ["Burn It to the Ground", "Nickelback"],
    ],
    "One from the 80s": [
      ["Wanted Dead Or Alive", "Bon Jovi"],
    ],
  },

  // Other names fans type for a band or song on the /request/ page (matching only, never shown).
  artistAliases: {
    "Rage Against The Machine": ["RATM"],
    "Stone Temple Pilots": ["STP"],
    "Alice In Chains": ["AIC"],
    "Red Hot Chili Peppers": ["RHCP", "Chili Peppers"],
    "My Chemical Romance": ["MCR"],
    "System Of A Down": ["SOAD"],
    "blink-182": ["blink182", "blink 182", "blink"],
    "Green Day": ["greenday"],
    "Nickelback": ["nickleback"],
    "Yellowcard": ["yellow card"],
    "Three Days Grace": ["3 days grace"],
    "Audioslave": ["chris cornell"],
  },
  titleAliases: {
    "Teenage Dirtbag": ["teenage dirt bag"],
  },

  // Live clips. Two kinds, shown together (first one is the big featured clip).
  // 1) Self-hosted MP4s: prep with scripts/prep_video.sh, put them in media/, then add e.g.
  //    { src: "media/creep-brothers-tavern.mp4", poster: "img/hero/full-band-live-brothers-tavern-moody.jpg", title: "Creep, Brother's Tavern" }
  //    Add tall: true for vertical phone video (shown as phone-shaped players, two across).
  //   Add wide: true for a landscape (16:9) highlight. The first wide clip becomes the featured clip on
  //   Home and Book us (full-width frame); with no wide clip, the first clip stays featured as a phone clip.
  //   e.g. { src: "media/highlight-brothers-tavern.mp4", poster: "img/video/highlight-brothers-tavern.jpg",
  //          title: "Live at Brother's Tavern, Milford", label: "Six to Midnight highlight video, Brother's Tavern", wide: true },
  clips: [
    // title = caption shown under the clip; label = what screen readers hear.
    { src: "media/freeplay-arcade-full-band.mp4", poster: "img/video/freeplay-arcade-full-band.jpg", title: "Full band at Free Play Arcade", label: "Six to Midnight live at Free Play Arcade, full band", tall: true },
    { src: "media/freeplay-arcade-brandon.mp4", poster: "img/video/freeplay-arcade-brandon.jpg", title: "Up front at Free Play Arcade", label: "Brandon Ekvall singing live at Free Play Arcade", tall: true },
  ],
  // Instagram reels. Not shown on the site anymore (Watch has one "More on Instagram" link); kept for reference.
  reels: [
    { label: "Watch our Creep cover", url: "https://www.instagram.com/reel/DS-GY8YDJ-e/" },
    { label: "Watch: I Believe In A Thing Called Love", url: "https://www.instagram.com/reel/DSm3OgvjSZK/" },
    { label: "Watch: Ocean Avenue", url: "https://www.instagram.com/reel/DS3uF0qFUqz/" },
  ],
  // 2) YouTube video IDs (the part after watch?v=), once the channel exists.
  videos: [],
  // Empty = the video sections show "Clips coming soon" with an Instagram link.

  // Setup / tech rider on /book/ and the press kit (press-kit/). Rows with an empty value are hidden on /book/;
  // on the press kit they show a [NEEDS] placeholder on screen and "Ask us" when printed. `need` = the placeholder hint.
  // Still needed from Jeff: stage size (e.g. "About 15 x 10 ft"), power (outlets / circuits),
  // load-in time (e.g. "60 min before start"), sets (count + length, e.g. "2 or 3 sets, flexible").
  rider: [
    { label: "PA and sound", value: "We bring our own" },
    { label: "Stage space", value: "Flexible. We just need room for five" },
    { label: "Power", value: "At least 2 to 3 outlets" },
    { label: "Load-in", value: "About 90 minutes before start" },
    { label: "Set length", value: "Up to 3.5 hours, or shorter if you need" },
  ],

  // Stage plot note on the press kit. Empty = [NEEDS] placeholder on screen, left off when printed.
  stagePlotNote: "Shown from the audience. Drums center back with bass next to them, vocals front center, a guitar on each side, PA at the front corners.",

  // Press kit: the printable page (Print > Save as PDF makes the PDF). Empty = the button stays hidden.
  pressKitUrl: "press-kit/",
};
