# sharedchats.com

A curated discovery site for interesting, publicly shared AI conversations.
Humans find share links (Claude, ChatGPT, Gemini, …), write original titles and
summaries, and publish entries that link to the original conversation on the
provider's own share page. Fully static: Astro 7 + Tailwind 4 + Pagefind.

The site never fetches, scrapes, or reproduces conversation content — entries
are human-written metadata plus an outbound link. See `CLAUDE.md` for the hard
constraints.

## Commands

```sh
npm install
npm run dev        # dev server
npm run build      # astro build + pagefind index + internal link check → dist/
npm run preview    # serve the production build locally
```

Deployment: see `DEPLOY.md` (Cloudflare Pages).

## Content model

One markdown file per entry in `src/content/entries/` (schema in
`src/content.config.ts`). The filename is the slug/URL. Frontmatter only —
entry bodies are optional editorial blurbs, never conversation content.

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

Standard CSV quoting applies (RFC 4180): wrap fields containing commas or
quotes in double quotes, double any embedded quotes.

Behavior: slugs are generated from titles (deduped with `-2`, `-3` …), rows
whose `source_url` already exists in an entry are skipped, invalid rows are
reported with reasons, and a `created / skipped / invalid` summary is printed.
The script transforms local files only — it makes zero network requests.
