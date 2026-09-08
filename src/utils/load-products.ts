// src/utils/load-products.ts  — ✅ ФИНАЛЬНАЯ ВЕРСИЯ (2026-09-01)
// ✅ ВЕСА: technique = 99999 (ВСЕГДА побеждает legacy)
// ✅ LOGS:   console.log на КАЖДЫЙ товар — видим ПОЧЕМУ и КАКОЙ товар выбран в dedupe
// ✅ ПОРЯДОК: legacy first → catalog → technique last (техника обрабатывается ПОСЛЕДНЕЙ)

import { categoryToSlug, getMainCategory, transliterate } from './transliterate';

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
} catch (e) { console.warn('[load-products] ⚠️ catalog не загрузился:', e); }

try {
  legacyBlob = import.meta.glob('/src/data/products.json', { eager: true, import: 'default' }) as Record<string, any[]>;
  console.log(`[load-products] ✅ legacy products.json: ${Object.keys(legacyBlob).length} файлов`);
} catch (e) { console.warn('[load-products] ⚠️ legacy products.json не загрузился (ОК — скоро уберем его):', e); }

function flatten(obj: Record<string, any[]>): any[] {
  return Object.values(obj).flat();
}
/** ⭐ Backward-compatible: разворачиваем p.filters в корень product + full_text → text */
function normalizeProduct(p: any): any {
  if (!p) return p;
  const merged = { ...p, ...(p.filters || {}) };
  if (!merged.text && p.full_text) merged.text = p.full_text;
  return merged;
}
/** Нормализованный ключ для поиска дублей (без учета регистра, дефисов, slug'ов) */
function normKey(p: any): string {
  const title = (p.title || '').trim();
  const model = (p.modelSlug || p.model || '').trim();
  const tKey = transliterate(title).toLowerCase().replace(/[^a-z0-9]/g, '');
  const mKey = model.length > 2 ? model.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  return `${tKey}|${mKey}`;
}

/**
 * Удаление дубликатов — ВЕСА + ЛОГИ НА КАЖДЫЙ ТОВАР
 * ВЕСА: technique = 99999 (НЕ ПРОИГРЫВАЕТ!), catalog=50000, legacy = 1
 */
function dedupe(list: any[]): any[] {
  const byKey = new Map<string, { item: any; weight: number; fieldCount: number }>();

  for (const _p of list) {
    if (!_p || !_p.title) continue;
    const p = normalizeProduct(_p);

    // ============== ВЕС 99999 ДЛЯ ТЕХНИКИ ==============
    const srcRaw = String((p as any).__source || '').trim().toLowerCase();
    const cat = String(p.category || '').toLowerCase();
    let source = srcRaw;
    let weight = 1;

    if (source === '' || source === 'undefined') {
      // Auto-detect (если __source не выставлен)
      if (/квадро|снегоход|лод(к|оч)|мототехн|вездеход|гидроцикл|мотовездеход|моточ/.test(cat)) {
        source = 'technique';
      } else if (/запчаст|аксесс|экипир/.test(cat)) {
        source = 'catalog';
      } else {
        source = 'legacy';
      }
    }

    // 🔥🔥🔥 ГЛАВНАЯ ГАРАНТИЯ: TECHNIQUE НИКОГДА НЕ ПРОИГРЫВАЕТ! 🔥🔥🔥
    if (source === 'technique') weight = 99999;
    if (source === 'catalog')   weight = 50000;
    if (source === 'legacy')    weight = 1;

    // Маленькие бонусы (не повлияют на 99999)
    if (source !== 'technique') {
      if (Object.keys(p.filters || {}).length > 0) weight += 500;
      if (Object.keys(p.characteristics || {}).length > 0) weight += 500;
      if ((p.seo?.title || '').length > 10) weight += 100;
      if (Object.keys(p.characteristics || {}).length > 10) weight = 25000;
    }

    const fieldCount = Object.keys(p).filter(k =>
      k !== '__source' && p[k] !== undefined && p[k] !== null && String(p[k]).trim() !== ''
    ).length;
    const key = normKey(p);
    const existing = byKey.get(key);
    const exSrc = existing ? String(((existing.item as any).__source) || '').toLowerCase() : '';

    if (!existing) {
      console.log(`[dedup] +NEW    |${source.padEnd(9)}| w=${String(weight).padStart(6)} | fields=${String(fieldCount).padStart(3)} | ${key.substring(0, 58).padEnd(58)} | ${p.title.substring(0, 60)}`);
      byKey.set(key, { item: p, weight, fieldCount });
    } else {
      let thisBetter = false;
      if (source === 'technique' && exSrc !== 'technique') {
        thisBetter = true;
        console.log(`[dedup] 🔁 TECH → ${exSrc || 'unknown'}! | ${key.substring(0, 58).padEnd(58)} | ${p.title.substring(0, 60)}`);
      } else if (source !== 'technique' && exSrc === 'technique') {
        thisBetter = false;
        console.log(`[dedup] 🛡️ TECH PROTECTED! | ${source.padEnd(9)} SKIPPED vs TECH → ${p.title.substring(0, 60)}`);
      } else {
        thisBetter = weight > existing.weight || (weight === existing.weight && fieldCount > existing.fieldCount);
        if (thisBetter) {
          console.log(`[dedup] ⬆️ UPDATE |${source.padEnd(9)}| w=${String(weight).padStart(6)}>ex=${String(existing.weight).padStart(6)} | fields ${fieldCount} vs ${existing.fieldCount} → ${p.title.substring(0, 60)}`);
        } else {
          console.log(`[dedup] = KEEP EXISTING |${source.padEnd(9)}| w=${String(weight).padStart(6)}≤ex=${String(existing.weight).padStart(6)} | ${p.title.substring(0, 60)}`);
        }
      }
      if (thisBetter) {
        if (!p.photo?.length && existing.item.photo?.length) p.photo = existing.item.photo;
        if (!p.seo?.title && existing.item.seo?.title) p.seo = existing.item.seo;
        if (!p.text && existing.item.text) p.text = existing.item.text;
        byKey.set(key, { item: p, weight, fieldCount });
      }
    }
  }
  return Array.from(byKey.values()).map(v => v.item);
}

