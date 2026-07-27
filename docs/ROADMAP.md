# Roadmap — sharedchats.com

The single tracker for what to build next and what we have decided not to build.
`CLAUDE.md` holds constraints, editorial standards, and conventions only —
nothing that needs tracking lives there.

Measured 2026-07-27: 524 entries (300 artifacts, 224 chats) across 4 live
providers, 541 unique tags, 462 of those tags on fewer than 5 entries.

## Backlog

Roughly ordered by value ÷ cost. Unchecked = not started. (Items 1–5 here were
1, 2, 4, 5, 6 in the original shortlist; the old item 3 is under *Considered and
skipped*.)

### [ ] 1. Thin the tag surface

`/tags/` renders all 541 tags as pills, and we generate 541 tag pages of which
462 hold 1–4 entries. Unscannable for a human, thin content for a crawler.

- Show only tags with ≥ 5 entries in the main cloud on `src/pages/tags/index.astro`;
  drop the rest below a smaller heading or omit them.
- Emit `<meta name="robots" content="noindex,follow">` on tag pages under the
  threshold (`src/pages/tags/[tag]/[...page].astro`), so the pages still resolve
  for existing links but stop competing in the index.
- ~10 lines, 2 files. Keep the pages — deleting routes would break inbound links
  and the post-build link check.

**Needs your call:** the durable fix is a controlled tag vocabulary, which is on
the *Not building* list below. This item is the version that does not touch it
and does not re-tag 524 files.

### [ ] 2. Pagefind filters on /search

Verified absent — no `data-pagefind-filter` anywhere in `src/`. At 524 entries
the results are one flat list; provider / kind / tag facets are built into
Pagefind and need no new dependency.

- Put the filter values on the **indexed root** — the `<article data-pagefind-body>`
  at `src/components/EntryDetail.astro:50`. That component renders both kinds and
  every provider, so the values must interpolate from frontmatter, never be
  literals: `data-pagefind-filter={`kind:${kind}`}`, same for `provider`. A
  hardcoded `"kind:chat"` there would file all 524 entries as chats.
- Tags need a different shape: one attribute holds one value, and `tags` is an
  array of up to 6. Emit one hidden, **non-ignored** element per tag rather than
  a joined string.
- Do **not** hang any of this off the tag pills (`:108`) or the provider/date
  meta row (`:59`). Both sit inside `data-pagefind-ignore`, Pagefind strips
  ignored subtrees before indexing, and the result is an empty filter panel that
  reads like a config bug.
- `npm run build` reports `Indexed N filters` — currently `0`. That line is the
  check that the attributes actually landed.
- Then enable the panel in the `PagefindUI` init in `src/pages/search/index.astro`.
- ~5 lines, 2 files.

### [ ] 3. provider × kind listing pages

`/providers/claude/artifacts/`, `/providers/gemini/chats/`, and so on. 8
providers × 2 kinds is a manageable page count, each page has real depth, and it
adds internal links between the two halves of the site.

- Extend `src/pages/providers/[provider]/[...page].astro` or add a nested route.
- Needs its own intro copy per combination, same as `PROVIDER_INTROS` in
  `src/lib/entries.ts` — a bare filtered list is a thin page.

**Explicitly not doing:** `tag × kind`. That is ~1,000 near-empty pages, the same
mistake as item 1 but larger.

### [ ] 4. Decide on the `status` field: read it or delete it

`status: z.enum(['live','dead','removed'])` is declared in
`src/content.config.ts:33` and hardcoded to `"live"` by `scripts/ingest.ts:166`.
Verified never read anywhere in `src/` or `scripts/`. Zero entries are currently
non-live. A schema field nothing consumes is dead weight either way.

- **Option A** — filter `status !== 'live'` out of the listings and the sitemap,
  one line in a shared helper in `src/lib/entries.ts`.
- **Option B** — delete the field from the schema, the ingest script, and the
  524 entry files (mechanical, and `data/entries.csv` has to match).

**Needs your call:** Option A is not the banned "dead-link checking" — that ban
is on *automated* checking, and this reads a flag a human set by hand. Saying so
out loud rather than reinterpreting the ban quietly.

### [ ] 5. `/random`

Cheap, and right for a browse-first site — but it needs an inline script, and
`CLAUDE.md` says no client-side JS except Pagefind and the consent/GA snippet.

- **With the exception:** a build-time JSON list of entry paths plus ~5 lines of
  inline JS. Genuinely random per visit.
- **Without it:** shuffle at build time, which serves every visitor the same
  "random" entry until the next deploy. That defeats most of the point.

**Needs your call:** grant the one-line JS exception, or accept the weaker
build-time version, or drop the item.

## Considered and skipped

- **Curated collections** ("12 physics simulations worth opening") — good
  long-tail play and it is what a curation site is for, but deferred for now.
  Adjacent to the banned controlled tag vocabulary.
- **Per-tag / per-provider RSS feeds** — near free to add, close to nobody
  subscribes.
- **Sort / filter controls on listing pages** — Pagefind facets (item 2) cover
  the same need without client state.

## Not building

User submissions, contributor terms, dead-link checking, takedown forms, Reddit
integration, comments, votes, trending, controlled tag vocabulary, newsletters,
accounts. `reddit_url` exists in the schema only (see item 4 for `status`).

This list is also constraint 6 in `CLAUDE.md`, so an agent reading only that file
still sees it. Keep the two in sync — `CLAUDE.md` carries the bare list, the
reasons and the adjacent-but-open items (1, 4) stay here.

## Already shipped — do not re-propose

Related entries (`relatedEntries()` in `src/lib/entries.ts`), tag counts on
`/tags/`, dark mode, OG images (`astro-og-canvas`), RSS, sitemap, `llms.txt`,
JSON-LD, `/stats`, Pagefind search itself, the post-build internal link check.
