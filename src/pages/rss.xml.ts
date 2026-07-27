import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { byDateDesc, entryPath } from '../lib/entries';

export async function GET(context: APIContext) {
  const entries = (await getCollection('entries')).sort(byDateDesc).slice(0, 50);
  return rss({
    title: 'SharedChats',
    description: 'Interesting AI conversations, curated by humans. New entries as we find them.',
    site: context.site!,
    items: entries.map((e) => ({
      title: e.data.title,
      description: e.data.description,
      link: entryPath(e),
      pubDate: e.data.date_discovered,
    })),
  });
}
