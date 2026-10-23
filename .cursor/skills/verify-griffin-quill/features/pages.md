# Pages, links, and the missing page

A visitor can open every page, follow its links, and see a not-found page for a bad address. Each page has a title. Serious and critical axe violations fail the run.

## Sub-features

- `page-load` opens each HTML file at desktop and mobile width and reads the title.
- `page-links` requests same-origin links and assets and checks fragment ids.
- `page-axe` fails when axe reports a serious or critical violation.
- `page-missing` opens `/not-a-page` and expects status 404 with the not-found heading.

## How to get to it (user POV)

- Open `/` or any `*.html` file from the header, the footer, or the address bar.
- Follow a same-origin link, including a link that ends in a hash.
- Type a path that is not a page, such as `/not-a-page`.

## Driving it with Playwright

Preconditions:

- Doctor printed `doctor ok` for this origin.
- `verify/catalog.mjs` lists every root HTML file.

- **Open a page.** Visit `tutoring.html`. The test `tutoring.html loads at desktop` goes to `/tutoring.html`, expects status 200, and expects the title `Griffin & Quill | Where learning becomes an adventure`.
- **Check assets.** Run `npm run verify -- --grep "internal links"`. Same-origin stylesheets, scripts, icons, and links answer below 400. `href="#"` is skipped. `mailto:` is skipped.
- **Check axe.** Each page-load test runs axe and expects no serious or critical violation ids.
- **Miss a page.** Run `npm run verify -- --grep "bad path"`. `/not-a-page` returns status 404, the title `Griffin & Quill | Where learning becomes an adventure`, and the heading `This page is not on the site.`
- **Proof.** Open `verify-results/report/index.html`. The page-load rows are green, and the report names the title assertion.

## Gotchas

- Python's `http.server` does not return `404.html` for a bad path. Use `npm run verify`, which starts `verify/server.mjs`.
- A nested miss such as `/a/b` breaks relative assets in `404.html`. The check uses the top-level path `/not-a-page` only.
- Chromium logs a 404 console line for the missing document. That line is ignored on the 404 test. Other console errors still fail.
- Header and footer repeat link names. The current-page check looks only at `#site-nav`.
- On the live site, Cloudflare rewrites `mailto:` and may inject its own script. Assert after `load`. Do not compare the live HTML bytes with the repo.
