// Утилита для автоматической загрузки картинок товаров из папок src/assets/images/product/
// Не требует ручного импорта каждого файла — использует import.meta.glob
// Поддерживает технику, запчасти, аксессуары, экипировку

// 1) Загружаем ВСЕ изображения из product/ — автоматически, с eager-импортом
const techniqueImages = import.meta.glob(
  '/src/assets/images/product/**/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG}',
  { eager: true, import: 'default', query: { as: 'image' } }
) as Record<string, any>;

// 2) Строим индекс по коротким путям для быстрого поиска
type ImageMap = Record<string, any>;

function buildIndex(files: Record<string, any>): ImageMap {
  const map: ImageMap = {};
  for (const [fullPath, imgExport] of Object.entries(files)) {
    const variants = new Set<string>();

    // Убираем базовые префиксы чтобы получить короткий ключ
    let rel = fullPath.replace('/src/assets/images/product/', '');

    // Варианты путей под разные форматы записи в CSV
    variants.add(rel.toLowerCase());
    variants.add(rel.replace(/\//g, '__').toLowerCase());  // на случай если кто-то запишет через __
    variants.add(pathBasename(rel).toLowerCase());         // только имя файла

    // Варианты без technique/ на всякий случай
    if (rel.toLowerCase().startsWith('technique/')) {
      const withoutTech = rel.substring('technique/'.length);
      variants.add(withoutTech.toLowerCase());
      variants.add(pathBasename(withoutTech).toLowerCase());
    }
    // Варианты для каталога (zapchasti, aksessuary, ekipirovka)
    ['zapchasti', 'aksessuary', 'ekipirovka'].forEach((prefix) => {
      const prefixSlash = prefix + '/';
      if (rel.toLowerCase().startsWith(prefixSlash)) {
        const short = rel.substring(prefixSlash.length);
        variants.add(short.toLowerCase());
        variants.add(pathBasename(short).toLowerCase());
      }
    });

    for (const v of variants) {
      if (!v) continue;
      // Также пробируем вариант с пробелами/кодированием
      map[v] = imgExport;
      map[decodeURIComponent(v)] = imgExport;
      map[v.replace(/%20/g, ' ')] = imgExport;
      map[v.replace(/\s+/g, '-')] = imgExport;
    }
  }
  return map;
}

function pathBasename(p: string): string {
  const i = p.lastIndexOf('/');
  return i >= 0 ? p.substring(i + 1) : p;
}

const IMAGE_INDEX = buildIndex(techniqueImages);

/**
 * Универсальная функция: по короткому пути (как в CSV) найдет реальную картинку в assets.
 * Примеры входных путей:
 *   - "vezdehody-tinger/tinger-tf4-main.jpg"
 *   - "kvadrocikly-aodes/AODES-PATHCROSS-650-BLACK.jpg"
 *   - "/images/product/kvadrocikly-aodes/AODES-PATHCROSS-650-BLACK.jpg"  (старый формат)
 *   - "10001.jpg"  (по коду для запчастей — если есть папка)
 */
export function getProductImage(
  relPath: string | undefined | null,
  subFolderHint?: 'technique' | 'zapchasti' | 'aksessuary' | 'ekipirovka'
): any | null {
  if (!relPath) return null;

  // Нормализуем вход
  let clean = String(relPath).trim();
  if (!clean) return null;

  // Убираем всякие префиксы, которые может вписать пользователь
  const prefixes = [
    '/images/product/',
    'images/product/',
    '/src/assets/images/product/',
    'src/assets/images/product/',
    '/public/images/product/',
    'public/images/product/',
    'technique/',
    'zapchasti/',
    'aksessuary/',
    'ekipirovka/',
  ];
  // Пробуем по очереди снимать префиксы
  let attempts: string[] = [];
  let tmp = clean.replace(/\\/g, '/');
  attempts.push(tmp);
  for (let i = 0; i < 10; i++) {
    let changed = false;
    for (const pre of prefixes) {
      const re = new RegExp(`^\\/?${pre.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}`, 'i');
      if (re.test(tmp)) {
        tmp = tmp.replace(re, '');
        changed = true;
      }
    }
    attempts.push(tmp);
    if (!changed) break;
  }

  // Если есть подсказка папки — добавляем варианты
  if (subFolderHint) {
    attempts = attempts.flatMap((a) => [
      `${subFolderHint}/${a}`,
      a,
    ]);
  }

  // Пробуем каждую вариацию в нижнем регистре, в оригинале, с заменой пробелов на - и т.д.
  for (const raw of attempts) {
    const candidates = [
      raw.toLowerCase(),
      raw,
      raw.replace(/\s+/g, '-'),
      raw.replace(/\s+/g, '_'),
      decodeURIComponent(raw).toLowerCase(),
      pathBasename(raw).toLowerCase(),
    ];
    for (const c of candidates) {
      if (!c) continue;
      const hit = IMAGE_INDEX[c];
      if (hit) return hit;
    }
  }

  // Не нашли — возвращаем null (на верхнем уровне показать fallback <img>)
  return null;
}

/** Утилита: проверить, есть ли картинка по пути */
export function hasProductImage(
  relPath: string | undefined | null,
  subFolderHint?: 'technique' | 'zapchasti' | 'aksessuary' | 'ekipirovka'
): boolean {
  return getProductImage(relPath, subFolderHint) !== null;
}

/** Статистика: сколько всего картинок проиндексировано */
export function getImageStats() {
  return {
    totalFiles: Object.keys(techniqueImages).length,
    uniqueKeys: Object.keys(IMAGE_INDEX).length,
    sampleKeys: Object.keys(IMAGE_INDEX).slice(0, 20),
  };
}