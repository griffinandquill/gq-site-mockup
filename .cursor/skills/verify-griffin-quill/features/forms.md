# Forms

Five forms render on the mockup. A valid submit stays on the page and shows `Thanks! (mockup: form not connected)`. An empty submit shows the browser's required-field message and does not show that note.

## Sub-features

- `form-empty` leaves the thank-you note hidden when required fields are empty.
- `form-submit` shows the thank-you note, focuses it, and keeps the URL.
- `form-render` shows each `form[data-mockup]` in its section.

## How to get to it (user POV)

- Home, section `Notes from the studio`, button `Join the list`.
- Tutoring, section `Book a free consult`, button `Request a consult`.
- Quillhaven (`worlds.html`), section `Waitlist`, button `Join the waitlist`.
- Schools, section `Inquiry form`, button `Send inquiry`.
- Contact, section `Message`, button `Send message`.

## Driving it with Playwright

Preconditions:

- Doctor printed `doctor ok` for this origin.
- The field labels and sample values are the `forms` array in `verify/catalog.mjs`.

- **Render.** Run `npm run verify -- --grep "form stays"`. Each test expects `form[data-mockup]` inside its section.
- **Empty submit.** The test clicks the submit button before typing. `[data-thanks]` stays hidden.
- **Valid submit.** The test fills the required labels, chooses the required radio, and clicks the button again. The note text is `Thanks! (mockup: form not connected)`, the note is focused, and the URL is unchanged.
- **Proof.** `verify-results/form-thanks.png` shows the contact note. The report rows named `newsletter form stays on the page` through `contact form stays on the page` are green.

## Gotchas

- Click the button. Calling `form.submit()` skips the handler and navigates.
- The optional consult note and the optional school size stay empty. They are not required.
- `getByLabel` needs the full label, including `(required)`, and `exact: true`. `Email (required)` is not `Work email (required)`.
- The thank-you note is not a live region. Assert the text and focus.
- The note is not cleared. A second submit is not part of this check.
