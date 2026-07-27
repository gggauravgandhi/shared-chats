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

### [x] 2. Pagefind filters on /search — shipped 2026-07-27

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
**What shipped, and two Pagefind facts that cost a build each to learn:**

- Facets are `kind`, `provider`, and `tag`. Build reports `Indexed 3 filters`.
- **Inline `name:value` captures to the end of the attribute.** So
  `data-pagefind-filter="kind:Chat, provider:Claude"` does *not* create two
  filters — it creates one `kind` whose value is the literal string
  `"Chat, provider:Claude"`. Multiple keys on one element need the selector form:
  `data-pagefind-filter="kind[data-kind], provider[data-provider]"` with the
  values in those `data-` attributes. This is on the `<h1>` in `EntryDetail.astro`.
- **Pagefind skips `hidden` elements.** A hidden div of filter values indexes as
  nothing. The tag facet therefore hangs off the *visible* tag pills.
- The tag pills lost their `data-pagefind-ignore` on purpose: a tag is the only
  place a topic word like `three-js` appears on the page, so ignoring that block
  had made tags entirely unsearchable. Now every tag is indexed as text, while
  only tags with ≥ `TAG_FACET_MIN` (5) entries get a filter checkbox — 79 of 541,
  instead of a filter pane as unusable as `/tags/`.
- `showEmptyFilters: false` in the `PagefindUI` init, so the pane narrows as you type.
- Verify with `npm run build`: the `Indexed N filters` line, plus decoding a
  fragment (`gunzip -c dist/pagefind/fragment/*.pf_fragment`) to see the actual
  per-page filter values. The count alone would not have caught the bug above.

### [ ] 3. provider × kind listing pages — blocked on the data, not on effort

Approved 2026-07-27 and then not built, because measuring the actual distribution
killed the premise. The item was scoped against the 8-value `PROVIDERS` enum; only
4 are live, and the kinds are not spread across them at all:

| combination | entries |
| --- | --- |
| claude × artifact | 300 |
| claude × chat | 216 |
| gemini × chat | 5 |
| grok × chat | 2 |
| chatgpt × chat | 1 |

Gemini, Grok and ChatGPT have **zero** artifacts, so `/providers/gemini/chats/`
would be byte-identical to the existing `/providers/gemini/`. And every artifact
on the site is Claude's, so `/providers/claude/artifacts/` (300) duplicates
`/artifacts/` (300) exactly, while `/providers/claude/chats/` (216) is 96% of
`/chats/` (224). All five combinations duplicate a page that already exists —
about 10 new paginated URLs carrying no new information, which is the opposite of
the "real depth" this item was for. Item 2's facets give a reader the same
provider+kind narrowing with no new URLs.

**Re-check when a second provider has entries of both kinds.** The condition to
build is a real split, not a page count: emit `/providers/[p]/[kind]/` only where
the provider has both kinds *and* ≥5 of the kind being listed.

**Explicitly not doing:** `tag × kind`. That is ~1,000 near-empty pages, the same
mistake as item 1 but larger.

### [x] 4. The `status` field is now read — shipped 2026-07-27

`status: z.enum(['live','dead','removed'])` is declared in
`src/content.config.ts:33` and hardcoded to `"live"` by `scripts/ingest.ts:166`.
Verified never read anywhere in `src/` or `scripts/`. Zero entries are currently
non-live. A schema field nothing consumes is dead weight either way.

Resolved as Option A — filtered at build time. This is not the banned "dead-link
checking": that ban is on *automated* checking, and this reads a flag a human set
by hand.

**How it works:** `liveEntries()` in `src/lib/entries.ts` is now the only thing in
the codebase that calls `getCollection('entries')`. It filters `status === 'live'`,
and every one of the 17 former call sites goes through it — including the
`getStaticPaths` of both detail routes. So a non-live entry gets **no page at
all**, and therefore falls out of the sitemap, OG images, the Pagefind index,
related-entries, RSS, llms.txt and every count with no extra plumbing. Its URL
404s into the styled 404 page, which lists recent entries.

`dead` and `removed` deliberately behave the same. Keeping a tombstone page alive
for `dead` would preserve the URL, but `removed` means an editor pulled the entry
— sometimes because it exposed someone's personal details — and that page must
not survive. One behaviour, and the stricter one.

**Verified** by flipping one `featured: true` entry to `status: "dead"` and
rebuilding: no detail page, no OG image, 0 sitemap hits, 0 homepage hits, 0 tag
page hits, counts 524 → 523, Pagefind 524 → 523 pages, internal link check still
clean. Then reverted. Re-run that flip if you touch `liveEntries()` — with all
entries live, nothing else exercises this path.

**If a 404 on a previously indexed URL ever matters,** the options are a redirect
map or a tombstone page for `dead` only. Not built: zero entries are non-live, and
`removed` must 404 regardless.

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
JSON-LD, `/stats`, Pagefind search itself, the post-build internal link check,
Pagefind `kind`/`provider`/`tag` facets (item 2), and the `status` filter (item 4).
