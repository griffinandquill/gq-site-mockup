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

Merriweather and Lato are self-hosted in `fonts/`. `fonts/OFL.txt` is the SIL Open Font License 1.1 text with the copyright lines from those files, and `fonts/NOTICE.txt` lists each file's name-table version. Offline, the pages fall back to Georgia and Arial. There is no third-party font request.

## Pages

| Page | File |
| --- | --- |
| Home | `index.html` |
| Tutoring | `tutoring.html` |
| Store | `store.html` (`resources.html` redirects here) |
| Quillhaven | `worlds.html` |
| Families and co-ops | `schools.html` |
| About | `about.html` |
| Contact | `contact.html` |
| FAQ | `faq.html` |
| Privacy Policy (draft) | `privacy.html` |
| Terms of Use (draft) | `terms.html` |
| 404 | `404.html` |

Shared files: `css/styles.css`, `js/main.js`, `js/form-config.js`, `fonts/`, `assets/`, `favicon.svg`, `favicon.ico`, `robots.txt`, `sitemap.xml`.

JavaScript opens the mobile menu, sends a form when FormSubmit accepts it, reveals sections on scroll, and redraws the sample story chart on the home page. The chart path draw is skipped when the browser asks for reduced motion. The chart is a fixed sample, not Quillhaven Forge.

## Placeholders that need real content

- **Wordmark.** This preview uses the words Griffin & Quill in the header and footer. The illustrated gryphon mark is not shown. Favicon, apple touch icon, manifest icons, and `assets/og.png` are a text G&Q monogram on navy for this preview. The old gryphon logo SVGs were removed from the deployed tree; originals are in git history and the brand files in Drive.
- **Home chart.** The home page is the Concept B worktable: editorial copy on the left, `assets/worktable.jpg` on the right, and a sample branching chart in `js/chart.js`. The picture has no labels. Choices, the story, the skill line, and the reset control are HTML. The sample practises one named skill (using map evidence to make an inference), shows the whole route map faintly, and places each choice beside its star. It sends nothing, stores nothing, and is not the Forge product.
- **Quillhaven.** `worlds.html` explains gamified academic skill practice. A demo is planned for December 2, 2026. The current rebuild is TypeScript and Phaser 4. Forge is a simulation maker (topic plus academic skill, fixed templates, an adult approves) with an MVP planned for spring 2027. Command Center is a planned progress hub and is not live. The page uses the same dark library mood as the home page. There is no mark placeholder; the Quillhaven mark is added when real art exists. The old sprite and plaza files were removed from the deployed tree.
- **Founder bio.** The About page names Ryan Mayer as a South Carolina licensed, ESOL-licensed teacher, the courses he teaches, prior teaching in New York, more than seven years in the classroom, and a Master’s in History Education. There is no founder photo on the page. Ryan can supply one.
- **Pricing.** One-to-one tutoring is $40 per hour online and $50 per hour in person. Booking starts on `tutoring.html#book`. Wyzant stays as a text link under that form. Payment is not taken on this site. Stripe is not linked from the page.
- **Store.** `store.html` lists classroom units and simulations from `data/store.json`. Griffin & Quill is a Teachers Pay Teachers Exclusive Seller, so Buy on TPT opens that product in a new tab. Visit our TPT store still opens `https://www.teacherspayteachers.com/store/griffin-quill`. This site does not take payment. The live units, in order, are Colonial America ($36), American Revolution & Constitution ($40), The Constitution and Its 27 Amendments: Your Rights, Your Life ($48), The Early Republic, 1789-1815 ($28), Expansion & Sectionalism, 1803-1860 ($40), Civil War & Reconstruction ($40), Gilded Age, 1865-1900 ($40), Populism, Progressives & Imperialism, 1877-1917 ($40), World War I ($36), Roaring Twenties, Depression & New Deal, 1920-1941 ($40), World War II ($36), Cold War and the Postwar Boom, 1945-1968 ($36), Civil Rights and Social Movements, 1945-1980 ($40), and Modern America: Late Cold War to Today, 1968-present ($36). Each is U.S. History for grades 9-12, and each Buy link is that product page. Subjects with no units say they are coming soon and link to that TPT store. `resources.html` redirects to the store.
- **Email.** Public mail uses these Google Workspace aliases. `hello@griffinandquill.com` is general contact, the newsletter, the Quillhaven note, and every footer. `tutoring@griffinandquill.com` is tutoring booking and inquiries. `support@griffinandquill.com` is store and Quillhaven help. `privacy@griffinandquill.com` is the privacy-policy contact. `partners@griffinandquill.com` is partnerships, press, and the families note. X is `@griffinandquill`. There is no street address and no phone number on purpose.
- **Legal pages.** Privacy and Terms show the banner "Draft placeholder, pending attorney review." The privacy page states that Quillhaven collects only what teachers need, never sells it, and has no ads or trackers. A lawyer still has to review both pages.
- **Motion.** Scroll reveal runs only when the visitor has not asked for reduced motion. The sample chart draws its new path with a short stroke transition, and that transition is skipped under reduced motion. There is no autoplay audio and no forced intro.
- **Forms.** `js/form-config.js` holds the FormSubmit endpoint and the three inboxes. Contact, both newsletters, and the Quillhaven note go to `hello@`. The families and co-ops inquiry goes to `partners@`. The tutoring booking form on `tutoring.html#book` goes only to `tutoring@griffinandquill.com`. Each form has a honeypot named `_honey`. The thank-you note appears only when FormSubmit returns success. A failed send shows the mailto for that inbox. The visitor check intercepts `formsubmit.co` and does not send a real message. The first real submission to each inbox asks FormSubmit to email a confirmation link. Ryan opens `hello@`, `tutoring@`, and `partners@` and confirms those three messages. Until then, a real submit shows “That note did not send.”
- **Search engines.** Pages do not send `noindex`. `robots.txt` allows crawling and names `https://www.griffinandquill.com/sitemap.xml`.
- **Fonts.** The pages load the four WOFF2 files in `fonts/`. Lato Regular and Lato Bold are version 1.104, copyright 2010-2011, tyPoland Lukasz Dziedzic, reserved name "Lato". The Merriweather files are Merriweather Light 18pt Regular version 2.100 and Italic version 2.101, copyright 2024, The Merriweather Project Authors (https://github.com/EbenSorkin/Merriweather4), reserved name "Merriweather". Those strings are the name tables of the shipped files. The license is `fonts/OFL.txt`.

## Brand

- Navy `#1F2A44`, gold `#B8860B`, cream `#FAF6EA`, charcoal `#2B2B2B`, burgundy `#7A2E2E`.
- Gold is used for rules, the quill, and large bold tagline text on navy. It is not used for small text, or for any text on cream, because gold on cream does not pass WCAG AA.
- Titles: Merriweather. Body: Lato.
