# AGENTS.md

Team rules for the Griffin & Quill site. They do not replace the README or `.cursor/skills/verify-griffin-quill/SKILL.md`. Those still say how the pages and the visitor check work.

## Kid-safety first

Public copy says Quillhaven collects only what teachers need, never sells it, and has no ads or trackers. Do not add accounts, names, chat, analytics, cookies, or stored student data to this site in order to ship a feature.

The privacy and terms pages are drafts pending attorney review. The privacy page says an attorney still has to review them before any game is offered to children, including children under 13. This rule does not close that review.

Pages for teachers, parents, schools, and grant reviewers may describe the product. Marketing forms post to FormSubmit through `js/form-config.js`. Do not put a secret in the repo. Do not show a thank-you unless that request returns success. The first real note to each inbox still needs the owner to confirm FormSubmit’s activation email.

## Chromebook performance

Quillhaven and the portal games have to run on school Chromebooks. This static site is not that runtime. Do not treat `npm run verify` here as a Chromebook test. Numeric budgets belong with the game hub.

## Verify before merging

`npm run verify` must exit 0 on the commit being merged. Put the output on the pull request.

The command is Playwright against the static pages. Setup and the doctor check are in the README. If the home page or `robots.txt` looks wrong, run `npm run verify:doctor` first and stop unless it prints `doctor ok`.

The Pages workflow on `main` only stages files and deploys. It does not run verify, and a deploy is not a substitute.

## Two-round fix cap

Fixes to the same build are replies on that build. After two fix rounds, stop and check before any further fix. The game-hub rules name Ryan for that check. A new page or a new feature starts its own count. The cap does not waive verify.

## AI art and brand

Design direction is Concept B, the scholar's worktable: a cinematic, warm, lamplit academy/library mood across the whole site, with modern readable type and plain navigation. Do not revive the Living Plaza Hub (PR #48) or pixel-art town navigation. The website is not a game client; the Quillhaven town is being rebuilt in Tiled for the game, not here.

No gryphon on visitor-facing surfaces until Gryff's design is settled: no gryphon logo, mascot, character art, favicon, app icon, manifest icon or social preview image. Use the text wordmark and the monogram/star-chart icons already in the repo. Do not reintroduce `assets/logo-icon.svg`, `assets/logo-hero.svg` or the old sprite folders into the deployed tree; originals live in git history and the brand files in Drive. Do not show an empty "Quillhaven mark" placeholder; add the mark when real art exists.

Never feed licensed game pack art into AI, and never ship raw pack files or pack vendor filenames in public assets. No fake product screenshots and no AI-generated logos. AI mood art needs Ryan's approval and a hand-edited pass before it ships. Text, buttons, nav and chart controls are real HTML, never baked into an image. Do not invent testimonials, stats, or reviews.

Company line: "Where learning becomes an adventure." The tagline "Write your own legend. Learn it. Live it. PROVE IT!" is used exactly as written on the home hero and the Quillhaven page. "An Edtech Company" is a descriptor only.

The home chart is a fixed local sample that practises one named skill. It sends nothing, stores nothing, and is not Quillhaven Forge or live AI.

## Stack

Plain static HTML, CSS and vanilla JS, with Playwright for verify. No framework or build step without Ryan's OK. Motion stays light (transforms and opacity) and respects `prefers-reduced-motion`.

## Branches and pull requests

- Branch names: `feature/...`, `fix/...`, `art/...`, `chore/...`. One task per branch.
- Every change goes through a pull request into `main`. No direct pushes. `main` must stay deployable.
- Ryan merges. Agents open and update PRs; they do not merge them.

## Brand colors

| Name | Hex |
|---|---|
| Navy | `#1F2A44` |
| Gold | `#B8860B` |
| Cream | `#FAF6EA` |
| Burgundy | `#7A2E2E` |
| Charcoal | `#2B2B2B` |
