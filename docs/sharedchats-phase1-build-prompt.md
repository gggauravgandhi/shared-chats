# sharedchats.com — Phase 1 Build Spec

You are building **sharedchats.com**: a curated discovery site for interesting, publicly shared AI conversations. Humans find share links (Claude, ChatGPT, Gemini, Grok, etc.), curate them, and publish entries with a title, description, tags, and a link to the original conversation. The site is the index; the conversations live on the providers' own share pages.

Work through this spec **step by step, in the build order at the bottom**. Verify each step before moving to the next. Everything in "Phase 2 — DO NOT BUILD" is out of scope no matter how easy it looks.

---

## 1. Hard constraints (never violate)

1. **Static only.** No backend, no server functions, no database, no auth. Everything is generated at build time.
2. **Never fetch, scrape, crawl, or cache the content of any share URL.** Not at build time, not via scripts, not "just to validate." Entries contain human-written metadata only. The `source_url` is an outbound link — the site never requests it. Do not add link-checking, screenshotting, or archiving of share URLs.
3. **No copyrighted conversation content in the repo.** Entries contain original title/description/curator notes written by the site editor — never transcript excerpts.
4. **Structure is multi-provider from day one** even though the initial dataset is Claude-only.
5. Keep it lean. No component libraries, no CMS, no state management. Astro + Tailwind + a handful of components.

## 2. Stack

- **Astro** (latest stable) with Content Collections for entries
- **Tailwind CSS** for styling
- **Pagefind** for static search (indexed at build)
- **@astrojs/sitemap** and **@astrojs/rss**
- **satori + resvg** (or `astro-og-canvas`) for build-time OG image generation
- Deploy target: **Cloudflare Pages** (static output). Provide a `wrangler`-free setup — plain `npm run build` producing `dist/`, plus a short DEPLOY.md with the Cloudflare Pages settings (build command, output dir, env vars).
- Node 20+. TypeScript throughout, but pragmatic — no type gymnastics.

## 3. Repository layout

```
sharedchats/
├── src/
│   ├── content/
│   │   ├── config.ts            # zod schema for the entries collection
│   │   └── entries/             # one .md file per conversation entry
│   ├── components/              # Card, TagPill, ProviderBadge, ContentWarning, Header, Footer, SEOHead
│   ├── layouts/                 # Base.astro (SEO head, analytics, nav, footer)
│   ├── pages/                   # routes, see §5
│   └── lib/                     # stats.ts, seo.ts, og.ts helpers
├── scripts/
│   └── ingest.ts                # CSV → entry .md files (see §4.3)
├── public/
│   ├── robots.txt
│   └── favicon
├── DEPLOY.md
└── CLAUDE.md                    # summarize the constraints of §1 + conventions here
```

## 4. Content model

### 4.1 Entry schema (Content Collection, zod-validated)

```yaml
---
title: "Claude explains monads using chai stalls"        # required, ≤ 70 chars target
description: "A dev asks Claude to explain monads..."    # required, 140–160 chars; doubles as meta description
source_url: "https://claude.ai/share/abc123"             # required, valid URL; UI label: "Open original chat"
provider: "claude"          # required enum: claude | chatgpt | gemini | grok | perplexity | copilot | deepseek | other
tags: ["explainers", "programming", "funny"]             # required, 1–6 freeform lowercase-kebab strings
date_discovered: 2026-07-20                              # required, date the curator found it
featured: false             # optional, default false; true = Editor's Pick
curator_note: ""            # optional, 1–2 sentences on why it's worth reading; rendered as "Why we picked it"
content_warning: ""         # optional; when non-empty, render a visible warning banner on the entry page and a small marker on cards
language: "en"              # optional, default "en"
status: "live"              # enum live | dead | removed; phase 1 only ever writes "live", but the schema must support the others
reddit_url: ""              # optional; empty in phase 1, rendered as a "Discuss" link when present
---
Optional markdown body: a longer editorial blurb. Most entries won't have one. Never paste conversation content here.
```

- Slug = filename (e.g. `claude-explains-monads-chai-stalls.md`), used in the URL.
- `rel="canonical"` on every page points to the page's **own** sharedchats.com URL. `source_url` is never the canonical.
- Outbound `source_url` links: `target="_blank" rel="noopener nofollow ugc"`.

### 4.2 Seed data

Create **10 realistic placeholder entries** (provider `claude`, varied tags, 2 with `featured: true`, 1 with a `content_warning`, 1 with a `curator_note`) so every page renders with real-looking data. Mark them clearly as placeholders (`tags: [placeholder]` plus the real-looking tags) so they're easy to purge later.

### 4.3 Ingestion script

