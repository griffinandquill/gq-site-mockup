# Griffin & Quill

Griffin & Quill LLC is a South Carolina edtech studio. The site is published at https://www.griffinandquill.com. Search engines may crawl it. `robots.txt` allows the site and points at `sitemap.xml`.

Plain static HTML, CSS, and a small JavaScript file. No framework, no analytics, no cookies, and no third-party scripts. GitHub Pages runs `node verify/stage.mjs` before upload. That step, and the local verify server, add `?v=` plus the short git commit to every stylesheet, script, and sprite URL so a deploy is not stuck on a cached `styles.css`.

## Preview locally

From this folder:

```bash
python3 -m http.server 8742
```

Open [http://127.0.0.1:8742](http://127.0.0.1:8742).

`404.html` is the page GitHub Pages and Cloudflare Pages show for unknown URLs. Python's `http.server` does not do that, so open [http://127.0.0.1:8742/404.html](http://127.0.0.1:8742/404.html) to review it.

## Check the site

QA runs one command. It opens the pages in Chromium, uses the menu, submits the forms against a blocked FormSubmit request, and checks `robots.txt`, the sitemap, and the share tags.

Install once from this folder:

```bash
npm ci
npx playwright install chromium
```

Check a local copy:

```bash
npm run verify
```

Check the published site:

```bash
BASE_URL=https://www.griffinandquill.com npm run verify
```

A passing run prints green tests and writes `verify-results/report/index.html`. Open that report with `npm run verify:report`. If the home page or `robots.txt` looks wrong before you spend a browser run, use `npm run verify:doctor`.

The local checker is not `python3 -m http.server`. Python does not serve `404.html` for a bad path. `npm run verify` starts its own server on port 4173 and stops it when the run finishes. Leave `BASE_URL` unset for that local server. Set `BASE_URL` only when you mean the live origin.

Merriweather and Lato are self-hosted in `fonts/`. Offline, the pages fall back to Georgia and Arial. There is no third-party font request.

## Pages

| Page | File |
| --- | --- |
| Home | `index.html` |
| Tutoring | `tutoring.html` |
| Shop (TPT resources) | `resources.html` |
| Quillhaven | `worlds.html` |
| For schools and districts | `schools.html` |
| About | `about.html` |
| Contact | `contact.html` |
| FAQ | `faq.html` |
| Privacy Policy (draft) | `privacy.html` |
| Terms of Use (draft) | `terms.html` |
| 404 | `404.html` |

Shared files: `css/styles.css`, `js/main.js`, `js/form-config.js`, `fonts/`, `assets/`, `favicon.svg`, `favicon.ico`, `robots.txt`, `sitemap.xml`.

JavaScript opens the mobile menu, sends a form when FormSubmit accepts it, reveals sections on scroll, types the home tagline, and shifts the Quillhaven panorama. Motion is skipped when the browser asks for reduced motion.

## Placeholders that need real content

- **Logo.** Header and footer use the final griffin-and-quill icon (`assets/logo-icon.svg`): white gryphon, gold quill, navy field. The home hero uses `assets/logo-hero.svg`, the same paths with that navy plate removed, so the hero gradient shows through. Favicon files in `/assets/icons/` are the designer’s web set (`favicon.ico`, `favicon-32.png`, `apple-touch-icon-180.png`). `site.webmanifest` points at those icons. `/favicon.ico` at the site root is the same file.
- **Quillhaven art.** The hero is a pre-composed dusk panorama (`tools/compose-panorama.py` writes `img/quillhaven/sky.png`, `far.png`, and `town.png` at 640×256). The page shows those layers at 2× with pixelated scaling, and narrow screens pan across that same picture. Professor Bramble, Tahne, Merlin, and Winston Wolf walk the sidewalk and pause to breathe or talk, and Brittany, Ruth, and Rudy wander with them. Reduced motion leaves everyone standing. `tools/build-scene-sprites.py` builds the adult sheets from the frame export, and `tools/build-kid-sprites.py` builds Brittany, Ruth, and Rudy. Both line every frame up on its opaque foot. The town map uses the building sprites in `img/buildings/` at 2× (256px, 192px, and 128px), with each sprite’s foot padding pulled down onto its plot. The Library plot uses one frame of `img/quillhaven/sprites/bramble-idle.png` because there is no library building file. Tahne, Merlin, Winston Wolf, Brittany, Ruth, and Rudy use the pixel sprites in `img/characters/`. Adults render at 128px (2× a 64px canvas) and the kids at 96px (2× a 48px canvas), standing on a ground line in their cards.
- **Founder bio.** The About page names Ryan Mayer as a South Carolina high school social studies teacher, the four social studies courses, more than seven years of teaching, and a Master’s in History Education. It does not name a school or a district. There is no founder photo on the page. Ryan can supply one.
- **Pricing.** Tutoring rates are the published prices. Each package offers Request a session, which jumps to the consult form. Payment is not taken on this site. Stripe stays in test mode and is not linked from the page.
- **Shop.** The shop page is one “Coming to Teachers Pay Teachers” note plus a newsletter form. There is no store link and no sample catalog.
- **Email.** Public mail uses these Google Workspace aliases. `hello@griffinandquill.com` is general contact, the newsletter, the Quillhaven note, and every footer. `tutoring@griffinandquill.com` is tutoring booking and inquiries. `support@griffinandquill.com` is shop and Quillhaven help. `privacy@griffinandquill.com` is the privacy-policy contact. `partners@griffinandquill.com` is partnerships, press, and the school inquiry. X is `@griffinandquill`. There is no street address and no phone number on purpose.
- **Legal pages.** Privacy and Terms show the banner "Draft placeholder, pending attorney review." The privacy page states that Quillhaven collects only what teachers need, never sells it, and has no ads or trackers. A lawyer still has to review both pages.
- **Quillhaven.** Quillhaven Academy has four subject portals, each leading to a hub: History & Social Studies (live first, with the game Mending the Charter), Science, Math, and English/ELA. Science, Math, and English/ELA are coming soon. Games live inside each hub. The demo stays unloaded until the visitor presses play.
- **Motion.** Scroll reveal, a typewriter tagline, ink underlines, card lifts, a Quillhaven parallax panorama (townsfolk walk the sidewalk, pause, and stop to talk, plus lantern and window flicker, fireflies, and drifting clouds), a map reveal, and a short page fade run only when the visitor has not asked for reduced motion. The panorama motion pauses while that scene is offscreen. On the home page, the small pixel gryphon under the logo flies a slow curve around the viewport and rests while the tab is hidden. Reduced motion parks it under the logo. There is no wing-flap sheet for that sprite. They are CSS and a few lines of vanilla JS.
- **Forms.** `js/form-config.js` holds the FormSubmit endpoint and the three inboxes. Contact, both newsletters, and the Quillhaven note go to `hello@`. The tutoring consult goes to `tutoring@`. The school inquiry goes to `partners@`. Each form has a honeypot named `_honey`. The thank-you note appears only when FormSubmit returns success. A failed send shows the mailto for that inbox. The visitor check intercepts `formsubmit.co` and does not send a real message. The first real submission to each inbox asks FormSubmit to email a confirmation link. Ryan opens `hello@`, `tutoring@`, and `partners@` and confirms those three messages. Until then, a real submit shows “That note did not send.”
- **Search engines.** Pages do not send `noindex`. `robots.txt` allows crawling and names `https://www.griffinandquill.com/sitemap.xml`.
- **Fonts.** Merriweather and Lato ship with the site. A later pass can still change the type if Ryan wants a different pair.

## Brand

- Navy `#1F2A44`, gold `#B8860B`, cream `#FAF6EA`, charcoal `#2B2B2B`, burgundy `#7A2E2E`.
- Gold is used for rules, the quill, and large bold tagline text on navy. It is not used for small text, or for any text on cream, because gold on cream does not pass WCAG AA.
- Titles: Merriweather. Body: Lato.