/** Кэш всего каталога */
let _cache: any[] | null = null;

export function getAllProducts(): any[] {
  if (_cache) return _cache;
  try {
    // ====== ⭐⭐⭐ ВРЕМЕННО НЕ ГРУЗИМ LEGACY products.json! ⭐⭐⭐ ======
    // Он из 18 старых дублей без ТХ — ПОДМЕНЯЕТ technique JSON с характеристиками.
    // 138 товаров у нас В technique/*.json (kvadrocikly.json, snegohody.json и т.д.)
    // Когда будете грузить запчасти через отдельный CSV — вернем legacy + отдельный каталог.
    const catalog = flatten(catalogBlobs) || [];
    const technique = flatten(techniqueBlobs) || [];

    console.log(`[load-products] 📊 Не дедуп: technique=${technique.length}, catalog=${catalog.length}`);

    catalog.forEach(p => { if (p) (p as any).__source = 'catalog'; });
    technique.forEach(p => { if (p) (p as any).__source = 'technique'; });

    // Technique последний = выигрывает всегда (для надежности)
    const combined = [...catalog, ...technique];
    const result = dedupe(combined);
    console.log(`[load-products] ✅ ИТОГО: ${result.length} уникальных товаров`);
    _cache = result;
    return _cache;
  } catch (e) {
    console.error('[load-products] ❌ КРИТИЧЕСКАЯ ОШИБКА:', e);
    _cache = [];
    return _cache;
  }
}

export function resetProductsCache() { _cache = null; }

/** Товары по главной категории */
export function getProductsByMainCategory(mainCategory: string): any[] {
  const needle = String(mainCategory).trim().toLowerCase();
  return getAllProducts().filter(p => {
    const mc = getMainCategory(p.category).toLowerCase();
    return mc === needle || mc.includes(needle) || needle.includes(mc);
  });
}

/** Все главные категории + count */
export function getAllMainCategories(): { title: string; slug: string; count: number }[] {
  const map = new Map<string, number>();
  for (const p of getAllProducts()) {
    const t = getMainCategory(p.category);
    if (!t) continue;
    map.set(t, (map.get(t) || 0) + 1);
  }
  return Array.from(map.entries()).map(([title, count]) => ({
    title, count, slug: categoryToSlug(title)
  }));
}

/** Товары по brandSlug в пределах главной категории */
export function getProductsByBrand(mainCategorySlug: string, brandSlug: string): any[] {
  // ФИКС: сравниваем СЛАГ с СЛАГОМ! (categoryToSlug — РУССКИЙ → ЛАТИНСКИЙ slug)
  const needleCatSlug = String(mainCategorySlug || '').trim().toLowerCase();
  const needleBrandSlug = String(brandSlug || '').trim().toLowerCase();
  return getAllProducts().filter(p => {
    if (!p.brandSlug) return false;
    if (String(p.brandSlug).toLowerCase() !== needleBrandSlug) return false;
    const mcRussian = getMainCategory(p.category);
    const mcSlug = categoryToSlug(mcRussian);
    return mcSlug === needleCatSlug || mcSlug.includes(needleCatSlug) || needleCatSlug.includes(mcSlug);
  });
}
export { getProductsByBrand as getProductsByBrandSlug };

/** Поиск товара (несколько вариаций аргументов для поиска по URL slug) */
export function findProduct(params: { mainCategory?: string; category?: string; brand?: string; model?: string; brandSlug?: string; modelSlug?: string }): any | null {
  const mb = String(params.brand || params.brandSlug || '').toLowerCase();
  const mm = String(params.model || params.modelSlug || '').toLowerCase();
  const mc = String(params.mainCategory || params.category || '').toLowerCase();
  if (!mb || !mm) return null;
  const all = getAllProducts();
  // 1. Точный brandSlug + modelSlug
  let found = all.find(p =>
    String(p.brandSlug || '').toLowerCase() === mb &&
    String(p.modelSlug || p.model || '').toLowerCase() === mm
  );
  if (found && mc) {
    const pmc = getMainCategory(found.category).toLowerCase();
    if (pmc === mc || pmc.includes(mc) || mc.includes(pmc)) return found;
  } else if (found) return found;
  // 2. transliteration fallback
  const mbT = transliterate(mb);
  const mmT = transliterate(mm);
  found = all.find(p => {
    const b = transliterate(String(p.brandSlug || p.brand || '')).toLowerCase();
    const m = transliterate(String(p.modelSlug || p.model || p.title || '')).toLowerCase();
    if (b !== mbT || !m.includes(mmT)) return false;
    if (mc) {
      const pmc = getMainCategory(p.category).toLowerCase();
      return pmc === mc || pmc.includes(mc) || mc.includes(pmc);
    }
    return true;
  });
  return found || null;
}
export { findProduct as findProductBySlug, findProduct as getProduct };