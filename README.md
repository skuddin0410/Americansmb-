# AmericanSMB — americansmb.com

The magazine for America's small businesses. A static website (HTML, CSS and JavaScript, no build step) built on the European SME "Template 2" design, with a CanadianSME-style menu.

Preview: https://skuddin0410.github.io/Americansmb-/

## Pages

| Page | File |
|---|---|
| Homepage | `index.html` |
| Latest news & guides (topic filter, search, `?section=`, `?type=guide`) | `Articles.dc.html` |
| Article (`?slug=...`) and news item (`?news=...`) | `Post.dc.html` |
| Funding & grants hub | `FundingHub.dc.html` |
| Grant & Loan Finder (31 programs, filters) | `FundingFinder.dc.html` |
| Trade & policy hub | `RulesHub.dc.html` |
| Tax Deadline Calendar (filters, add-to-calendar) | `Compliance.dc.html` |
| Free tools hub | `Tools.dc.html` |
| Calculators: tariff/landed cost, price increase, loan payment, employee cost | `Calculators.dc.html` |
| Quick checks: SBA size standard, 1099-NEC | `Checkers.dc.html` |
| Cyber & AI readiness check | `CyberCheck.dc.html` |
| First-hire checklist | `HiringKit.dc.html` |
| State guides (list) and state guide (`?state=TX`) | `Countries.dc.html`, `Country.dc.html` |
| About, Contact, Advertise, Submit your story, Sitemap | `About.dc.html`, `Contact.dc.html`, `Advertise.dc.html`, `SubmitStory.dc.html`, `Sitemap.dc.html` |
| Newsletter, Interviews, Magazine, Events, Team, Contributors, Privacy, Terms, Cookies, Not found (`?p=...`) | `Page.dc.html` |

Shared parts: `SiteHeader.dc.html`, `SiteFooter.dc.html`, `Card.dc.html`, `SignupForm.dc.html`, `esme.css`, `support.js` (the small runtime that renders the `.dc.html` files).

## Content and settings

- `data.js` — **site settings** (email, Fillout form IDs, Mailchimp form action), article list, news desk items and the simple pages.
- `articles-1.js`, `articles-2.js` — full text of the 33 articles (HTML), keyed by slug.
- `states.js` — state sales tax rate, income tax yes/no and notes for all 50 states + D.C.
- Funding programs are in `FundingFinder.dc.html`; tax deadlines in `Compliance.dc.html`.

To add an article: add a `post(...)` line in `data.js` and its body under the same slug in `articles-2.js`.

### Forms
- **Contact / Advertise / Submit story**: paste your Fillout form IDs into `AMSMB_SITE.forms` in `data.js`. Until then the pages show an email button to info@americansmb.com.
- **Newsletter**: paste your Mailchimp embedded-form action URL into `AMSMB_SITE.mailchimpAction`. Until then, subscribing opens an email to info@americansmb.com.

## Deploy on AWS Amplify

1. Amplify console → **Create new app** → **GitHub** → choose `skuddin0410/Americansmb-`, branch `main`.
2. Amplify detects `amplify.yml` (no build step; it publishes the repository root).
3. Deploy. Every push to `main` redeploys.
4. Optional — in **Hosting → Rewrites and redirects**, add a 404 rule: source `/<*>`, target `/Page.dc.html?p=not-found`, type `404 (Rewrite)`.
5. Add the custom domain `americansmb.com` under **Hosting → Custom domains**.

`customHttp.yml` sets short cache times for HTML/JS so updates show within minutes.

## Notes
- Photos: Unsplash (free license), loaded from images.unsplash.com.
- Facts and figures were checked against official sources in November 2026 (SBA, IRS, NFIB, KFF, NRF, SSA, 13 CFR 121.201). Review time-sensitive items (tax limits, deadlines, rates) each year.

## Brand

The design follows the **AmericanSMB Brand Guidelines, Edition 1.0 (Nov 2026)**:

- Logo files: `logo.png` (full color, for white backgrounds), `logo-dark.png` (reversed, for navy), `favicon.png` and `apple-touch-icon.png` (shield icon).
- Colors: Brand Navy `#0F1F4D`, Brand Orange `#F7931E` (accent only, navy text on orange), Orange Text `#B45309` (small orange text and links), Light Grey `#F2F4F7`, Body Ink `#1D2939`, Muted Ink `#475467`, Border Grey `#D0D5DD`. No red, green or purple.
- Type: Montserrat for everything (Arial fallback).
- Corners: 8px buttons and cards, 16px large panels. One soft shadow: `0 8px 24px` navy at 8%.
- Name: always **AmericanSMB** (one word). Tagline, word for word: *For American Small Businesses*.
