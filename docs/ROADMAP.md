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

### [x] 1. Thin the tag surface — shipped 2026-07-28 as a controlled vocabulary

The original plan here was the cheap version: hide rare tags on `/tags/` and
`noindex` their pages, explicitly *because* a controlled vocabulary was banned.
The operator lifted the ban, so the durable fix shipped instead.

**Before:** 541 free-form tags, 462 of them on fewer than 5 entries, 1–6 per
entry, mixing three axes in one flat list — domain (`finance`), format
(`dashboard`) and medium (`interactive`).

**Now:** 20 `CATEGORIES` + 80 `TAGS` declared in `src/content.config.ts`. Every
entry carries exactly 5 values: `tags[0]` is the category, `tags[1..4]` are tags.
The schema enforces it and names the offending value on failure. Separating the
axes is what made the list shrinkable — categories are domains, while tags carry
format (what an artifact *is*) and treatment (what a conversation *does*)
alongside topic.

All 20 categories and all 80 tags are in use; nothing in the vocabulary is dead.
Category spread: ai 72, business 67, software 66, finance 38, education 37,
health 33, science 25, games 24, arts 22, language 20, philosophy 19, society 19,
writing 18, productivity 13, history 11, mathematics 11, engineering 9,
lifestyle 9, data 8, culture 3.

**How it was done:** 524 entries re-tagged by fanned-out agents reading each
entry's title and description, every batch then rechecked by a second adversarial
agent. An apply script validated all 524 against the vocabulary and refused to
write unless every one passed, then rewrote both the markdown and the `tags`
column in `data/entries.csv`.

**Known gaps, deliberately left:**

- No `music` or `film` tag. A jazz-composition entry ends up with three treatment
  tags because nothing topical fits. `converter` is the weakest slot (7 entries)
  and would be the one to trade if this becomes annoying — not free, since it
  means re-tagging those entries.
- A few pure fiction-generation chats carry no treatment tag: none of
  explainer/analysis/guide/research/reference/tutorial/comparison/debate/
  case-study/fact-check honestly describes "wrote a short story". Padding one in
  would be exactly the lazy tagging the vocabulary exists to prevent.
- `culture` holds only 3 entries. Watch it; if it stays that thin, fold it into
  `society` or `arts`.

**Fallout:** the old vocabulary generated 541 tag pages, the new one generates
100. The retired tag URLs now 404. Nothing on the site links to them — the
post-build link check is clean — but external and indexed links break. A
`public/_redirects` map from retired tag to nearest surviving category is the fix
if that matters; not built, since most of those pages held 1–2 entries.

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
- **Adjacent inline elements get no word boundary.** As bare adjacent `<span>`s
  the pills indexed as one merged token — `aicodingdspy` — so the tag words were
  still unsearchable while looking fixed. They are now `<li>` children of a
  `<ul>`, the same shape `/tags/` uses. The `Indexed N filters` line cannot catch
  this; only reading a fragment's `content` tail can.
- The tag pills lost their `data-pagefind-ignore` on purpose: a tag is the only
  place a topic word like `three-js` appears on the page, so ignoring that block
  had made tags entirely unsearchable. Now every tag is indexed as text, while
  only tags with ≥ `TAG_FACET_MIN` (5) entries get a filter checkbox — 79 of 541,
  instead of a filter pane as unusable as `/tags/`.
- `showEmptyFilters: false` in the `PagefindUI` init, so the pane narrows as you type.
- Verify with `npm run build`: the `Indexed N filters` line, plus decoding a
  fragment (`gunzip -c dist/pagefind/fragment/*.pf_fragment`) to see the actual
  per-page filter values. The count alone would not have caught the bug above.

### [ ] 3. provider × kind listing pages — PENDING, decide later

Approved 2026-07-27, then parked at the operator's direction pending a later
decision. Not built because measuring the actual distribution killed the premise. The item was scoped against the 8-value `PROVIDERS` enum; only
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
integration, comments, votes, trending, newsletters, accounts. `reddit_url`
exists in the schema only (see item 4 for `status`).

**Removed from this list 2026-07-28:** controlled tag vocabulary. The operator
reversed the ban and it shipped — see item 1.

This list is also constraint 6 in `CLAUDE.md`, so an agent reading only that file
still sees it. Keep the two in sync — `CLAUDE.md` carries the bare list, the
reasons and the adjacent-but-open items (1, 4) stay here.

## Already shipped — do not re-propose

Related entries (`relatedEntries()` in `src/lib/entries.ts`), tag counts on
`/tags/`, dark mode, OG images (`astro-og-canvas`), RSS, sitemap, `llms.txt`,
JSON-LD, `/stats`, Pagefind search itself, the post-build internal link check,
Pagefind `kind`/`provider`/`tag` facets (item 2), and the `status` filter (item 4).
