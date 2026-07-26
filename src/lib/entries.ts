import type { CollectionEntry } from 'astro:content';

export type Entry = CollectionEntry<'entries'>;

export const PAGE_SIZE = 24;

export const PROVIDER_LABELS: Record<string, string> = {
  claude: 'Claude',
  chatgpt: 'ChatGPT',
  gemini: 'Gemini',
  grok: 'Grok',
  perplexity: 'Perplexity',
  copilot: 'Copilot',
  deepseek: 'DeepSeek',
  other: 'Other',
};

// Literal class strings so Tailwind's scanner picks them up.
export const PROVIDER_BADGE_CLASSES: Record<string, string> = {
  claude: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  chatgpt: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  gemini: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  grok: 'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300',
  perplexity: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300',
  copilot: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300',
  deepseek: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
  other: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400',
};

// Unique intro paragraph per provider landing page (SEO copy, §5).
export const PROVIDER_INTROS: Record<string, string> = {
  claude:
    'Shared Claude conversations, curated by humans. From Three.js physics toys to number-theory deep dives, these are the Claude share links we found worth reading — each entry links straight to the original chat on claude.ai.',
  chatgpt:
    'Publicly shared ChatGPT conversations worth your time, hand-picked by our editors. Every entry links to the original share page on chatgpt.com.',
  gemini:
    'Curated Gemini conversations shared publicly by their authors. We write the summaries; the full chats live on Google’s own share pages.',
  grok: 'Interesting Grok conversations, curated by humans and linked to the original share pages on x.com.',
  perplexity:
    'Publicly shared Perplexity threads our editors found interesting, each linking back to the original on perplexity.ai.',
  copilot:
    'Curated Microsoft Copilot conversations, summarized by our editors and linked to the original share pages.',
  deepseek:
    'Interesting DeepSeek conversations shared publicly by their authors, curated here with links to the originals.',
  other:
    'Interesting shared AI conversations from providers without their own section yet, curated by humans and linked to the originals.',
};

export function byDateDesc(a: Entry, b: Entry): number {
  return (
    b.data.date_discovered.getTime() - a.data.date_discovered.getTime() ||
    a.data.title.localeCompare(b.data.title)
  );
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export function relatedEntries(entry: Entry, all: Entry[], limit = 4): Entry[] {
  const tags = new Set(entry.data.tags);
  return all
    .filter((e) => e.id !== entry.id)
    .map((e) => ({ e, overlap: e.data.tags.filter((t) => tags.has(t)).length }))
    .filter(({ overlap }) => overlap > 0)
    .sort((x, y) => y.overlap - x.overlap || byDateDesc(x.e, y.e))
    .slice(0, limit)
    .map(({ e }) => e);
}

// Astro's paginate() URLs come without trailing slashes; keep ours consistent.
export function withTrailingSlash(url: string | undefined): string | undefined {
  if (!url) return undefined;
  return url.endsWith('/') ? url : `${url}/`;
}
