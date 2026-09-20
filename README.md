# Fortune Bridge — website

Static build of the Fortune Bridge desktop homepage, converted from the Figma design
on 2026-09-20. No framework, no build step, no dependencies.

## Deployment (GitHub Pages, from 2026-09-20)

- **Repo:** https://github.com/krishsurya31/fortunebridge (public; Pages requires it on a free plan)
- **Live:** **https://fortunebridge.co.in** (domain attached 2026-09-20; DNS at GoDaddy points
  the apex at GitHub's four A records and `www` at `krishsurya31.github.io`). The github.io URL
  now redirects here. The `CNAME` file in the repo root is what tells GitHub the domain; keep it.
- **Deploy a change:** commit and `git push`. Pages rebuilds in about a minute. Nothing else.
- `artifact.html` and `calculator-hosted.html` are git-ignored: they exist only for the
  Claude-hosted preview and must never be deployed.

### Attaching fortunebridge.co.in (GoDaddy)

The domain currently serves GoDaddy's "Coming Soon" builder page. Steps, in order:

1. **Disconnect the builder.** GoDaddy → Websites + Marketing → the Fortune Bridge site →
   Settings → Domain → disconnect / remove the domain (otherwise the builder keeps
   overwriting the DNS records below).
2. **DNS.** GoDaddy → My Products → Domains → fortunebridge.co.in → DNS. Delete any existing
   `A` records for `@` and any `CNAME` for `www`, then add:

   | Type | Name | Value | TTL |
   |---|---|---|---|
   | A | @ | 185.199.108.153 | 1 hour |
   | A | @ | 185.199.109.153 | 1 hour |
   | A | @ | 185.199.110.153 | 1 hour |
   | A | @ | 185.199.111.153 | 1 hour |
   | CNAME | www | krishsurya31.github.io | 1 hour |

3. **Tell Claude (or do it yourself):** set the custom domain on the repo to
   `fortunebridge.co.in` (Settings → Pages → Custom domain) and, once GitHub shows the DNS
   check passed, tick **Enforce HTTPS**. GitHub issues the certificate automatically; that can
   take up to an hour after DNS propagates. `www.fortunebridge.co.in` then redirects to the apex.

Do step 3 only AFTER step 2: with a custom domain set, GitHub redirects the github.io URL to
the domain, so until DNS points here the site would appear broken.

## Run it locally

Open `index.html` in a browser. That's it.

**Hosted copy:** https://claude.ai/code/artifact/9fa4faae-3bbe-47a9-bcd3-8b38b55b5435
and the calculator at `.../calculator.html` on the same URL. Private to the owner's Claude
account until shared from the page's share menu. Opens on any device, including a phone.

Two generated files exist only for that host; edit the originals and regenerate, never
these directly:
- `artifact.html` is `index.html` without doctype/head/body (the host supplies its own).
- `calculator-hosted.html` is `calculator.html` with `index.html` links rewritten to `./`,
  because the host reserves the name `index.html` for its main page.

For a local server (nicer for caching and avoids any `file://` quirks):

```bash
cd website
python -m http.server 8000       # then open http://localhost:8000
```

## Files

| File | What |
|---|---|
| `index.html` | The homepage. Nine sections, plus an inline SVG icon sprite at the top. |
| `calculator.html` | **Wealth Calculator** page (added 2026-09-20). Goal mode and Grow mode, SIP or lumpsum, three return scenarios, animated stacked chart with tooltip and table view. |
| `styles.css` | Design tokens as CSS variables, then section-by-section styles. Shared by both pages. |
| `calc.css` | Calculator-page styles only. Loaded after `styles.css`. |
| `script.js` | Scroll reveals, count-ups, header shadow, and the homepage goal chart. Loaded on both pages. |
| `calc.js` | The calculator: maths, inputs, scenario tiles, chart, tooltip, table. |
| `assets/` | Logos and the advisor cutout, exported from Figma. |

## Source of truth

The design lives in `../figma-backup/`. If something here looks wrong, check there first:

- `tokens.json` — every colour and text style with exact values
- `spec-01/02/03-*.txt` — node-by-node layout specs for all 11 sections
- `philosophy-glass-tiles.md` — the liquid-glass recipe and hover states
- `outlook-chart.md` — chart geometry and the animation sequence

The CSS variables at the top of `styles.css` mirror `tokens.json` exactly. **Change colours
there, not inline**, so the two stay in sync.

## Content (rewritten 2026-09-20 from Vignesh's business card)

The site is for **Vignesh Parthiban, AMFI Registered Mutual Fund Distributor, Tirunelveli**.
His seven services, and the only ones the page may claim: **Mutual Funds, SIF, PMS, AIF,
Bonds, Insurance, LAMF**. SIF = SEBI's Specialised Investment Fund category (min ₹10 lakh).
LAMF = Loan Against Mutual Funds. Contact: +91 86828 72694, vignesh@fortunebridge.co.in,
fortunebridge.co.in, 5/1 New Colony, Melakkarai, Thatchanallur Bye Pass, Tirunelveli.

