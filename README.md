# Griffin & Quill

Design mockup for Griffin & Quill LLC, a new South Carolina edtech studio. This is a review site for the owner. It is not a launch. The mockup is published at https://www.griffinandquill.com and stays noindex until you say to launch.

Plain static HTML, CSS, and a small JavaScript file. No framework, no analytics, no cookies, and no third-party scripts. GitHub Pages runs `node verify/stage.mjs` before upload. That step, and the local verify server, add `?v=` plus the short git commit to every stylesheet, script, and sprite URL so a deploy is not stuck on a cached `styles.css`.

## Preview locally

From this folder:

```bash
python3 -m http.server 8742
```

Open [http://127.0.0.1:8742](http://127.0.0.1:8742).

`404.html` is the page GitHub Pages and Cloudflare Pages show for unknown URLs. Python's `http.server` does not do that, so open [http://127.0.0.1:8742/404.html](http://127.0.0.1:8742/404.html) to review it.

## Check the mockup

QA runs one command. It opens the pages in Chromium, uses the menu, submits the forms, and checks the mockup banner, `noindex`, and `robots.txt`.

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

Shared files: `css/styles.css`, `js/main.js`, `js/products.js`, `fonts/`, `assets/`, `favicon.svg`.

JavaScript opens the mobile menu, shows a thank-you note on forms, reveals sections on scroll, types the home tagline, and shifts the Quillhaven panorama. Forms do not send anywhere. Motion is skipped when the browser asks for reduced motion.

## Placeholders that need real content

- **Logo.** Header and footer use the final griffin-and-quill icon (`assets/logo-icon.svg`): white gryphon, gold quill, navy field. The home hero uses `assets/logo-hero.svg`, the same paths with that navy plate removed, so the hero gradient shows through. Favicon files in `/assets/icons/` are the designer’s web set (`favicon.ico`, `favicon-32.png`, `apple-touch-icon-180.png`). `site.webmanifest` points at the icons that ship with this mockup.
- **Quillhaven art.** The Quillhaven page reserves a note for a pixel-art town logo. The hero is a pre-composed dusk panorama (`tools/compose-panorama.py` writes `img/quillhaven/sky.png`, `far.png`, and `town.png` at 640×256). The page shows those layers at 2× with pixelated scaling, and narrow screens pan across that same picture. Professor Bramble, Tahne, Merlin, and Winston Wolf walk the sidewalk and pause to breathe or talk, and Brittany, Ruth, and Rudy wander with them. Reduced motion leaves everyone standing. `tools/build-scene-sprites.py` builds the adult sheets from the frame export, and `tools/build-kid-sprites.py` builds Brittany, Ruth, and Rudy. Both line every frame up on its opaque foot. The open sky above the academy is left clear for the pixel-art town logo. The town map still uses the building sprites in `img/buildings/` at 2× (256px, 192px, and 128px), with each sprite’s foot padding pulled down onto its plot. Tahne, Merlin, Winston Wolf, Brittany, Ruth, and Rudy use the pixel sprites in `img/characters/`. Adults render at 128px (2× a 64px canvas) and the kids at 96px (2× a 48px canvas), standing on a ground line in their cards.
- **Founder bio.** The About page names Ryan Mayer as a South Carolina high school social studies teacher, the four social studies courses, more than seven years of teaching, and a Master’s in History Education. It does not name a school or a district. A photo and any longer bio are still open.
- **Pricing.** Tutoring rates match the Stripe test products and are shown as published prices. Checkout links are Stripe test-mode payment links. They do not charge a live card. Shop prices are still samples.
- **TPT links.** "View on TPT" and "Follow our TPT store" use `href="#"`. The TPT store name and URL are still open. Product cards are sample titles for the layout, not a catalog.
- **Free sample.** The Resources callout is a placeholder until a real freebie exists on TPT.
- **Email.** Public mail uses these Google Workspace aliases. `hello@griffinandquill.com` is general contact, including every footer and the terms-draft questions. `tutoring@griffinandquill.com` is tutoring booking and inquiries. `support@griffinandquill.com` is shop and Quillhaven help. `privacy@griffinandquill.com` is the privacy-policy contact. `partners@griffinandquill.com` is partnerships and press. X is `@griffinandquill`. There is no street address and no phone number on purpose. Forms still do not send.
- **Legal pages.** Privacy and Terms show the banner "Draft placeholder, pending attorney review." The privacy page states that Quillhaven collects only what teachers need, never sells it, and has no ads or trackers. A lawyer still has to review both pages.
- **Quillhaven.** Quillhaven Academy has four subject portals, each leading to a hub: History & Social Studies (live first, with the game Mending the Charter), Science, Math, and English/ELA. Science, Math, and English/ELA are coming soon. Games live inside each hub. The demo stays unloaded until the visitor presses play.
- **Testimonials.** The home strip is labeled as empty placeholder slots. They are not reviews.
- **Stripe.** Each tutoring package links to its Stripe test-mode payment link. Test mode does not charge a live card. Swap those URLs for live payment links before a public launch.
- **Motion.** Scroll reveal, a typewriter tagline, ink underlines, card lifts, a Quillhaven parallax panorama (townsfolk walk the sidewalk, pause, and stop to talk, plus lantern and window flicker, fireflies, and drifting clouds), a map reveal, and a short page fade run only when the visitor has not asked for reduced motion. The panorama motion pauses while that scene is offscreen. On the home page, the small pixel gryphon under the logo flies a slow curve around the viewport and rests while the tab is hidden. Reduced motion parks it under the logo. There is no wing-flap sheet for that sprite. They are CSS and a few lines of vanilla JS.
- **Forms.** Consult, newsletter, waitlist, schools inquiry, and contact all stop on the page with "Thanks! (mockup: form not connected)". Wire them up only on the real site.
- **Search engines.** Pages send `noindex`, and `robots.txt` disallows everything. Remove both before any public launch.
- **Fonts.** Merriweather and Lato ship with the site. A later pass can still change the type if Ryan wants a different pair.

## Brand

- Navy `#1F2A44`, gold `#B8860B`, cream `#FAF6EA`, charcoal `#2B2B2B`, burgundy `#7A2E2E`.
- Gold is used for rules, the quill, and large bold tagline text on navy. It is not used for small text, or for any text on cream, because gold on cream does not pass WCAG AA.
- Titles: Merriweather. Body: Lato.
