# Crawl and share tags

Pages do not ask crawlers to stay away. `robots.txt` allows the site and names the sitemap. Each page has an absolute share image, a description, a URL, a large Twitter card, and a canonical link that matches the URL.

## Sub-features

- `guard-banner` expects no mockup bar on any page, including the 404 page.
- `guard-noindex` expects no `meta[name="robots"]` on any page.
- `guard-robots` serves `robots.txt` as `User-agent: *`, `Allow: /`, a blank line, and the sitemap URL.
- `guard-share` expects `og:image`, `og:description`, `og:url`, `twitter:card`, and a canonical link equal to `og:url`.

## How to get to it (user POV)

- Open any page. There is no burgundy mockup bar.
- View the page source and find the canonical link and the share tags.
- Open `/robots.txt` and `/sitemap.xml`.

## Driving it with Playwright

Preconditions:

- Doctor printed `doctor ok` for this origin.
- The expected robots body and share image live in `verify/catalog.mjs` as `copy.robots` and `copy.ogImage`.

- **Read the bar.** Each `loads at` test expects `.mockup-bar` to be absent.
- **Read the meta.** The same tests expect no `meta[name="robots"]`. Privacy and terms still show `.legal-banner` with `Draft placeholder, pending attorney review.`
- **Read the share tags.** `og:image` is `https://www.griffinandquill.com/assets/og.png`. `twitter:card` is `summary_large_image`. The canonical `href` equals `og:url`, and that URL starts with `https://www.griffinandquill.com/`.
- **Read robots.txt.** Run `npm run verify -- --grep "allows crawling"`. The body matches `copy.robots`, including the trailing newline. The same test expects `/sitemap.xml` to list every page except `404.html`, and expects `/favicon.ico` to answer 200.
- **Proof.** The report row `robots.txt allows crawling and names the sitemap` and the page-load tests are green. Doctor also fetches `/`, `/robots.txt`, `/sitemap.xml`, and `/favicon.ico`.

## Gotchas

- There is no `noindex` meta. A 404 status is enough for a missing path.
- Cloudflare does not change `robots.txt`. It does change HTML. Check the share tags in the DOM after load, not a byte compare of the HTML.
- Playwright does not honor `robots.txt`, so the suite can still open every page.
