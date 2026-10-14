# AGENTS.md

Team rules for the Griffin & Quill site mockup. They do not replace the README or `.cursor/skills/verify-griffin-quill/SKILL.md`. Those still say how the pages and the visitor check work.

## Kid-safety first

The kids' games are designed to collect no personal data. Do not add accounts, names, chat, analytics, cookies, or stored student data to this site in order to ship a feature.

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

## AI art

Do not drop AI art into the logo or the mascot. Those slots stay "coming soon" until a person delivers the mark. The gryphon-and-quill mark is with a human artist. Do not name the mascot until the trademark check in the README is finished.

AI art that Griffin & Quill will ship and own needs a hand-edited pass first. Raw model output is not the asset. The Option 4 logo is not in this repo. It goes on the site when the designer delivers it.
