import { getCollection } from 'astro:content';
import { OGImageRoute } from 'astro-og-canvas';
import { PROVIDER_LABELS } from '../../lib/entries';

const entries = await getCollection('entries');

type OgPage = { title: string; description: string };

const pages: Record<string, OgPage> = Object.fromEntries(
  entries.map((e) => [
    `chats/${e.id}`,
    {
      title: e.data.title,
      description: `${PROVIDER_LABELS[e.data.provider] ?? e.data.provider} · sharedchats.com`,
    },
  ])
);

pages['default'] = {
  title: 'SharedChats',
  description: 'Interesting AI conversations, curated by humans · sharedchats.com',
};

export const { getStaticPaths, GET } = await OGImageRoute({
  param: 'route',
  pages,
  getImageOptions: (_path, page: OgPage) => ({
    title: page.title,
    description: page.description,
    bgGradient: [
      [24, 24, 27],
      [9, 9, 11],
    ],
    border: { color: [217, 119, 6], width: 16, side: 'block-end' },
    padding: 72,
    font: {
      title: { size: 64, families: ['Inter'], weight: 'Bold', color: [250, 250, 250], lineHeight: 1.2 },
      description: { size: 32, families: ['Inter'], color: [161, 161, 170] },
    },
    fonts: ['./src/fonts/inter-latin-700-normal.ttf', './src/fonts/inter-latin-400-normal.ttf'],
  }),
});
