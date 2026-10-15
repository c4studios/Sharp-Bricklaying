# Sharp Bricklaying

Client site for Sharp Bricklaying, Perth. Brain `client_id`: `sharp`. Retainer on a prepaid annual care plan.
Live at https://sharpbricklaying.com.au. Static HTML, no framework, GSAP from npm. The contact form posts to `api/send-email.js`, a Vercel function that sends through Resend to luke@sharpbricklaying.com.au.

## The brain
The C4 business database is Cloudflare D1, id `8bb6ab46-8e88-47f8-adff-16316dd2f03e` (MCP tool `d1_database_query`).
Read it before asserting any business fact: `SELECT * FROM clients WHERE id = 'sharp'`, and `site_issues` for open faults.
Before finishing a session that changed anything here, append a row to `work_log` (repo, client_id, what, why, files, shipped, verified_how).
The database wins over this file and every other markdown file.

## How it deploys
Vercel, project `sharp-bricklaying`, git-linked to `c4studios/Sharp-Bricklaying`. A push to `main` deploys. There is no `.vercel` folder here and none is needed.

## Page structure
The site is multi-page as of 6 Sep 2026. Routes come from directories, not from Vercel rewrites, so `/gallery` is `gallery/index.html`. Keep that pattern for anything new.

- `index.html` — hero, services, about, a three-project **featured work** teaser, a contact band. It no longer holds the portfolio or the enquiry form.
- `gallery/index.html` — the full portfolio: the two standalone groups plus the tabbed job panels. This is where gallery work goes now, not `index.html`.
- `contact/index.html` — the enquiry form, contact details, and the "what to send" guidance.
- `partners/index.html` — Sharp's brand deals (Mudboards Australia, BrickieGrip, BT Engineering), live 14 Oct 2026. Write-ups are Luke's own words. Linked from the "Affiliates" dropdown in the main nav and mobile menu (each brand row has an id the dropdown anchors to). The footer Sponsors & Affiliates block was removed on 15 Oct 2026 at Luke's request; don't rebuild it.
- `careers/index.html` — the hiring page, live 15 Oct 2026. Its application form reuses the contact form handler via `data-form="application"`; `api/send-email.js` then sends role and experience with the subject "Job application: <role> — <name>". Linked from the footer Navigate list.
- `articles/` — the Site Notes section. The first live article is `articles/wa-brick-shortage/` (8 Oct 2026). Deliberately uses its own chrome (`css/articles.css`, `.site-topbar`) rather than the main nav, because it is a reading surface. If you unify it, `styles.css` sets `section { opacity: 0 }` and relies on `main.js` to reveal, so article sections would vanish without that script.
- `_drafts/` — written but not client-approved. Excluded from the deployment by `.vercelignore`, and the validator fails if that line goes missing or if anything served links into it. **Nothing goes live under Sharp's name until Luke has asked for it.** The first article was published on 6 Sep 2026 and pulled the same day for exactly this reason.

**Pages below the root reference assets root-relative** (`/images/…`, `/css/…`, `/js/…`). A relative `images/…` on `/gallery` resolves to `/gallery/images/…` and 404s. `index.html` is at the root so it keeps relative paths.

The nav and footer are duplicated across five files (`index.html`, `gallery/`, `contact/`, `partners/`, `careers/`) with no build step. Change one, change all five, and keep the markup identical. Footer headings are `h3` (changed from `h4` on 15 Oct 2026 so the heading order does not skip a level). New pages are easiest to build by copying the head, nav and footer from an existing inner page.

## Traps in this repo
`_headers` and `_redirects` are Netlify syntax. Vercel ignores both completely. Headers go in `vercel.json`, which already carries `X-Frame-Options: DENY` and `frame-ancestors 'none'` (shipped 4 Sep 2026, verified live with curl). Add any new header there, not to `_headers`.

`Sharp Bricklaying.html` at the root is an old export, tracked in git, still mentioning .net. It is not the source of anything. Leave it unless the job is to delete it.

**Vercel publishes every file in the repo that `.vercelignore` does not list.** Until 15 Oct 2026 that included this file, the old export, the build scripts, `src/` and `uploads/`. They are excluded now and the validator fails if any exclusion goes missing. Anything new that is repo-only (notes, scripts, raw uploads) goes in `.vercelignore` too.

Two ABNs appear on the invoice; only one is the paying entity. Check the brain before quoting either.

The About section photo has `luke@sharpbricklaying.net` burned into the image. It cannot be fixed in code and needs a replacement photo from Luke.

## Checks before you push
`npm test` runs `scripts/validate-content.js`. It is strict on purpose: every image and video in a registered folder must appear in the matching panel with exact counts, the canonical of each page must be the `.com.au` URL, every page must link to `/gallery`, `/contact` and `/articles/`, no served file may contain the string `sharpbricklaying.net`, and **no served page may contain `[PLACEHOLDER`**. That last rule is the gate for pages waiting on client content: build them with visible placeholders on a branch, and `npm test` refuses them until the content is in. Update the validator whenever gallery markup or media changes.

Serve with `npm run dev` (`npx serve -l 3000`). Root-relative paths break under `file://`, so never verify by opening the file directly.

**`npx serve` is more forgiving than Vercel.** It resolves `/foo` to `foo.html`; Vercel does not, and `cleanUrls` is off. An extensionless link can pass locally and 404 in production, which is exactly how the first article shipped broken on 6 Sep 2026. Every route is a directory with an `index.html`, and the validator now checks that every internal link and every sitemap URL resolves to a real file. After any push, curl the live URL rather than trusting the local server.

## Standing rules that bite here
Never fabricate a testimonial, review or figure. Use a visible `[PLACEHOLDER]` marker instead.
Verify in a real browser or with curl before reporting anything as done. Reading the source is not verification.
Never `git add -A`. Stage the files you changed by name.
