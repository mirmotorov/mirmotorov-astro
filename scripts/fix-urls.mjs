/**
 * scripts/fix-urls.mjs
 *
 * СКРИПТ АВТОМАТИЧЕСКОЙ ЗАМЕНЫ ВСЕХ ВНУТРЕННИХ <a href="/..."> ССЫЛОК НА href={u('/...')}
 * ВО ВСЕХ .astro ФАЙЛАХ ПРОЕКТА.
 *
 * 1. Находит ВСЕ файлы src/**\/*.astro
 * 2. Для каждого файла:
 *    2.1 Если НЕ ИМПОРТИРУЕТ { u } из _urls.astro → ДОБАВЛЯЕТ import
 *    2.2 Заменяет ВСЕ href="/abc" и href='/abc' → href={u('/abc')}
 *        НЕ ЗАМЕНЯЕТ: href="http..." / href="mailto:" / href="tel:" / href="#" (внешние / hash)
 *        НЕ ЗАМЕНЯЕТ: <img src="/..."> (это ассеты, Astro сам обрабатывает!)
 *        НЕ ЗАМЕНЯЕТ: form action="/...", style="background:url(/...)" — НУЖНО? нет — у нас style с CSS в основном.
 * 3. Перезаписывает файл (сохраняет UTF-8)
 *
 * ЗАПУСК: node scripts/fix-urls.mjs
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');
const SRC = join(PROJECT_ROOT, 'src');

function walk(dir, list = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, list);
    else if (f.endsWith('.astro')) list.push(p);
  }
  return list;
}

const ASTRO_FILES = walk(SRC);
console.log(`Найдено ${ASTRO_FILES.length} .astro файлов в src/`);

// Паттерн: href="/..." или href='/...' но НЕ href="http..." / mailto / tel / # / javascript / data / //
// ИСКЛЮЧАЕМ: href="#" (пустой hash только), href="?..." (query только сейчас?)
const HREF_REGEX = /\b(href)\s*=\s*(["'])(\/(?:(?!\2)[\s\S])*?)\2/g;

function isExternalOrHash(path) {
  if (!path) return true;
  if (path.startsWith('http:') || path.startsWith('https:') || path.startsWith('//')) return true;
  if (path.startsWith('mailto:')) return true;
  if (path.startsWith('tel:')) return true;
  if (path.startsWith('javascript:')) return true;
  if (path.startsWith('data:')) return true;
  if (path === '#' || path.startsWith('#')) return true;
  return false;
}

/**
 * Вычислить относительный путь import _urls.astro из папки где лежит файл
 * Пример: src/pages/index.astro → ../utils/_urls.astro
 * Пример: src/pages/catalog/[category]/[brand].astro → ../../../utils/_urls.astro
 * Пример: src/components/Header.astro → ../utils/_urls.astro
 */
function importPathFor(file) {
  const fileDir = dirname(file);
  const targetDir = join(PROJECT_ROOT, 'src', 'utils');
  // Вычислим относительный путь
  let rel = '';
  const fileParts = fileDir.split(/[\\/]+/).filter(Boolean);
  const targetParts = targetDir.split(/[\\/]+/).filter(Boolean);
  let i = 0;
  while (i < fileParts.length && i < targetParts.length && fileParts[i] === targetParts[i]) i++;
  const upCount = fileParts.length - i;
  for (let j = 0; j < upCount; j++) rel += '../';
  rel += targetParts.slice(i).join('/');
  if (!rel.endsWith('/')) rel += '/';
  rel += '_urls.astro';
  return rel;
}

let totalFixes = 0;
let filesFixed = 0;
let filesAddedImport = 0;

for (const file of ASTRO_FILES) {
  const src = readFileSync(file, 'utf8');
  let output = src;

  // Заменяем href="/abc" → href={u('/abc')} для внутренних ссылок
  let matches = 0;
  output = output.replace(HREF_REGEX, (all, attr, quote, path) => {
    if (isExternalOrHash(path)) return all;
    // Уже ли замена? Если путь начинается с {u( — пропускаем
    if (path.startsWith('{') || path.startsWith('{u(') || path.includes('u(')) return all;
    matches++;
    return `${attr}={u(${quote}${path}${quote})}`;
  });
  totalFixes += matches;

  // Если есть замены → НУЖНО ЛИ ДОБАВИТЬ IMPORT?
  if (matches > 0) {
    // Проверяем есть ли импорт { u } из ..._urls.astro
    const hasImport = /import\s*\{[^}]*\bu\b[^}]*\}\s*from\s*["'][^"']*_urls\.astro["']\s*;?/.test(output) ||
                       /import\s+u\s+from\s*["'][^"']*_urls\.astro["']\s*;?/.test(output);
    if (!hasImport) {
      const ipath = importPathFor(file);
      // Найти frontmatter (между первым --- и вторым ---)
      const fmMatch = output.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (fmMatch) {
        // Добавляем import в КОНЕЦ frontmatter, перед ---
        const fmContent = fmMatch[1];
        const IMPORT_LINE = `import { u } from '${ipath}';`;
        // Вставить после последнего import, или если нет импортов — в конец fm
        const newFm = /import\s+/.test(fmContent)
          ? fmContent.replace(/(import\s[^;\n]+;\s*\n)(?![\s\S]*import\s)/, '$1' + IMPORT_LINE + '\n')
          : fmContent + '\n' + IMPORT_LINE + '\n';
        output = output.replace(fmMatch[0], '---\n' + newFm + '---');
        filesAddedImport++;
      } else {
        console.warn(`  ⚠️ ${file}: нет frontmatter (---), не могу добавить import! Ручками.`);
      }
    }
    filesFixed++;
    writeFileSync(file, output, 'utf8');
  }
}

console.log('\n✅ ГОТОВО!');
console.log(`Файлов изменено: ${filesFixed}`);
console.log(`  Добавлено import _urls.astro: ${filesAddedImport}`);
console.log(`  Всего замен ссылок href="/..." → href={u("/...")}: ${totalFixes}`);
console.log('\nТеперь: npm run dev — проверка что всё работает!');
