// Post-build internal link checker. Local files only — zero network requests.
// Fails (exit 1) on any internal href/src that doesn't resolve to a file in dist/,
// or any internal page link missing its trailing slash.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';

function htmlFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...htmlFiles(p));
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

const SKIP = /^(https?:|mailto:|tel:|data:|#|\/\/)/;
const errors: string[] = [];
const files = htmlFiles(DIST);

for (const file of files) {
  const html = readFileSync(file, 'utf8');
  const pagePath = '/' + file.slice(DIST.length + 1).replace(/index\.html$/, '');
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const raw = m[1];
    if (SKIP.test(raw) || raw === '') continue;
    const path = decodeURIComponent(new URL(raw, `https://x.local${pagePath}`).pathname);
    if (path.endsWith('/')) {
      if (!existsSync(join(DIST, path, 'index.html'))) {
        errors.push(`${pagePath} -> ${raw} (no ${path}index.html)`);
      }
    } else if (/\.[a-z0-9]+$/i.test(path)) {
      if (!existsSync(join(DIST, path))) {
        errors.push(`${pagePath} -> ${raw} (missing file)`);
      }
    } else {
      // extensionless page link: broken, or missing its trailing slash
      errors.push(
        existsSync(join(DIST, path, 'index.html'))
          ? `${pagePath} -> ${raw} (missing trailing slash)`
          : `${pagePath} -> ${raw} (broken)`
      );
    }
  }
}

console.log(`checked ${files.length} html files`);
if (errors.length) {
  console.error(`${errors.length} broken internal link(s):`);
  for (const e of errors) console.error('  ' + e);
  process.exit(1);
}
console.log('internal links OK');
