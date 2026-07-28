# CLAUDE.md — sharedchats.com

Curated discovery site for interesting, publicly shared AI conversations **and
interactive artifacts**. The site is an index; the content itself lives on the
providers' own share pages.

## Hard constraints (never violate)

1. **Static only.** No backend, no server functions, no database, no auth.
   Everything is generated at build time.
2. **The site never fetches a share URL.** Zero network calls to any AI
   provider's domain in the codebase, build, or scripts — no link-checking, no
   screenshotting, no archiving, not even "just to validate". `source_url` is
   an outbound link only.
   *Editorial exception, operator-approved:* a human editor (or an agent acting
   as one) may open a share page manually to read it before writing an entry —
   that is how curation works. What is forbidden is any automated or committed
   fetching. Nothing fetched this way is ever cached into the repo.
3. **No copyrighted conversation content in the repo.** Entries contain
   original editorial titles/descriptions/curator notes — never transcript
   excerpts. Local working material (`temp_data_repo/`, `data/artifacts/`) is
   gitignored and must never be committed.
4. **Multi-provider.** Live providers: `claude`, `gemini`, `chatgpt`, `grok`.
   Never brand a feature around one provider (that is why `kind` is a separate
   field from `provider` — an artifact is not a Claude-only concept).
5. Keep it lean: no component libraries, no CMS, no state management.
6. **Do not build:** user submissions, contributor terms, dead-link checking,
   takedown forms, Reddit integration, comments, votes, trending, newsletters,
   accounts. `reddit_url` exists in the schema only.
   Why, and the items adjacent to these that *are* open, are in `docs/ROADMAP.md`.
   (A controlled tag vocabulary was on this list until 2026-07-28, when the
   operator reversed it and it shipped — see the tag convention below.)

## Editorial standards (learned the hard way — apply to every entry)

- **Never publish an entry whose source you have not read.** No exceptions,
  including for bulk imports and catalog metadata.
- **Descriptions are 140–160 characters.** The schema tolerates 100–200; the
  editorial bar is 140–160. Titles ≤ 70 chars (schema allows 80).
- **Never name the human participant**, or use any personal name, email, phone
  number, or street address from a conversation or artifact. Public figures who
  are the *topic* may be named.
- **Screen and skip:** identifiable personal/medical/financial/legal
  circumstances of a private individual; harassment or sexual content;
  working exploits or censorship-circumvention setups; thinly-veiled marketing
  for a specific business; mostly non-English content; broken or mundane items.
- **No marketing voice.** No "addictive", "powerful", "seamless",
  "revolutionary", no exclamation marks. Say plainly what the thing is.
- **Never credit the tool.** No "Built with Claude AI" in entry copy. Naming
  Claude Code etc. is fine when it is genuinely the *subject*.
- Dead links happen — verify before publishing, and drop what does not resolve.

## Conventions

- Astro (currently v7) + Tailwind 4 + TypeScript, pragmatic types.
- npm (not bun/yarn) — deploy target is Cloudflare Pages running `npm run build`.
- Content collection `entries` defined in `src/content.config.ts` (Astro's
  current location; the spec's older `src/content/config.ts` path predates
  Astro 5). Entry markdown files live in `src/content/entries/`.
- `kind` (`chat` | `artifact`) is orthogonal to `provider` and decides the
  route: `/chats/[slug]/` or `/artifacts/[slug]/`. Both render through
  `src/components/EntryDetail.astro`; use `entryPath()` from `src/lib/entries.ts`
  for any link to an entry — never hardcode `/chats/`.
- **Tags are a closed vocabulary** declared in `src/content.config.ts`: 20
  `CATEGORIES` and 80 `TAGS`. Every entry carries exactly 5 values — `tags[0]` is
  the category and renders as the filled leading pill, `tags[1..4]` are tags. The
  schema rejects anything else at build time and names the offending value. Adding
  a vocabulary value is an editorial decision about the whole corpus, never a
  shortcut for one awkward entry; the list is small on purpose.
- **Read the entry collection only through `liveEntries()`** in
  `src/lib/entries.ts`; never call `getCollection('entries')` anywhere else. It is
  the single point that drops non-`live` entries, so bypassing it silently
  republishes a dead or editorially pulled entry. Same rule for `facetTags()` —
  Pagefind filter values come from there, not from literals.
- Slug = entry filename. URLs use trailing slashes (`trailingSlash: 'always'`).
- `rel="canonical"` always points at the page's own sharedchats.com URL.
- Outbound source links: `target="_blank" rel="noopener nofollow ugc"`.
- No client-side JS except Pagefind on /search and the consent/GA snippet.
- Conventional commits (`feat:`, `fix:`, `chore:`, ...), no attribution lines.
- `scripts/ingest.ts` transforms local CSV → entry files, deduping on
  `source_url`. It makes zero network requests. `data/entries.csv` is the
  source of record — keep it in sync when editing entry files directly.
- After every change: `npm run build` must pass and the post-build internal
  link check must be clean.
- After every deploy, purge the Cloudflare cache (see README) — otherwise new
  URLs serve stale 404s from the edge for several minutes.

## Roadmap

The backlog lives in `docs/ROADMAP.md` — read it before proposing or starting a
feature. Constraint 6 above is the short form of its "not building" list; nothing
else to track belongs in this file.
