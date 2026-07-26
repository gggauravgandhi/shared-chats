// CSV → entry .md files. Local file transformation only — zero network requests.
// Usage: node scripts/ingest.ts [path/to/entries.csv]   (default: data/entries.csv)
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ENTRIES_DIR = 'src/content/entries';
const PROVIDERS = ['claude', 'chatgpt', 'gemini', 'grok', 'perplexity', 'copilot', 'deepseek', 'other'];
const COLUMNS = [
  'title',
  'description',
  'source_url',
  'provider',
  'tags',
  'date_discovered',
  'featured',
  'curator_note',
  'content_warning',
];

// Minimal RFC 4180 parser: quoted fields, escaped quotes, newlines in fields.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    if (row.length > 1 || row[0] !== '') rows.push(row);
  }
  return rows;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// YAML scalar via JSON string (valid YAML double-quoted style)
const yamlStr = (s: string) => JSON.stringify(s);

function main() {
  const csvPath = process.argv[2] ?? 'data/entries.csv';
  const text = readFileSync(csvPath, 'utf8');
  const rows = parseCsv(text);
  const header = rows.shift();
  if (!header || header.join(',') !== COLUMNS.join(',')) {
    console.error(`Header must be exactly: ${COLUMNS.join(',')}`);
    process.exit(1);
  }

  mkdirSync(ENTRIES_DIR, { recursive: true });
  const existingSlugs = new Set<string>();
  const existingUrls = new Set<string>();
  for (const f of readdirSync(ENTRIES_DIR).filter((f) => f.endsWith('.md'))) {
    existingSlugs.add(f.replace(/\.md$/, ''));
    const m = readFileSync(join(ENTRIES_DIR, f), 'utf8').match(/^source_url:\s*"?([^"\n]+)"?\s*$/m);
    if (m) existingUrls.add(m[1]);
  }

  let created = 0;
  let skipped = 0;
  const invalid: string[] = [];

  rows.forEach((cols, idx) => {
    const line = idx + 2; // 1-based + header
    if (cols.length !== COLUMNS.length) {
      invalid.push(`line ${line}: expected ${COLUMNS.length} columns, got ${cols.length}`);
      return;
    }
    const r = Object.fromEntries(COLUMNS.map((c, i) => [c, cols[i].trim()])) as Record<string, string>;

    const problems: string[] = [];
    if (!r.title) problems.push('missing title');
    if (r.title.length > 80) problems.push('title > 80 chars');
    if (!r.description) problems.push('missing description');
    try {
      new URL(r.source_url);
    } catch {
      problems.push(`invalid source_url "${r.source_url}"`);
    }
    if (!PROVIDERS.includes(r.provider)) problems.push(`unknown provider "${r.provider}"`);
    const tags = r.tags.split('|').map((t) => t.trim()).filter(Boolean);
    if (tags.length < 1 || tags.length > 6) problems.push('need 1-6 tags');
    for (const t of tags) {
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(t)) problems.push(`tag "${t}" not lowercase-kebab`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date_discovered) || isNaN(Date.parse(r.date_discovered))) {
      problems.push(`bad date_discovered "${r.date_discovered}"`);
    }
    if (r.featured && !['true', 'false', ''].includes(r.featured)) {
      problems.push(`featured must be true/false, got "${r.featured}"`);
    }
    if (problems.length) {
      invalid.push(`line ${line} (${r.title || 'untitled'}): ${problems.join('; ')}`);
      return;
    }

    if (existingUrls.has(r.source_url)) {
      console.log(`skip (source_url exists): ${r.title}`);
      skipped++;
      return;
    }

    let slug = slugify(r.title);
    if (!slug) {
      invalid.push(`line ${line}: title produces empty slug`);
      return;
    }
    if (existingSlugs.has(slug)) {
      let n = 2;
      while (existingSlugs.has(`${slug}-${n}`)) n++;
      slug = `${slug}-${n}`;
    }

    const fm = [
      '---',
      `title: ${yamlStr(r.title)}`,
      `description: ${yamlStr(r.description)}`,
      `source_url: ${yamlStr(r.source_url)}`,
      `provider: ${yamlStr(r.provider)}`,
      `tags: [${tags.map(yamlStr).join(', ')}]`,
      `date_discovered: ${r.date_discovered}`,
      `featured: ${r.featured === 'true'}`,
      `curator_note: ${yamlStr(r.curator_note)}`,
      `content_warning: ${yamlStr(r.content_warning)}`,
      `language: "en"`,
      `status: "live"`,
      `reddit_url: ""`,
      '---',
      '',
    ].join('\n');

    writeFileSync(join(ENTRIES_DIR, `${slug}.md`), fm);
    existingSlugs.add(slug);
    existingUrls.add(r.source_url);
    created++;
  });

  console.log(`\ncreated: ${created}, skipped: ${skipped}, invalid: ${invalid.length}`);
  for (const msg of invalid) console.log(`  INVALID ${msg}`);
  if (invalid.length) process.exitCode = 1;
}

main();
