# sharedchats.com

A curated discovery site for interesting, publicly shared AI conversations and
interactive artifacts. Humans find share links (Claude, Gemini, ChatGPT, Grok),
write original titles and summaries, and publish entries that link back to the
original on the provider's own share page. Fully static: Astro 7 + Tailwind 4 +
Pagefind.

The site never fetches, scrapes, or reproduces conversation content — entries
are human-written metadata plus an outbound link. See `CLAUDE.md` for the hard
constraints and the editorial standards every entry must meet.

## Commands

```sh
npm install
npm run dev        # dev server
npm run build      # astro build + pagefind index + internal link check → dist/
npm run preview    # serve the production build locally
```

## Deploy

Live at **https://sharedchats.com** (Cloudflare Pages project `sharedchats`,
direct upload — not git-connected). To ship changes:

```sh
set -a; source .env; set +a   # CLOUDFLARE_API_TOKEN, CF_ZONE_ID, PUBLIC_GA_ID (gitignored)
npm run build
npx wrangler pages deploy dist --project-name sharedchats --branch main

# then purge the edge cache, or new URLs 404 for a few minutes:
curl -s -X POST -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" -d '{"purge_everything":true}' \
  "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/purge_cache"
```

`llms.txt`, the sitemap, RSS, OG images, and the Pagefind index are all
regenerated automatically by `npm run build`. Full setup notes: `DEPLOY.md`.

## Content model

One markdown file per entry in `src/content/entries/` (schema in
`src/content.config.ts`). The filename is the slug/URL. Frontmatter only —
entry bodies are optional editorial blurbs, never conversation content.

Two orthogonal dimensions:

- **`kind`** — `chat` or `artifact`. Decides the route (`/chats/[slug]/` vs
  `/artifacts/[slug]/`) and each section's listing page.
- **`provider`** — which AI made it. Drives `/providers/[provider]/`.

They are deliberately separate: an artifact is not a Claude-only idea, so any
provider can have either kind. Link to entries with `entryPath()` from
`src/lib/entries.ts` rather than hardcoding a path.

### Editorial standards

Every entry is written after reading the actual source. Descriptions run
140–160 characters, titles stay under 70, and no entry names a conversation's
human participant or carries anyone's contact details. Full list in
`CLAUDE.md`.

## Ingesting entries from CSV

Bulk-load hand-curated entries from a CSV:

```sh
node scripts/ingest.ts data/entries.csv        # default path
node scripts/ingest.ts data/entries.sample.csv # sample fixture
```

### CSV column spec

Header row must be exactly:

```
title,description,source_url,provider,tags,date_discovered,featured,curator_note,content_warning
```

| Column | Required | Format |
| --- | --- | --- |
| `title` | yes | ≤ 80 chars (≤ 70 recommended) |
| `description` | yes | 140–160 chars recommended; becomes the meta description |
| `source_url` | yes | valid URL to the provider's share page; never fetched |
| `provider` | yes | one of `claude` `chatgpt` `gemini` `grok` `perplexity` `copilot` `deepseek` `other` |
| `tags` | yes | 1–6 pipe-separated lowercase-kebab tags, e.g. `coding\|three-js` |
| `date_discovered` | yes | `YYYY-MM-DD` — the date the curator found it |
| `featured` | no | `true` / `false` (default false) |
| `curator_note` | no | 1–2 sentences, rendered as "Why we picked it" |
| `content_warning` | no | short phrase; renders a warning banner when present |
| `kind` | no | `chat` (default) or `artifact`; artifacts render under `/artifacts/` |

Standard CSV quoting applies (RFC 4180): wrap fields containing commas or
quotes in double quotes, double any embedded quotes.

Behavior: slugs are generated from titles (deduped with `-2`, `-3` …), rows
whose `source_url` already exists in an entry are skipped, invalid rows are
reported with reasons, and a `created / skipped / invalid` summary is printed.
The script transforms local files only — it makes zero network requests.
