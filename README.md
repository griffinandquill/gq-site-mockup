# Griffin & Quill

Design mockup for Griffin & Quill LLC, a new South Carolina edtech studio. This is a review site for the owner. It is not a launch. The mockup is published at https://www.griffinandquill.com and stays noindex until you say to launch.

Plain static HTML, CSS, and a small JavaScript file. No build step, no framework, no analytics, no cookies, and no third-party scripts. It can be published as-is on GitHub Pages or Cloudflare Pages by serving this folder.

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

JavaScript only opens the mobile menu and shows a thank-you note on forms. Forms do not send anywhere.

## Placeholders that need real content

- **Logo.** Header, footer, and the home hero use an inline SVG labeled as a placeholder. Swap it for the final griffin-and-quill SVG. Favicon link tags point at `/assets/icons/` (`favicon.ico`, `favicon-32.png`, `apple-touch-icon-180.png`, `site.webmanifest`). Those files are placeholders until the real icon set is dropped in.
- **Quillhaven art.** The Quillhaven page reserves a slot for a pixel-art town logo. Tahne, Merlin, and Winston Wolf are named in the brief. The pixel figures on that page are stand-ins, not final character art.
- **Founder bio.** The About page names Ryan Mayer as a social studies teacher at Battery Creek High School and leaves `[Founder bio TBD]` plus a photo slot. Do not invent the longer bio.
- **Pricing.** Every tutoring price is an example. Real rates, session length, and group size are not set.
- **TPT links.** "View on TPT" and "Follow our TPT store" use `href="#"`. Replace them with the live store URLs. Product cards are sample titles for the layout, not a catalog.
- **Free sample.** The Resources callout is a placeholder until a real freebie exists on TPT.
- **Email.** `hello@griffinandquill.com` is the studio contact. There is no street address and no phone number on purpose. Forms still do not send.
- **Legal pages.** Privacy and Terms show the banner "Draft placeholder, pending attorney review." The privacy page states that the kids' games are designed to collect no personal data (COPPA-minded). A lawyer still has to review both pages.
- **Quillhaven.** The town page, academy portals, and the three scene cards (Westward Expansion, Economic Systems, Two Sources) are placeholders. Nothing is playable. The demo button joins the waitlist layout.
- **Testimonials.** The home strip is labeled as empty placeholder slots. They are not reviews.
- **Stripe.** The tutoring “Book tutoring” button is a placeholder link. It does not open a checkout.
- **Forms.** Consult, newsletter, waitlist, schools inquiry, and contact all stop on the page with "Thanks! (mockup: form not connected)". Wire them up only on the real site.
- **Search engines.** Pages send `noindex`, and `robots.txt` disallows everything. Remove both before any public launch.
- **Fonts.** Merriweather and Lato ship with the site. A later pass can still change the type if Ryan wants a different pair.

## Brand

- Navy `#1F2A44`, gold `#B8860B`, cream `#FAF6EA`, charcoal `#2B2B2B`, burgundy `#7A2E2E`.
- Gold is used for rules, the quill, and large bold tagline text on navy. It is not used for small text, or for any text on cream, because gold on cream does not pass WCAG AA.
- Titles: Merriweather. Body: Lato.