`scripts/ingest.ts`: reads `data/entries.csv` with columns matching the schema (`title,description,source_url,provider,tags,date_discovered,featured,curator_note,content_warning`), where `tags` is pipe-separated. For each row: generate a slug from the title (dedupe with `-2`, `-3` suffixes), skip rows whose `source_url` already exists in an entry, write the `.md` file. Print a summary (created / skipped / invalid rows with reasons). This is how ~500 hand-curated Claude entries will be loaded. The script only transforms local CSV data — it makes **zero network requests** (see §1.2).

## 5. Routes

| Route | Content |
|---|---|
| `/` | Hero (one-liner + short about blurb + entry count), **Editor's Picks** (featured, max 6), **Recently Added** (by `date_discovered` desc, max 12), links to browse all |
| `/chats/` | All entries, paginated (24/page), newest first, filter chips by provider |
| `/chats/[slug]/` | Entry page: title, provider badge, tags, date discovered, description, optional curator note, optional content-warning banner, prominent "Open original chat" button, optional "Discuss" (reddit) link, related entries (up to 4 by tag overlap) |
| `/tags/` | Tag index with counts, sorted by count |
| `/tags/[tag]/` | All entries for a tag, paginated |
| `/providers/[provider]/` | All entries for a provider, paginated — these are SEO landing pages; give each a short unique intro paragraph (e.g. "Shared Claude conversations, curated") |
| `/stats/` | Build-time stats: total entries, entries per provider, top 20 tags, entries added per month (simple bar chart — plain HTML/CSS bars, no chart library), date of latest addition |
| `/search/` | Pagefind UI |
| `/about/` | What the site is, how curation works, how to reach us |
| `/faq/` | See §7 (AEO) |
| Policy pages | See §8 |
| `/rss.xml`, `/sitemap-index.xml`, `/robots.txt`, `/llms.txt` | See §6–7 |
| `/404` | Friendly 404 linking to search + recent |

## 6. SEO requirements (non-negotiable checklist)

- Unique `<title>` (pattern: `{Entry title} — SharedChats`) and meta description (the `description` field) on every page
- `rel=canonical` self-referencing on every page; trailing-slash URLs consistently
- OpenGraph + Twitter card tags on every page; **build-time generated OG image per entry** (title + provider badge + sharedchats.com wordmark, 1200×630) and one default OG image for index/tag/provider pages
- **JSON-LD** on every page: `WebSite` (with `SearchAction`) on home; `CollectionPage` + `ItemList` on list pages; `WebPage` with `about`, `datePublished` (= date_discovered) and `publisher` on entry pages; `FAQPage` on /faq; `BreadcrumbList` on entry/tag/provider pages
- `sitemap-index.xml` via @astrojs/sitemap; robots.txt allowing all crawlers (explicitly including GPTBot, ClaudeBot, PerplexityBot, Google-Extended) and pointing at the sitemap
- RSS feed of the 50 newest entries (title, description, link to the sharedchats entry page — not the source_url)
- Semantic HTML (`article`, `nav`, `main`, single `h1` per page), descriptive alt text, lazy-loaded images
- Performance budget: no client-side JS except Pagefind on /search and the analytics snippet. Lighthouse ≥ 95 on performance/SEO/accessibility/best-practices for home and one entry page — verify and report actual numbers.

## 7. AEO + GEO requirements

- **/faq/**: 8–10 real questions ("What is SharedChats?", "Are these conversations real?", "How do I get my conversation removed?", "Do you store the chats?", "How are conversations selected?" ...) with concise 2–4 sentence answers, marked up with `FAQPage` JSON-LD. Write answers in a direct, quotable style — answer engines lift these verbatim.
- Every entry page opens with the description as a plain-prose first paragraph (answer-first layout).
- **/llms.txt**: generated at build time — site name, one-liner, key URLs (about, faq, tag index, providers), and a note that entry metadata is available in the RSS feed. Keep it current with each build.
- All content must be present in the initial HTML (no client-side rendering of content) so AI crawlers see everything.

## 8. Policy pages

Create a `/legal/` section with a shared layout, and generate a solid **draft** of each (clearly marked "Draft — under review" in a comment, not visible on page). Plain language, short sections, "Last updated" date. Footer links to all of them.

