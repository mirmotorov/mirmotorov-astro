// Универсальный загрузчик товаров со всех источников данных:
// 1) src/data/technique/*.json  — техника (квадроциклы, снегоходы, лодки, моторы, вездеходы)
// 2) src/data/catalog/*.json    — запчасти, аксессуары, экипировка (из CSV)
// 3) src/data/products.json     — старый файл, для обратной совместимости
//
// Выдает один плоский список всех товаров + helper-функции для фильтрации

import { categoryToSlug, getMainCategory, transliterate } from './transliterate';

// ==== Диагностика + безопасная загрузка JSON ====
console.log('[load-products] 🔄 Загружаем данные товаров...');
let techniqueBlobs: Record<string, any[]> = {};
let catalogBlobs: Record<string, any[]> = {};
let legacyBlob: Record<string, any[]> = {};

try {
  techniqueBlobs = import.meta.glob('/src/data/technique/*.json', { eager: true, import: 'default' }) as Record<string, any[]>;
  console.log(`[load-products] ✅ technique: ${Object.keys(techniqueBlobs).length} файлов`);
} catch (e) { console.warn('[load-products] ⚠️ technique не загрузился:', e); }

try {
  catalogBlobs = import.meta.glob('/src/data/catalog/*.json', { eager: true, import: 'default' }) as Record<string, any[]>;
  console.log(`[load-products] ✅ catalog: ${Object.keys(catalogBlobs).length} файлов`);
} catch (e) { console.warn('[load-products] ⚠️ catalog не загрузился (это ок — пока пустая папка):', e); }

try {
  legacyBlob = import.meta.glob('/src/data/products.json', { eager: true, import: 'default' }) as Record<string, any[]>;
  console.log(`[load-products] ✅ legacy products.json: ${Object.keys(legacyBlob).length} файлов`);
} catch (e) { console.warn('[load-products] ⚠️ legacy не загрузился:', e); }

function flatten(obj: Record<string, any[]>): any[] {
  return Object.values(obj).flat();
}

/** Нормализованный ключ для поиска дублей (без учета регистра, дефисов, slug'ов) */
function normKey(p: any): string {
  const title = (p.title || '').trim();
  const model = (p.modelSlug || p.model || '').trim();
  const tKey = transliterate(title)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  const mKey = model.length > 2 ? model.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  return `${tKey}|${mKey}`;
}

/**
 * Удаление дубликатов с приоритетом источника:
 *   technique (новый JSON) > catalog > legacy products.json
 * Также: один и тот же товар с разным brandSlug/написанием склеивается — побеждает вариант с более полными данными
 */
function dedupe(list: any[]): any[] {
  const byKey = new Map<string, { item: any; weight: number; fieldCount: number }>();

  for (const p of list) {
    if (!p || !p.title) continue;

    // Вес источника: чем больше, тем приоритетнее
    const cat = String(p.category || '').toLowerCase();
    let weight = 1;
    if (cat.includes('техника')) weight = 10;
    if (/".json.*?technique/.test((p as any).__source || '')) weight = 10;  // technique/*.json самый приоритет
    if (cat.includes('запчаст') || cat.includes('аксесс') || cat.includes('экип')) weight = 5;
    // если есть поле seo с заполненным title — приоритет выше (значит из нового импорта)
    if (p.seo?.title?.length > 10) weight += 3;
    if (p.article) weight += 1;
    if (p.quantity !== undefined && p.quantity !== null) weight += 1;

    // Кол-во заполненных полей (больше = лучше)
    const fieldCount = Object.values(p).filter((v) => v !== undefined && v !== null && String(v).trim() !== '').length;

    const key = normKey(p);
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, { item: p, weight, fieldCount });
    } else {
      // Берем товар, у которого либо больше вес, либо (при равном весе) больше заполнено полей
      const thisBetter =
        weight > existing.weight ||
        (weight === existing.weight && fieldCount > existing.fieldCount);
      if (thisBetter) {
        // Прокидываем старые photo и seo если в новом их нет (склеиваем лучшее из двух)
        if (!p.photo?.length && existing.item.photo?.length) p.photo = existing.item.photo;
        if (!p.seo?.title && existing.item.seo?.title) p.seo = existing.item.seo;
        if (!p.text && existing.item.text) p.text = existing.item.text;
        byKey.set(key, { item: p, weight, fieldCount });
      }
    }
  }

  return Array.from(byKey.values()).map((v) => v.item);
}

/** Кэш всего каталога (вычисляется 1 раз при первом запросе) */
let _cache: any[] | null = null;

/**
 * Получить ВСЕ товары со всех источников — ВСЕГДА возвращает массив, никогда не падает
 */
