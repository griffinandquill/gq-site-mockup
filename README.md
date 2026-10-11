# Griffin & Quill

Design mockup for Griffin & Quill LLC, a South Carolina edtech studio. Review site for the owner, published at https://www.griffinandquill.com. It stays noindex until launch.

Plain static HTML, CSS, and a small JavaScript file. Agent and contribution rules live in [AGENTS.md](AGENTS.md).

## Preview locally

From this folder:

```bash
python3 -m http.server 8742
```

Open [http://127.0.0.1:8742](http://127.0.0.1:8742).

`404.html` is the page GitHub Pages and Cloudflare Pages show for unknown URLs. Python's `http.server` does not do that, so open [http://127.0.0.1:8742/404.html](http://127.0.0.1:8742/404.html) to review it.

## Check the mockup

```bash
npm ci
npx playwright install chromium
npm run verify
```

A passing run writes `verify-results/report/index.html`. Open that report with `npm run verify:report`. To check the published site: `BASE_URL=https://www.griffinandquill.com npm run verify`.

`npm run verify` starts its own server on port 4173. Leave `BASE_URL` unset for that local server.

## Pages

| Page | File |
| --- | --- |
| Home | `index.html` |
| Tutoring | `tutoring.html` |
| Classroom resources (TPT) | `resources.html` |
| EdTech / Worlds | `worlds.html` |
| For schools and districts | `schools.html` |
| About | `about.html` |
| Contact | `contact.html` |
| FAQ | `faq.html` |
| Privacy Policy (draft) | `privacy.html` |
| Terms of Use (draft) | `terms.html` |
| 404 | `404.html` |

Shared files: `css/styles.css`, `js/main.js`, `favicon.svg`.
