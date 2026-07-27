import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const PROVIDERS = [
  'claude',
  'chatgpt',
  'gemini',
  'grok',
  'perplexity',
  'copilot',
  'deepseek',
  'other',
] as const;

const entries = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/entries' }),
  schema: z.object({
    title: z.string().min(1).max(80),
    description: z.string().min(100).max(200),
    source_url: z.string().url(),
    provider: z.enum(PROVIDERS),
    tags: z
      .array(z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'tags must be lowercase-kebab'))
      .min(1)
      .max(6),
    date_discovered: z.coerce.date(),
    kind: z.enum(['chat', 'artifact']).default('chat'),
    featured: z.boolean().default(false),
    curator_note: z.string().default(''),
    content_warning: z.string().default(''),
    language: z.string().default('en'),
    status: z.enum(['live', 'dead', 'removed']).default('live'),
    reddit_url: z.string().default(''),
  }),
});

export const collections = { entries };
