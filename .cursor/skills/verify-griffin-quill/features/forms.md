# Forms

Four forms post to FormSubmit. A valid submit stays on the page and shows `Thanks. Your note is on its way.` only after a successful JSON response. An empty submit shows the browser's required-field message and does not show that note. A failed response shows the error note and does not show thanks. A filled honeypot sends nothing.

## Sub-features

- `form-empty` leaves the thank-you note hidden when required fields are empty, and does not call FormSubmit.
- `form-submit` shows the thank-you note, focuses it, keeps the URL, and posts to the inbox named in the catalog.
- `form-render` shows each `form[data-form]` in its section, with a `_honey` field.
- `form-fail` shows the error note when FormSubmit does not succeed.
- `form-honey` ignores a filled honeypot.

## How to get to it (user POV)

- Home, section `Notes from the studio`, button `Join the list`. Inbox `hello@griffinandquill.com`.
- Quillhaven (`worlds.html`), section `Waitlist`, button `Join the waitlist`. Inbox `hello@griffinandquill.com`.
- Schools, section `Inquiry form`, button `Send inquiry`. Inbox `partners@griffinandquill.com`.
- Contact, section `Message`, button `Send message`. Inbox `hello@griffinandquill.com`.

## Driving it with Playwright

Preconditions:

- Doctor printed `doctor ok` for this origin.
- The field labels, sample values, route key, and inbox are the `forms` array in `verify/catalog.mjs`.
- The test intercepts `https://formsubmit.co/**` before the page loads. Do not let a verify run send a real activation email.

- **Render.** Run `npm run verify -- --grep "form stays"`. Each test expects `form[data-form]` inside its section.
- **Empty submit.** The test clicks the submit button before typing. `[data-thanks]` stays hidden and no request is recorded.
- **Valid submit.** The test fills the required labels, chooses the required radio, and clicks the button again. The intercepted response is `{ "success": "true" }`. The note text is `Thanks. Your note is on its way.`, the note is focused, the URL is unchanged, and the request URL contains the inbox. The JSON body has no `_honey`.
- **Failed send.** Run `npm run verify -- --grep "failed send"`. A 422 response leaves thanks hidden and shows `[data-form-error]`.
- **Honeypot.** Run `npm run verify -- --grep "honeypot"`. Filling `_honey` and submitting records no request and shows neither note.
- **Proof.** `verify-results/form-thanks.png` shows the contact note. The report rows named `newsletter form stays on the page` through `contact form stays on the page` are green.

## Gotchas

- Click the button. Calling `form.submit()` skips the handler and navigates.
- The optional school size stays empty. It is not required.
- `getByLabel` needs the full label, including `(required)`, and `exact: true`. `Email (required)` is not `Work email (required)`.
- The thank-you note is not a live region. Assert the text and focus.
- The honeypot is clipped. Fill it with `force: true`.
- The first real submission to each inbox emails a FormSubmit confirmation link. Verify must keep the intercept in place.
