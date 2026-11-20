// =============================================================
// SIX TO MIDNIGHT · site settings
// Everything the band might change lives here. Edit, save, push.
// =============================================================
window.STM = {
  // Full public address of the site, ending in "/" (e.g. "https://sixtomidnight.com/").
  // Leave empty until it's published. When set, pages use it for absolute og:image / og:url links.
  siteUrl: "https://jgruber92.github.io/six-to-midnight/",

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
  gigs: [
    { date: "2027-02-20", venue: "Central Tavern", town: "Milford, MA", time: "", link: "" },
  ],

  // Kept for reference only. Jeff 2026-11-19: do NOT show a venue list or count on the site.
  pastVenues: [
    "Pinz · Milford",
    "Brother's Tavern · Milford",
    "Valley Pub · Whitinsville",
    "Free Play Arcade · Worcester",
  ],

  // Testimonials: real comments from the band's Facebook/Instagram (pulled 2026-11-19).
  // Light cleanup only (typos, profanity). First name + last initial. Family members left out.
  quotes: [
    { text: "What an amazing night last night... Would you like to rebook?", who: "Booking manager", where: "Brother's Tavern, Milford" },
    { text: "Fantastic, tight band. Singer's got some unbelievable chops!", who: "Jorge C.", where: "on Facebook" },
    { text: "You guys kicked ass last night!", who: "Karen J.", where: "after Valley Pub" },
    { text: "Show was amazing.", who: "Damien L.", where: "after Pinz, Milford" },
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
  songRequestAction: "",

  // Booking form. Paste a Formspree (or similar) endpoint here.
  // Empty = the form opens an email to the band inbox instead.
  bookingFormAction: "",

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
    "Bonus: one from the 80s": [
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
  clips: [
    { src: "media/freeplay-arcade-full-band.mp4", poster: "img/video/freeplay-arcade-full-band.jpg", title: "Live at Freeplay Arcade, Worcester", tall: true },
    { src: "media/freeplay-arcade-brandon.mp4", poster: "img/video/freeplay-arcade-brandon.jpg", title: "Brandon up front at Freeplay", tall: true },
  ],
  // Instagram reels shown as buttons in the Watch panels until real clips are added above.
  reels: [
    { label: "Watch our Creep cover", url: "https://www.instagram.com/reel/DS-GY8YDJ-e/" },
    { label: "Watch: I Believe In A Thing Called Love", url: "https://www.instagram.com/reel/DSm3OgvjSZK/" },
    { label: "Watch: Ocean Avenue", url: "https://www.instagram.com/reel/DS3uF0qFUqz/" },
  ],
  // 2) YouTube video IDs (the part after watch?v=), once the channel exists.
  videos: [],
  // Empty = the video sections show "Clips coming soon" with an Instagram link.

  // Setup / tech rider on /book/. Rows with an empty value are hidden on the site.
  // Still needed from Jeff: stage size (e.g. "About 15 x 10 ft"), power (outlets / circuits),
  // load-in time (e.g. "60 min before start"), sets (count + length, e.g. "2 or 3 sets, flexible").
  rider: [
    { label: "PA and sound", value: "We bring our own" },
    { label: "Stage space", value: "" },
    { label: "Power", value: "" },
    { label: "Load-in", value: "" },
    { label: "Sets", value: "" },
  ],

  // Press kit PDF (e.g. "media/six-to-midnight-press-kit.pdf"). Empty = the button stays hidden.
  pressKitUrl: "",
};