1. **/legal/terms/** — Terms of Use: personal use, no scraping of this site, content provided as-is, links are third-party, governing law India (Karnataka jurisdiction).
2. **/legal/privacy/** — Privacy Policy: we collect no accounts or personal data; Google Analytics 4 is used for aggregate traffic stats (cookies, IP truncation); contact email for questions. **DPDP-ready**: include a "Your rights" section covering access, correction, and erasure requests with the contact email, and note that consent for analytics can be withdrawn (see consent note below). Structure it so grievance-officer details and DPDP-specific notices can be added later without a rewrite.
3. **/legal/content-policy/** — Content & Moderation Policy: what gets listed (publicly shared, interesting, non-harmful), what never gets listed (personal data, harassment, sexual content involving minors, instructions for harm), that listing ≠ endorsement, and that entries are removed on valid request.
4. **/legal/copyright/** — Copyright & Takedown Policy: we link, we don't host conversation content; summaries/titles are our original editorial work; rights holders or conversation owners can request delisting via email; requests honored promptly. (The workflow/form is phase 2 — phase 1 is the policy text + a `mailto:`.)
5. **/legal/ai-disclaimer/** — AI Summary Disclaimer: conversations are AI-generated and may be inaccurate or fictional; nothing here is professional advice; descriptions are editorial summaries, not verbatim content.
6. **/legal/trademarks/** — Provider & Trademark Disclaimer: Claude, ChatGPT, Gemini, Grok etc. are trademarks of their respective owners; sharedchats.com is independent and not affiliated with or endorsed by any AI provider.

**Analytics consent note:** load GA4 via a minimal consent-aware pattern — a small dismissible banner ("We use cookies for anonymous analytics — OK / No thanks"); GA only loads after acceptance, choice stored in `localStorage`. Keep it under ~40 lines of vanilla JS, no consent-management library. This is the phase-1 DPDP posture: consent before analytics, and documented erasure/correction contact.

## 9. Analytics

Google Analytics 4. Measurement ID from env var `PUBLIC_GA_ID`; when unset (local dev), render nothing. Loaded only post-consent (§8). Add a line in DEPLOY.md on setting the env var in Cloudflare Pages and linking the property to Google Search Console.

## 10. Design direction

- Clean, fast, content-forward. Card grid for lists: title, description (2-line clamp), provider badge, tags, date. Generous whitespace, system font stack or one self-hosted variable font — no Google Fonts CDN.
- Provider badges: small colored pill with provider name (no provider logos — trademark posture).
- Light + dark mode via `prefers-color-scheme`; no toggle in phase 1.
- Content-warning banner: amber, icon, warning text from frontmatter, sits above the description on the entry page; cards show a small "CW" marker.
- Mobile-first; the card grid is the whole product on mobile.

## 11. Phase 2 — DO NOT BUILD NOW

Do not implement, stub, or scaffold: user submissions, contributor terms page, dead-link reporting or checking, takedown request forms, Reddit integration/bot, comments, votes, trending/most-viewed pages, controlled tag vocabulary or tag validation beyond format, newsletters, accounts. `status` and `reddit_url` exist in the schema only; no UI or logic beyond rendering "Discuss" when `reddit_url` is set.

## 12. Working agreement

- If anything in this spec is ambiguous or two requirements conflict, **stop and ask** before implementing.
- Simple > clever. No abstraction used once. If a page can be a plain `.astro` file with a loop, it is.
- Only touch files relevant to the current step. Do not refactor previous steps' work as a side effect; if something earlier needs fixing, say so first.
- After every step: `npm run build` must pass with zero errors and zero broken internal links (add a tiny post-build script that checks internal hrefs in `dist/` against emitted files — local files only, no network).
- Conventional commits, one commit per build-order step minimum.

## 13. Build order

1. **Scaffold**: Astro + Tailwind + TypeScript, repo layout from §3, Base layout with header/footer/SEOHead, CLAUDE.md. Verify: dev server renders a stub home.
2. **Content model**: collection schema, 10 seed entries, `scripts/ingest.ts` with 2–3 sample CSV rows in `data/entries.sample.csv`. Verify: build passes, invalid frontmatter fails the build with a clear error, ingest script round-trips the sample CSV.
3. **Core pages**: home, /chats/ with pagination + provider filter, entry pages with related entries, tag index + tag pages, provider pages, 404. Verify: every seed entry and tag reachable; internal link check passes.
4. **SEO layer**: canonical/meta/OG tags, JSON-LD per §6, sitemap, robots.txt, RSS, llms.txt, OG image generation. Verify: validate one page of each type's JSON-LD (paste-ready for Google's Rich Results test), confirm OG images emitted to `dist/`.
5. **Search**: Pagefind integration + /search/ page. Verify: build produces the index; searching a seed entry title returns it.
6. **Stats + FAQ + About**: /stats/ computed from the collection, /faq/ with FAQPage schema, /about/. Verify: stats numbers match seed data exactly.
7. **Legal + consent + analytics**: six policy pages, consent banner, GA4 conditional load, footer links. Verify: with `PUBLIC_GA_ID` unset nothing loads; with it set, GA loads only after accept.
8. **Polish + audit**: dark mode pass, mobile pass, Lighthouse on `/` and one entry page — report the four scores; fix until ≥ 95 each. Write DEPLOY.md. Final full build.

## 14. Definition of done

- `npm run build` clean; internal link check clean
- All routes in §5 exist and render with seed data
- Every SEO item in §6 verifiably present
- Lighthouse ≥ 95 ×4 on home and entry page (report numbers)
- Zero network calls to any AI provider's domain anywhere in the codebase, build, or scripts
- Ingest script documented in README with the CSV column spec
