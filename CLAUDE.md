# CLAUDE.md — sharedchats.com

Curated discovery site for interesting, publicly shared AI conversations. The
site is an index; conversations live on the providers' own share pages.

## Hard constraints (never violate)

1. **Static only.** No backend, no server functions, no database, no auth.
   Everything is generated at build time.
2. **Never fetch, scrape, crawl, or cache the content of any share URL.** Not
   at build time, not via scripts, not to "validate". `source_url` is an
   outbound link the site never requests. No link-checking, screenshotting, or
   archiving of share URLs. Zero network calls to any AI provider's domain in
   the codebase, build, or scripts.
3. **No copyrighted conversation content in the repo.** Entries contain
   original editorial titles/descriptions/curator notes — never transcript
   excerpts. `temp_data_repo/` (local reading material for the editor) is
   gitignored and must never be committed.
4. **Multi-provider structure** even while the dataset is Claude-only.
5. Keep it lean: no component libraries, no CMS, no state management.

## Conventions

- Astro (currently v7) + Tailwind 4 + TypeScript, pragmatic types.
- npm (not bun/yarn) — deploy target is Cloudflare Pages running `npm run build`.
- Content collection `entries` defined in `src/content.config.ts` (Astro's
  current location; the spec's older `src/content/config.ts` path predates
  Astro 5). Entry markdown files live in `src/content/entries/`.
- Slug = entry filename. URLs use trailing slashes (`trailingSlash: 'always'`).
- `rel="canonical"` always points at the page's own sharedchats.com URL.
- Outbound source links: `target="_blank" rel="noopener nofollow ugc"`.
- No client-side JS except Pagefind on /search and the consent/GA snippet.
- Conventional commits (`feat:`, `fix:`, `chore:`, ...), no attribution lines.
- `scripts/ingest.ts` transforms local CSV → entry files. It makes zero
  network requests.
- After every build-order step: `npm run build` must pass and the post-build
  internal link check must be clean.

## Phase 2 — do not build

User submissions, contributor terms, dead-link checking, takedown forms,
Reddit integration, comments, votes, trending, controlled tag vocabulary,
newsletters, accounts. `status` and `reddit_url` exist in the schema only.