Copy rules in force:
- **The brand speaks, not the person.** Copy says "Fortune Bridge" / "we", never "Vignesh"
  (owner's request, 2026-09-20). His name appears in exactly one place: the footer ARN line,
  because the AMFI registration is personal and the ARN holder must be identifiable.
  **AMFI ARN: 292905** (supplied by the owner, 2026-09-20; shown in both footers).
- **No em or en dashes anywhere** in visible text (owner's request). Commas and full stops.
- **Never "advisor" / "advice" / "Assets Under Advice".** An MFD is a distributor; AMFI bars
  distributors from holding themselves out as advisers. Use "distributor", "guidance", "plan".
- **No return figures.** The chart shows goal *progress* (₹ accumulated toward a target), not
  a rate of return. SEBI/AMFI prohibit indicative returns in MF promotion.
- **Nothing invented.** The reference site's stats bar, "Since 2003", press logos, testimonials
  and ARN were all removed as fabricated. Placeholders are visibly tagged `Sample` / dashed.

## What's implemented

Nine sections: Header, Hero, Our Approach, Services (4 + 3), Goal-Based Investing,
Testimonials (drafted, pending approval), Process, CTA, Footer. The Stats bar and Legacy & Succession section
were removed on 2026-09-20 (fabricated figures; services he does not offer).

Animations:

- **Scroll reveals** — anything with `data-reveal` fades and rises when it enters view.
  Add `d1`–`d5` classes to stagger (90ms steps).
- **Stat count-ups** — `data-count`, with optional `data-prefix`, `data-suffix`, `data-comma`.
- **Outlook chart** — gridlines, bars (staggered `scaleY` from the bottom), a trend line that
  draws on via `stroke-dasharray`, vertex dots that pop, and a value chip that counts to ₹62L.
- **Hover** — glass pillars lift with a gold border; service cards lift; link arrows slide.

All motion is disabled under `prefers-reduced-motion`.

## Things worth knowing

- **Chart bars use `transform-box: fill-box`.** Without it, `transform-origin: bottom` is
  measured against the SVG's user space, not the bar, and they grow from the wrong place.
- **The trend line's dash length is read at runtime** with `getTotalLength()`. Don't hardcode
  it — it changes the moment the data or plot size changes.
- **The Philosophy orbs are not decoration.** The glass tiles use `backdrop-filter`, and a
  blur over a flat colour returns that flat colour. Remove the orbs and the glass goes flat.
- **Keep the orbs cool (blue/navy).** A gold version was tried in Figma and rejected — warm
  light through translucent glass reads as dirty yellow patches.
- The chart is built entirely in JS, so with JS disabled that panel is empty. Everything else
  is plain HTML and renders fine.

## Cache busting

Script and stylesheet links carry a version query (`script.js?v=6`). Python's `http.server`
sends no cache headers, so browsers reuse old files and new features "don't show up".
**Bump the number in both HTML files whenever `styles.css`, `calc.css`, `script.js` or
`calc.js` changes.** The hosted-variant generator strips the query, so the host is unaffected.

## Consultation form (added 2026-09-20)

Every "Book a Consultation" button opens a modal form (name, phone, email, topic, message,
consent). The form is injected by `script.js` so both pages share one copy.

**How sending works.** A static site cannot send email on its own. The form POSTs to
**FormSubmit** (`https://formsubmit.co/ajax/vignesh@fortunebridge.co.in`), a free relay that
emails the submission to that address with reply-to set to the visitor. No account needed.

**One-time activation, and it must happen.** The very first submission does not deliver.
FormSubmit emails vignesh@fortunebridge.co.in an "Activate form" link. Until he clicks it,
nothing arrives. After that, every submission lands in his inbox as a formatted table.
Send one test submission yourself, then ask him to click the link.

**Fallback.** If the relay is unreachable the form shows a link that opens the visitor's own
mail app with everything pre-filled. This is what happens on the **hosted Claude preview**,
whose security policy blocks all outbound requests, so the preview cannot send; only the real
deployment (or localhost) can. Do not judge the sending flow from the hosted link.

**Spam.** A hidden honeypot field drops bots silently. FormSubmit's own captcha is off
(`_captcha: 'false'`); remove that line in `script.js` to turn it on.

**Switching provider.** `ENDPOINT` in `script.js` is the only line that knows about FormSubmit.
A Formspree form URL drops in unchanged.

**Privacy.** Submissions pass through FormSubmit's servers. Mention this in the Privacy
Policy when it is written.

## Waiting on Vignesh

- **Click the FormSubmit activation email** after the first test submission (see above).

- **Approval of the three testimonials.** On 2026-09-20 the owner supplied three names and
  roles (Surya, Supply Chain Consultant; Jahnavi, Technology Project Manager; Rishi, Data
  Scientist) and asked for the quotes to be written. The quotes on the page are therefore
  **drafts written for those people, not words they have said**. Each must read and approve
  theirs (ideally rewrite it in their own words) before the site is public. Publishing a quote
  someone did not say, under their name, is a misrepresentation regardless of intent.
- **Optional real figures** (years in practice, families served) if he wants a stats bar back.
- **Pin code** for the office address.
- **Legal pages.** Privacy Policy, Terms and Disclosures links are placeholders.

## Not done yet

- **Mobile layout.** Breakpoints at 1200 / 900 / 600px stop it breaking, but this is a desktop
  design (1440px frame). A real mobile version is a separate build.
- The Figma file still shows the OLD content (Legacy section, stats, old services). The
  website is now ahead of the design; sync Figma if it is still the source of truth.