export function getAllProducts(): any[] {
  if (_cache) return _cache;
  try {
    const technique = flatten(techniqueBlobs) || [];
    const catalog = flatten(catalogBlobs) || [];
    const legacy = legacyBlob['/src/data/products.json'] || [];

    console.log(`[load-products] 📊 Не дедуп: technique=${technique.length}, catalog=${catalog.length}, legacy=${legacy.length}`);

    technique.forEach((p) => { if (p) (p as any).__source = 'technique'; });
    catalog.forEach((p) => { if (p) (p as any).__source = 'catalog'; });
    legacy.forEach((p) => { if (p) (p as any).__source = 'legacy'; });

    // Порядок критичен: technique САМЫЙ ПЕРВЫЙ = САМЫЙ ПРИОРИТЕТНЫЙ при дедупе
    const merged = [...technique, ...catalog, ...legacy];
    const result = dedupe(merged);

    console.log(`[load-products] ✅ ИТОГО: ${result.length} уникальных товаров`);
    _cache = result;
    return _cache;
  } catch (e) {
    console.error('[load-products] ❌ КРИТИЧЕСКАЯ ОШИБКА:', e);
    // ВАЖНО: никогда не возвращаем undefined — пустой массив лучше, чем падение всего сайта
    _cache = [];
    return _cache;
  }
}

/** Сбросить кэш (для hot reload) */
export function resetProductsCache() {
  _cache = null;
}

/**
 * Товары по главной категории (например "Квадроциклы")
 */
export function getProductsByMainCategory(mainCategory: string): any[] {
  const needle = String(mainCategory).trim().toLowerCase();
  return getAllProducts().filter((p) => {
    const mc = getMainCategory(p.category).toLowerCase();
    return mc === needle || mc.includes(needle) || needle.includes(mc);
  });
}

/**
 * Все уникальные главные категории + кол-во товаров
 */
export function getAllMainCategories(): { title: string; slug: string; count: number }[] {
  const map = new Map<string, number>();
  for (const p of getAllProducts()) {
    const t = getMainCategory(p.category);
    if (!t) continue;
    map.set(t, (map.get(t) || 0) + 1);
  }
  return Array.from(map.entries()).map(([title, count]) => ({
    title,
    slug: categoryToSlug(title),
    count,
  }));
}

/**
 * Уникальные бренды внутри главной категории + кол-во товаров в каждом
 */
export function getBrandsInCategory(
  mainCategorySlug: string
): { title: string; slug: string; count: number; categoryTitle: string }[] {
  const bySlug = new Map<string, { title: string; slug: string; count: number; categoryTitle: string }>();
  for (const p of getAllProducts()) {
    if (categoryToSlug(p.category) !== mainCategorySlug) continue;
    const brandSlug = p.brandSlug || 'other';
    const categoryTitle = getMainCategory(p.category);
    const existing = bySlug.get(brandSlug);
    if (existing) {
      existing.count++;
    } else {
      // Вытаскиваем красивое имя бренда из категории вида "Кв>>>Квадроциклы AODES;..."
      let brandTitle = String(p.brand || '').trim();
      if (!brandTitle && p.category && p.category.includes('>>>')) {
        brandTitle = p.category.split('>>>')[1].split(';')[0].trim();
      }
      if (!brandTitle) brandTitle = brandSlug;
      bySlug.set(brandSlug, {
        title: brandTitle,
        slug: brandSlug,
        count: 1,
        categoryTitle,
      });
    }
  }
  return Array.from(bySlug.values()).sort((a, b) => b.count - a.count);
}

/**
 * Товары внутри категории и бренда
 */
export function getProductsInBrand(
  mainCategorySlug: string,
  brandSlug: string
): any[] {
  return getAllProducts().filter(
    (p) => categoryToSlug(p.category) === mainCategorySlug && p.brandSlug === brandSlug
  );
}

/**
 * ⭐ АЛИАС для обратной совместимости — используется в новых [brand].astro
 * Товары внутри категории и бренда
 */
export function getProductsByBrand(
  mainCategorySlug: string,
  brandSlug: string
): any[] {
  return getProductsInBrand(mainCategorySlug, brandSlug);
}

/**
 * ⭐ АЛИАС для обратной совместимости
 */
export function getProductsByCategory(mainCategory: string): any[] {
  return getProductsByMainCategory(mainCategory);
}

/**
 * Найти конкретный товар по тройному slug-у (category/brand/model)
 */
export function findProduct(
  mainCategorySlug: string,
  brandSlug: string,
  modelSlug: string
): any | undefined {
  return getAllProducts().find(
    (p) =>
      categoryToSlug(p.category) === mainCategorySlug &&
      (p.brandSlug || '') === brandSlug &&
      (p.modelSlug || '') === modelSlug
  );
}

/**
 * Поиск по названию/артикулу/описанию (простой)
 */
export function searchProducts(query: string, limit = 50): any[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const all = getAllProducts();
  const scored: { p: any; score: number }[] = [];
  for (const p of all) {
    let score = 0;
    const title = (p.title || '').toLowerCase();
    const article = (p.article || '').toLowerCase();
    const desc = (p.description || '').toLowerCase();
    const brand = (p.brand || '').toLowerCase();
    if (title.includes(q)) score += 10;
    if (article.includes(q)) score += 8;
    if (brand.includes(q)) score += 5;
    if (desc.includes(q)) score += 2;
    if (score > 0) scored.push({ p, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.p);
}