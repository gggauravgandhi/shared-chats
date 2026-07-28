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

// Controlled vocabulary. Every entry carries exactly 5 values: tags[0] is the
// category (the domain the entry is about, rendered as the leading pill) and the
// remaining 4 come from TAGS. Adding a value here is an editorial decision — the
// point of the list is that it stays small enough to browse.
export const CATEGORIES = [
  'ai', 'software', 'science', 'mathematics', 'engineering', 'philosophy', 'history',
  'business', 'finance', 'health', 'education', 'writing', 'games', 'arts', 'data',
  'productivity', 'society', 'culture', 'language', 'lifestyle',
] as const;

export const TAGS = [
  // format — what an artifact IS
  'interactive', 'dashboard', 'calculator', 'generator', 'simulation', 'quiz', 'flashcards',
  'form', 'tracker', 'planner', 'presentation', 'template', 'portfolio', 'landing-page',
  'converter', 'visualization', 'timeline', 'map',
  // treatment — what a conversation DOES
  'explainer', 'analysis', 'guide', 'research', 'reference', 'tutorial', 'comparison',
  'debate', 'case-study', 'fact-check',
  // topical
  'llm', 'prompting', 'ai-safety', 'agents', 'machine-learning', 'chatbot',
  'web-dev', 'python', 'javascript', 'debugging', 'algorithms', 'databases', 'devops',
  'security', 'api', 'open-source',
  'physics', 'biology', 'astronomy', 'climate', 'statistics', 'proofs', 'logic', 'medicine',
  'startup', 'marketing', 'investing', 'budgeting', 'economics', 'crypto', 'career',
  'ethics', 'politics', 'law', 'media', 'psychology', 'geopolitics', 'misinformation',
  'epistemology', 'consciousness',
  'fitness', 'nutrition', 'mental-health', 'study-skills', 'test-prep',
  'fiction', 'storytelling', 'humor', 'puzzle', 'sports', 'travel', 'food',
] as const;

const CATEGORY_SET: ReadonlySet<string> = new Set(CATEGORIES);
const TAG_SET: ReadonlySet<string> = new Set(TAGS);

const entries = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/entries' }),
  schema: z.object({
    title: z.string().min(1).max(80),
    description: z.string().min(100).max(200),
    source_url: z.string().url(),
    provider: z.enum(PROVIDERS),
    tags: z.array(z.string()).superRefine((t, ctx) => {
      const fail = (message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, message });
      if (t.length !== 5) fail(`expected exactly 5 tags (1 category + 4 tags), got ${t.length}`);
      if (t[0] !== undefined && !CATEGORY_SET.has(t[0])) {
        fail(`tags[0] "${t[0]}" is not a category — the first tag must be one of: ${CATEGORIES.join(', ')}`);
      }
      const unknown = t.slice(1).filter((x) => !TAG_SET.has(x));
      if (unknown.length) fail(`not in the tag vocabulary: ${unknown.join(', ')}`);
      if (new Set(t).size !== t.length) fail(`duplicate values in tags: ${t.join(', ')}`);
    }),
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
