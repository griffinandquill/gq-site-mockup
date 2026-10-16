# Griffin & Quill verification map

This directory is the source for visitor checks of the Griffin & Quill site. Read this index, then use the matching feature file.

## Baseline preconditions

- Install with `npm ci` and `npx playwright install chromium`.
- For a local run, leave `BASE_URL` unset. `npm run verify` starts `http://127.0.0.1:4173`.
- For the published site, set `BASE_URL=https://www.griffinandquill.com`.
- Run `npm run verify:doctor` and require the `doctor ok` line for that origin.
- Drive only the server this run started, or the `BASE_URL` you set. Do not attach to another process on port 4173.

## Driving conventions

- Start each recipe from the top of a page unless it names another state.
- Prefer `getByRole` and `getByLabel`. Scope header links to `#site-nav`.
- Treat commands as literal.
- Run the suite with `npm run verify`. Narrow it with `--grep`.
- Keep `verify-results/` after the run. Cleanup stops the server and leaves the report.

## Proof and skip reporting

- Show the action and the resulting state, not only the last screen.
- The report at `verify-results/report/index.html` is the run record.
- `verify-results/menu-open.png` and `verify-results/form-thanks.png` are the two saved screens.
- Name the feature file and the origin with the report.
- If a path cannot be reached, record the command and the unmet precondition.
- Do not call a skipped entry point verified through a different path.

## Feature entry contract

Each feature file starts with an H1 and one paragraph. It then uses these four H2 headings in order.

1. `Sub-features`
2. `How to get to it (user POV)`
3. `Driving it with Playwright`
4. `Gotchas`

## Features

- [Pages, links, and the missing page](./pages.md) covers load, title, assets, axe, and the 404 page.
- [Navigation](./navigation.md) covers the header at desktop width and the mobile menu.
- [Crawl and share tags](./mockup-guard.md) covers `robots.txt`, the sitemap, and the share tags.
- [Forms](./forms.md) covers the six forms that stay on the page.
- [FAQ and the shop note](./interactions.md) covers the questions and the Teachers Pay Teachers section.
