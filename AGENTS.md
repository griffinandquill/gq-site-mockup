# Griffin & Quill site — agent rules

This file is the single source of rules for every agent (Cursor, Grok Build, others). Do not copy these rules into `.cursor/rules` or the README. Point here.

This repo is the public marketing site for Griffin & Quill LLC. It is a review mockup at https://www.griffinandquill.com, not a launch.

## Stack

- Plain static HTML, CSS, and the existing `js/main.js`.
- No build step. No framework. No bundler. No package that the published pages depend on.
- No analytics. No cookies. No third-party scripts except the Google Fonts already on the pages.
- JavaScript only opens the mobile menu and shows a thank-you note on forms. Forms do not send anywhere.
- Game links, when they exist, point at `play.griffinandquill.com`. Never embed game code here.

`npm` is only for the Playwright verify suite. It is not a site build.

## Launch and content

- Keep `noindex` on every page and keep `robots.txt` disallowing all crawlers until Ryan says to launch.
- Do not add real names, school or employer names, or bios until Ryan approves the text.
- Do not name the mascot on the site until the trademark check is finished.
- Tutoring prices, TPT links, the free sample, testimonials, game teasers, and `hello@griffinandquill.com` are placeholders. Do not treat them as live facts.
- Privacy and Terms stay marked as drafts pending attorney review.
- Do not add a street address or phone number.

## Art

AI art may ship. Brand art — the gryphon mascot and the logo — gets a hand-edited pass first. Do not drop raw generated art into the header, footer, or mascot boxes.

Brand colors: navy `#1F2A44`, gold `#B8860B`, cream `#FAF6EA`, charcoal `#2B2B2B`, burgundy `#7A2E2E`. Gold is for borders, shadows, and the History planet, not for text.

## Checks

Run `npm run verify` before every push. Leave `BASE_URL` unset so the suite drives the local server on port 4173.

```bash
npm ci
npx playwright install chromium
npm run verify
```

Never edit HTML, `css/`, or `js/` just to make a check pass. If a check fails, fix the check or the real defect.

The visitor-check playbook is `.cursor/skills/verify-griffin-quill`. Keep that skill working.

## Git and secrets

- Never merge a pull request. Never push to `main`. Open a PR and stop.
- Never commit secrets, tokens, or `.env` files.
- Do not change GitHub repo settings, rulesets, or Pages config from an agent run.

## Cursor notes

Read this file first. The always-on rule at `.cursor/rules/gq-site.mdc` only points here and names `npm run verify`. Cloud Agents install with `.cursor/environment.json` (`npm ci` and Playwright Chromium).
