---
name: verify-griffin-quill
description: "Drive the Griffin & Quill static mockup the way a visitor does, locally or at BASE_URL. Use when checking pages, navigation, forms, the FAQ, the mockup guard, or the GitHub Pages publish set."
disable-model-invocation: true
---

# Verify Griffin & Quill

The site is static HTML. `verify/catalog.mjs` lists the pages and forms. `npm run verify` drives them in Chromium. Do not edit `*.html`, `css/`, or `js/` to make a check pass.

## Launch

From the repo root, once per machine:

```bash
npm ci
npx playwright install chromium
```

Start a local run:

```bash
npm run verify
```

Playwright starts `node verify/server.mjs` on `http://127.0.0.1:4173` and stops that process when the run ends. The server is ready when `http://127.0.0.1:4173/` returns 200. It serves the same file set as `verify/stage.mjs`, and an unknown path returns `404.html` with status 404.

Check the live site with the same command. No local server starts.

```bash
BASE_URL=https://www.griffinandquill.com npm run verify
```

`BASE_URL` is an origin with no path. Two runs at once both want port 4173. Run one local verify at a time. A live `BASE_URL` can run beside a local one because it does not bind that port.

## Doctor

Doctor answers whether this origin is worth driving. It fetches `/` and `/robots.txt`. It does not open a browser. When `BASE_URL` is unset, doctor starts `verify/server.mjs` and kills that child before it exits.

```bash
npm run verify:doctor
BASE_URL=https://www.griffinandquill.com npm run verify:doctor
```

A healthy local doctor prints `doctor ok http://127.0.0.1:4173`. A healthy live doctor prints `doctor ok https://www.griffinandquill.com`. Anything else means stop. Do not drive a server you did not start, and do not point `BASE_URL` at a different site.

## Drive

Read `features/README.md`, then the feature file. Prefer `getByRole` and `getByLabel` inside `#site-nav`, a form section, or a product card. The catalog is the list of pages and forms. Add a row there when a page or form is added. `tests/visitor.spec.ts` fails if a root `*.html` file is missing from the catalog.

Run one feature while you are debugging:

```bash
npm run verify -- --grep "faq questions"
npm run verify -- --grep "form stays"
```

The visitor checks cover every page at 1280 and 390, the menu at 390, 1000, 1001, and 1280, each mockup form, the FAQ, one placeholder link, axe serious and critical impacts, `robots.txt`, and `/not-a-page`. The open menu covers the page heading. An outside click in the check uses the mockup bar.

## Evidence

The HTML report is `verify-results/report/index.html`. Open it with `npm run verify:report`. A passing run also writes `verify-results/menu-open.png` and `verify-results/form-thanks.png`. Failed tests keep a trace and a screenshot under `verify-results/output/`.

Record the command, the origin, and the feature id with the report. A screenshot of the report index is the proof a person can read. The menu screenshot shows the open mobile menu. The form screenshot shows the thank-you note on the contact form.

## Cleanup

A local `npm run verify` stops the server Playwright started. Doctor kills the server it spawned. Do not kill every `node` process. If a server is still listening because the run was interrupted, stop the pid that is bound to `127.0.0.1:4173` and leave `verify-results/` in place.

```bash
fuser -k 4173/tcp
```

Cleanup does not delete `verify-results/`. Those files are the proof.

## Helpers

`node verify/stage.mjs` copies root HTML, `css/`, `js/`, `favicon.svg`, `robots.txt`, and `.nojekyll` into `_site`. HTML and CSS gain `?v=` plus the short git commit on stylesheet, script, and sprite URLs. Every other file is copied byte for byte. The Pages workflow runs that command and uploads `_site`. `node verify/server.mjs` rewrites those same URLs when it serves a page. `_site` is not the proof directory. Delete `_site` when you want a clean tree. The next stage recreates it.

`node verify/server.mjs` is the local site. Prefer `npm run verify` so the process is tied to the run. Use the server command only when doctor or a manual browser needs it. Stop it with Ctrl-C, which is the foreground process you started.
