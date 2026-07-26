import type { Entry } from './entries';

export interface SiteStats {
  total: number;
  perProvider: [string, number][];
  topTags: [string, number][];
  perMonth: [string, number][];
  latest: Date;
}

export function computeStats(entries: Entry[]): SiteStats {
  const perProvider = new Map<string, number>();
  const tagCounts = new Map<string, number>();
  const perMonth = new Map<string, number>();
  let latest = new Date(0);

  for (const e of entries) {
    perProvider.set(e.data.provider, (perProvider.get(e.data.provider) ?? 0) + 1);
    for (const t of e.data.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    const month = e.data.date_discovered.toISOString().slice(0, 7);
    perMonth.set(month, (perMonth.get(month) ?? 0) + 1);
    if (e.data.date_discovered > latest) latest = e.data.date_discovered;
  }

  return {
    total: entries.length,
    perProvider: [...perProvider.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
    topTags: [...tagCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 20),
    perMonth: [...perMonth.entries()].sort((a, b) => a[0].localeCompare(b[0])),
    latest,
  };
}
