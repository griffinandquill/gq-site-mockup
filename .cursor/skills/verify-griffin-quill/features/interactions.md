# FAQ and the shop note

FAQ questions are disclosure widgets. More than one can be open. The shop page names Teachers Pay Teachers and offers a newsletter. It does not list sample products.

## Sub-features

- `faq-open` opens two questions on the FAQ page and leaves both open.
- `faq-tutoring` opens the first tutoring question on the tutoring page.
- `shop-coming` shows the Teachers Pay Teachers heading and the shop newsletter, with no sample product and no `href="#"`.

## How to get to it (user POV)

- Open FAQ and choose a question summary.
- Open Tutoring and choose a question under Tutoring questions.
- Open Shop (`resources.html`) and read `Coming to Teachers Pay Teachers`.

## Driving it with Playwright

Preconditions:

- Doctor printed `doctor ok` for this origin.
- The FAQ page has at least two `details.faq` elements.

- **Open two questions.** Run `npm run verify -- --grep "faq questions"`. The test clicks the first two summaries on `/faq.html`. Both `details` elements have `open` true, and both `.answer` blocks are visible.
- **Open a tutoring question.** The same test opens the first question in `#tutoring-questions` on `/tutoring.html` and expects the answer to contain `online first`.
- **Shop.** Run `npm run verify -- --grep "Teachers Pay Teachers"`. The heading `Coming to Teachers Pay Teachers` is visible, `#shop-news` has `form[data-form="hello"]`, and the page has no `The Road to Revolution` text and no `href="#"`.
- **Proof.** The report rows for those two tests are green.

## Gotchas

- The plus and minus marks are CSS. They are not in the text of the summary.
- Several questions can be open. The check does not expect one to close the other.
- The shop newsletter uses the same button name as the home newsletter. Scope the shop form to `#shop-news`.
