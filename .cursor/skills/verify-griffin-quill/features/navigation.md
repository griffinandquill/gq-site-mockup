# Navigation

The header lists the same eight pages on every screen. Wide windows show the row. Narrow windows show a Menu button that opens the list.

## Sub-features

- `nav-desktop` follows a header link at 1280px without the Menu button.
- `nav-mobile` opens the menu at 390px, moves focus to Home, and follows Tutoring.
- `nav-close` closes the menu with Escape, a click on the heading, and a window wider than 1000px.
- `nav-breakpoint` shows the Menu button at 1000px and hides it at 1001px.

## How to get to it (user POV)

- On a wide window, use the row in the header.
- On a narrow window, choose Menu, then a page name.
- Press Escape, click the brand, or widen the window to close the menu.

## Driving it with Playwright

Preconditions:

- Doctor printed `doctor ok` for this origin.
- JavaScript is on, so `html` has the class `js`. The suite uses Chromium with JavaScript enabled.

- **Desktop row.** Run `npm run verify -- --grep "desktop nav"`. At 1280px the Menu button is hidden. Choosing Contact inside `#site-nav` opens `/contact.html`, and that link is the current page.
- **Open the menu.** Run `npm run verify -- --grep "mobile menu"`. At 390px Tutoring is hidden. Choosing Menu sets `aria-expanded` to `true`, the label contains `Close`, and focus is on Home. Choosing Tutoring opens `/tutoring.html` and closes the menu.
- **Close the menu.** Run `npm run verify -- --grep "escape"`. Escape returns focus to Menu. A click on `.brand` closes the list. The open menu covers the heading and the footer links, so those are not the outside click. A viewport of 1100px hides Menu.
- **Breakpoint.** Run `npm run verify -- --grep "1000px"`. At 1000px Menu is visible and the first header link is hidden. At 1001px Menu is hidden and Home is visible.
- **Proof.** `verify-results/menu-open.png` shows the open menu on the home page. The report row `mobile menu opens` is green.

## Gotchas

- At 1000px the menu is the narrow layout. At 1001px it is the row. Do not use 1000px as the desktop width.
- Footer links use the same names. Click `#site-nav` only.
- `faq.html` also has a topic nav. Use the navigation named Primary, which is `#site-nav`.
- The open menu covers the page. Close it before choosing something underneath.
