# FAQ and the store

FAQ questions are disclosure widgets. More than one can be open. The store lists units from `data/store.json`. `resources.html` redirects to `store.html`. Checkout is on Teachers Pay Teachers.

## Sub-features

- `faq-open` opens two questions on the FAQ page and leaves both open.
- `faq-tutoring` opens the first tutoring question on the tutoring page.
- `store-board` opens each subject, searches, and opens the World War I card.

## How to get to it (user POV)

- Open FAQ and choose a question summary.
- Open Tutoring and choose a question under Tutoring questions.
- Open Store (`store.html`). Choose a subject, search, or switch Units and Simulations. The old address `resources.html` opens the store.

## Driving it with Playwright

Preconditions:

- Doctor printed `doctor ok` for this origin.
- The FAQ page has at least two `details.faq` elements.

- **Open two questions.** Run `npm run verify -- --grep "faq questions"`. The test clicks the first two summaries on `/faq.html`. Both `details` elements have `open` true, and both `.answer` blocks are visible.
- **Open a tutoring question.** The same test opens the first question in `#tutoring-questions` on `/tutoring.html` and expects the answer to contain `online first`.
- **Store.** Run `npm run verify -- --grep "old curriculum address"`. `/resources.html` ends on `/store.html`, the header says Store, and the page has no `The Road to Revolution` text and no `href="#"`.
- **Board.** Run `npm run verify -- --grep "subject tiles"`. Each subject opens, U.S. History shows the World War I card at $36, empty subjects say coming soon, search and the Units/Simulations filter run, and Buy on TPT opens the TPT store in a new tab.
- **Proof.** The report rows for those tests are green.

## Gotchas

- The plus and minus marks are CSS. They are not in the text of the summary.
- Several questions can be open. The check does not expect one to close the other.
- The store board is on `store.html`. Empty subjects say “Coming soon, follow our TPT store.” The World War I buy link opens Teachers Pay Teachers in a new tab.
