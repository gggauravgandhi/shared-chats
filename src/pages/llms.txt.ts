import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { PROVIDER_LABELS } from '../lib/entries';

const SITE = 'https://sharedchats.com';

export const GET: APIRoute = async () => {
  const entries = await getCollection('entries');
  const providers = [...new Set(entries.map((e) => e.data.provider))].sort();

  const body = `# SharedChats

> A human-curated index of interesting, publicly shared AI conversations. We write original titles and summaries and link to the original share pages on each provider's own site. We never host or reproduce transcript content.

Currently indexing ${entries.length} conversations.

## Key pages

- About: ${SITE}/about/
- FAQ: ${SITE}/faq/
- Browse all chats: ${SITE}/chats/
- Browse artifacts: ${SITE}/artifacts/
- Tag index: ${SITE}/tags/
${providers.map((p) => `- ${PROVIDER_LABELS[p] ?? p} conversations: ${SITE}/providers/${p}/`).join('\n')}
- Stats: ${SITE}/stats/

## Data

- Entry metadata for the 50 newest entries is available in the RSS feed: ${SITE}/rss.xml
- Full page index: ${SITE}/sitemap-index.xml
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
