# FAQ and placeholder links

FAQ questions are disclosure widgets. More than one can be open. Placeholder store links stay on the page and add one note.

## Sub-features

- `faq-open` opens two questions on the FAQ page and leaves both open.
- `faq-tutoring` opens the first tutoring question on the tutoring page.
- `placeholder-once` adds one status note for a product link and does not add a second note on the next click.

## How to get to it (user POV)

- Open FAQ and choose a question summary.
- Open Tutoring and choose a question under Tutoring questions.
- Open Shop (`resources.html`) and choose the sample product whose link name includes `The Road to Revolution`.

## Driving it with Playwright

Preconditions:

- Doctor printed `doctor ok` for this origin.
- The FAQ page has at least two `details.faq` elements.

- **Open two questions.** Run `npm run verify -- --grep "faq questions"`. The test clicks the first two summaries on `/faq.html`. Both `details` elements have `open` true, and both `.answer` blocks are visible.
- **Open a tutoring question.** The same test opens the first question in `#tutoring-questions` on `/tutoring.html` and expects the answer to contain `online first`.
- **Placeholder.** Run `npm run verify -- --grep "placeholder product"`. The link whose name contains `The Road to Revolution` is clicked twice. One status reads `Placeholder link. Nothing opens on this mockup.` The URL stays `/resources.html`. The visible control says `Buy on TPT`.
- **Proof.** The report rows for those two tests are green.

## Gotchas

- The plus and minus marks are CSS. They are not in the text of the summary.
- Several questions can be open. The check does not expect one to close the other.
- `getByRole('link', { name: 'View on TPT' })` matches several product links. Use the product name `The Road to Revolution`.
- A second click does not add another note. Count the status, do not only read the first one.
