# Deploying sharedchats.com to Cloudflare Pages

Static output only — no wrangler config needed.

## Cloudflare Pages settings

| Setting | Value |
| --- | --- |
| Framework preset | Astro (or None) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Production branch | `main` |

## Environment variables

| Variable | Value | Notes |
| --- | --- | --- |
| `NODE_VERSION` | `22` (or higher) | Astro 7 requires Node ≥ 22.12 |
| `PUBLIC_GA_ID` | `G-XXXXXXXXXX` | Google Analytics 4 measurement ID. Leave unset to ship with no analytics and no consent banner. |

Set both under **Pages project → Settings → Environment variables** (Production,
and Preview if you want analytics on previews — you probably don't).

## Analytics + Search Console

1. Create a GA4 property at analytics.google.com, copy the `G-…` measurement ID
   into `PUBLIC_GA_ID`, and redeploy. GA only loads after a visitor accepts the
   consent banner.
2. Verify the domain in Google Search Console (DNS TXT record via Cloudflare),
   then submit `https://sharedchats.com/sitemap-index.xml`.
3. Link the GA4 property to Search Console: GA4 → Admin → Product links →
   Search Console.

## Notes

- The build runs `astro build`, then `pagefind --site dist` (search index),
  then `node scripts/check-links.ts` (fails the build on any broken internal
  link). All three run offline — the build makes no network requests.
- Custom domain: add `sharedchats.com` under the Pages project → Custom
  domains. Cloudflare handles the cert.
