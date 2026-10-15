# AGENTS.md

Team rules for the Griffin & Quill site mockup. They do not replace the README or `.cursor/skills/verify-griffin-quill/SKILL.md`. Those still say how the pages and the visitor check work.

## Kid-safety first

Public copy says Quillhaven collects only what teachers need, never sells it, and has no ads or trackers. Do not add accounts, names, chat, analytics, cookies, or stored student data to this site in order to ship a feature.

The privacy and terms pages are drafts pending attorney review. The privacy page says an attorney still has to review them before any game is offered to children, including children under 13. This rule does not close that review.

Pages for teachers, parents, schools, and grant reviewers may describe the product. The mockup forms are not connected. Wiring them up is a separate decision.

## Chromebook performance

Quillhaven and the portal games have to run on school Chromebooks. This static site is not that runtime. Do not treat `npm run verify` here as a Chromebook test. Numeric budgets belong with the game hub.

## Verify before merging

`npm run verify` must exit 0 on the commit being merged. Put the output on the pull request.

The command is Playwright against the static pages. Setup and the doctor check are in the README. If the home page or `robots.txt` looks wrong, run `npm run verify:doctor` first and stop unless it prints `doctor ok`.

The Pages workflow on `main` only stages files and deploys. It does not run verify, and a deploy is not a substitute.

## Two-round fix cap

Fixes to the same build are replies on that build. After two fix rounds, stop and check before any further fix. The game-hub rules name Ryan for that check. A new page or a new feature starts its own count. The cap does not waive verify.

## AI art and brand

The final Griffin & Quill logo (Option 4: navy, cream gryphon, gold quill) is in the site. Use the repo's logo and icon files; do not redraw or recolor them. Quillhaven's pixel-art logo is still coming, so keep its slot on the Quillhaven page.

The mascot gryphon is Tahne, founder of Quillhaven. Other characters: Winston Wolf, Merlin (wizard portal keeper), Professor Bramble (highland cow librarian), and the student kids Brittany, Ruth and Rudy. Character and building sprites come from the Quillhaven Pixel Assets in Drive; render them with `image-rendering: pixelated` at integer scales, and align sprites by their opaque bottom edge, not their canvas.

AI art that Griffin & Quill will ship needs a hand-edited pass first. Do not invent testimonials, stats, or reviews.

Official tagline: "Write your own legend. Learn it. Live it. PROVE IT!" Secondary line: "Where learning becomes an adventure." "An Edtech Company" is a descriptor only.

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
