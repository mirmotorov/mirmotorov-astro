// scripts/import-technique.ts  (v2 — полная перезапись)
// Работает с ВАШИМ product.csv, убирает опечатки, пишет характеристики В КОРЕНЬ
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'src', 'data');
const TECHNIQUE_DIR = path.join(DATA_DIR, 'technique');
const IMPORT_DIR = path.join(ROOT, 'data-import');

const TECH_CATEGORIES = [
  'Квадроциклы','Снегоходы','Лодочные моторы','Лодки','Вездеходы','Мотовездеходы','Гидроциклы',
];

// ═══════════════════════════════════════════════════════════════
// ⭐ СПРАВОЧНИК СТАНДАРТНЫХ ПОЛЕЙ ТХ (ВАШ СПИСОК ИЗ ТЗ)
// ═══════════════════════════════════════════════════════════════
const STD_CHAR_FIELDS = [
  'engine_type','engine_cc','max_power','transmission','gearbox','starter','fuel_system',
  'fuel_tank','weight','dimensions','equipment','drive','front_susp','rear_susp','shocks',
  'tires','wheels','steering','brakes','track','track_width_mm','power_hp','control_type',
  'propulsion','rpm_range','fuel_cons','fuel_rec','trim','leg_len','length_width','cockpit',
  'balloon_d','seats','max_hp','capacity','balloons_qty','tact','boat_type','floor_type',
  'full_text','long_description',
];
const CHAR_NAME_MAP: Record<string, string> = {
  engine_type:'Тип двигателя',engine_cc:'Объем двигателя, см³',
  max_power:'Максимальная мощность, л.с.',transmission:'Тип трансмиссии',gearbox:'Передачи',
  starter:'Система запуска',fuel_system:'Система питания',fuel_tank:'Объем топливного бака, л',
  weight:'Вес, кг',dimensions:'Габаритные размеры, мм (Д×Ш×В)',equipment:'Комплектация',
  drive:'Система привода',front_susp:'Передняя подвеска',rear_susp:'Задняя подвеска',
  shocks:'Амортизаторы',tires:'Шины',wheels:'Диски',steering:'Рулевое управление',
  brakes:'Тормозная система',
  track:'Гусеница: длина/ширина/высота грунтозацепа/шаг, мм',track_width_mm:'Ширина гусеницы, мм',
  power_hp:'Максимальная мощность, л.с.',control_type:'Система управления',
  propulsion:'Тип движителя',rpm_range:'Диапазон рабочих оборотов, об/мин',
  fuel_cons:'Расход топлива на полном ходу, л/ч',fuel_rec:'Рекомендуемый бензин',
  trim:'Трим',leg_len:'Длина «ноги», мм',
  length_width:'Длина/ширина, см',cockpit:'Кокпит, см',balloon_d:'Диаметр баллонов, см',
  seats:'Посадочные места, чел.',max_hp:'Макс. мощность ПЛМ, л.с.',
  capacity:'Грузоподъемность, кг',balloons_qty:'Количество баллонов, шт.',
  tact:'Тактность',boat_type:'Тип лодки',floor_type:'Тип днища (слань)',
};

const MAP: Record<string, string> = {
  'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo',
  'ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m',
  'н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u',
  'ф':'f','х':'h','ц':'c','ч':'ch','ш':'sh','щ':'sch',
  'ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
  ' ':'-','_':'-',
};
function transliterate(text: string): string {
  return text.toLowerCase().split('')
    .map(ch => MAP[ch] ?? ch).join('')
    .replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-')
    .replace(/^-|-$/g, '').substring(0, 80);
}

async function ensureDir(dir: string) {
  try { await fs.mkdir(dir, { recursive: true }); } catch {}
}

function getMainCategory(categoryPath?: string): string {
  if (!categoryPath) return '';
  const parts = categoryPath.split(/[>>>;/\\|]+/).flatMap(p => p.split(';')).map(p => p.trim()).filter(Boolean);
  for (const part of parts) {
    const p = part.toLowerCase();
    const hit = TECH_CATEGORIES.find(tc => { const t = tc.toLowerCase(); return t === p || t.includes(p) || p.includes(t); });
    if (hit) return hit;
  }
  return parts[0] || '';
}
function getBrandFromCategory(categoryPath?: string): string {
  if (!categoryPath) return '';
  const between = categoryPath.split('>>>')[1];
  if (!between) return '';
  return between.split(';')[0].trim();
}
function detectMainCategory(title: string, brand: string, rawCategory: string): string {
  const t = title.toLowerCase();
  const b = (brand || '').toLowerCase();
  const hay = `${t} ${b} ${rawCategory}`.toLowerCase();

  if (/снего?ход|мороз|капитан|витязь|атаман|ставр|viking|vikіng/.test(hay)) return 'Снегоходы';
  if (/\b(квадроцикл|мотовездеход|вездеход|atv|utv|ssv|tinger|armor|workcross|desertcross|snarler|fugleman|villain|гепард|гuepard|guepard|pathcross|mud\s*pro|tf4|track\s*2)\b/.test(hay)) return 'Квадроциклы';
  if (b.includes('gladiator') && /(?:^|[\s-])[fh]\d{2,4}(?:[\s-]|lux|pro)/i.test(title)) return 'Квадроциклы';
  if (/^stels|aodes|segway|^tinger/.test(b)) return 'Квадроциклы';
  if (/лодочн.*мот|плм|водомет|эндур|enduro|efi/.test(hay)) return 'Лодочные моторы';
  if (/^(parsun|golfstream|sea-?pro|yamaha|mercury|honda|suzuki|tohatsu)/.test(b)) return 'Лодочные моторы';
  if (b.includes('gladiator') && /(?:^|[\s-])g\d/i.test(title)) return 'Лодочные моторы';
  if (/(?:^|[\s/-])[tfc]\d/.test(t)) return 'Лодочные моторы';
  if (/гидроцикл|waverunner|jetski/.test(hay)) return 'Гидроциклы';
  if (/лодк|rib|надувн|пвх|slan|слань/.test(hay)) return 'Лодки';
  if (b.includes('gladiator') && /(?:^|[\s-])[rbec]\d{2,4}(?:[\s-]|al|s$|pro$|rib$)/i.test(title)) return 'Лодки';
  return getMainCategory(rawCategory);
}
function generateSEO(title: string, category: string) {
  const cleanTitle = title.replace(/\s+/g, ' ').trim();
  const cat = getMainCategory(category).toLowerCase() || 'мототехнику';
  return {
    title: `Купить ${cleanTitle} в Красноярске`,
    description: `${cleanTitle} купить в Красноярске в магазине Мир Моторов. Официальный дилер, гарантия, доставка по РФ. Подробности по телефону 8 (391) 272-05-55`,
  };
}
function parsePhotos(str: string): string[] {
  if (!str) return [];
  return str.split(/[;\s]+/).map(s => s.trim()).filter(s => s && s.length > 3).map(s => {
    if (s.startsWith('http')) {
      try {
        const parts = s.split('/');
        const last = parts[parts.length-1];
        const decoded = decodeURIComponent(last).replace(/[^a-zA-Z0-9_\-\.А-Яа-я]/g, '');
        return decoded || s;
      } catch { return s; }
    }
    let clean = s.replace(/\\/g, '/');
    clean = clean.replace(/^.*public\/images\/product\//i, '');
    clean = clean.replace(/^.*src\/assets\/images\/product\/(technique\/)?/i, '');
    clean = clean.replace(/^\/?images\/product\//i, '');
    clean = clean.replace(/^\/?technique\//i, '');
    return clean;
  });
}

// ═══════════════════════════════════════════════════════════════
// ⭐⭐⭐ НОРМАЛИЗАЦИЯ НАЗВАНИЙ СТОЛБЦОВ CSV
// ═══════════════════════════════════════════════════════════════
const COLUMN_ALIASES: Record<string, string> = {
  // ВАШ первый столбец category (если в CSV «Столбец1»)
  'столбец1':'category','column1':'category','column_1':'category','столбец_1':'category',
  'категория_товара':'category','тип_товара':'category','раздел':'category','каталог':'category','group':'category','группа':'category',
  // Общие опечатки
  'brandslig':'brandSlug','brand_slig':'brandSlug','descriotion':'description','aricle':'article',
  'track_wirth_mm':'track_width_mm','track_with_mm':'track_width_mm',
  'floor.type':'floor_type','boat.type':'boat_type',
  'engine_cc2':'engine_cc','engine_cc_2':'engine_cc',
  'transmission_/_gearbox':'transmission','transmission/gearbox':'transmission','transmission_gearbox':'transmission',
  'gear_box':'gearbox','gear-box':'gearbox',
  'control_type2':'control_type','control_type_2':'control_type',
  'old_price':'oldPrice','price_old':'oldPrice',
  'seo_title_':'seo_title','seo_descr':'seo_description','seo_description':'seo_description',
  'external_id':'article','sku':'article',
  'related_products':'relatedTags','related':'relatedTags','related_tags':'relatedTags',
  'full text':'full_text','long_description':'full_text',
};
function normalizeColumn(rawKey: string): string {
  let k = rawKey.replace(/\u00a0/g, ' ').trim();
  k = k.replace(/[-\s]+/g, '_');
  k = k.replace(/__+/g, '_').replace(/^_|_$/g, '');
  const kl = k.toLowerCase();
  for (const [a,v] of Object.entries(COLUMN_ALIASES)) { if (a.toLowerCase() === kl) return v; }
  const reStrip = /^(engine_cc|tact|power_hp|control_type|transmission|fuel_tank|dimensions|equipment|max_hp|capacity|trim|leg_len|length_width|cockpit|balloon_d|seats|rpm_range|fuel_cons|fuel_rec|balloons_qty|track_width_mm|boat_type|floor_type|track|starter|brakes|drive|front_susp|rear_susp|shocks|tires|wheels|steering|fuel_system|weight|engine_type|max_power|propulsion)\d+$/;
  if (reStrip.test(kl)) return kl.replace(/\d+$/, '');
  return k;
}

// ═══════════════════════════════════════════════════════════════
// ⭐ ГЛАВНАЯ ФУНКЦИЯ
// ═══════════════════════════════════════════════════════════════
async function importCSV(fileName: string) {
  await ensureDir(TECHNIQUE_DIR);
  await ensureDir(IMPORT_DIR);
  const filePath = path.join(IMPORT_DIR, fileName);
  console.log(`📖 Читаем: ${filePath}`);
  let raw: string;
  try { raw = await fs.readFile(filePath, 'utf-8'); }
  catch (e) { console.error(`❌ Файл не найден`); process.exit(1); }

  const firstLine = raw.split('\n')[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';
  console.log(`🔍 Разделитель: "${delimiter}"`);

  let rows: Record<string, any>[] = parse(raw, { columns:true, skip_empty_lines:true, delimiter, bom:true, trim:true });
  console.log(`✅ Строк в CSV: ${rows.length}`);

  // --- Диагностика и нормализация столбцов ---
  const columnsRaw = rows.length ? Object.keys(rows[0]) : [];
  console.log(`\n📋 ОРИГИНАЛЬНЫЕ СТОЛБЦЫ CSV:\n   ${columnsRaw.map(c=>`«${c}»`).join(' | ')}`);

  const normalizedRows: Record<string,any>[] = rows.map(row => {
    const out: Record<string,any> = {};
    for (const [origKey, val] of Object.entries(row)) {
      const nk = normalizeColumn(origKey);
      const sVal = (val===undefined||val===null) ? '' : String(val);
      if (out[nk] === undefined || out[nk] === null || String(out[nk]).trim() === '') {
        out[nk] = val;
      }
    }
    return out;
  });
  rows = normalizedRows;
  const columns = rows.length ? Object.keys(rows[0]).sort() : [];
  console.log(`\n✅ НОРМАЛИЗОВАННЫЕ СТОЛБЦЫ (исправлены опечатки):\n   ${columns.map(c=>`«${c}»`).join(' | ')}`);
  if (rows.length) {
    const r0 = rows[0];
    console.log(`\n🔍 ПЕРВЫЙ ТОВАР (заполненные поля):`);
    const printKeys = ['category','brand','brandSlug','title','modelSlug','article','price','engine_cc','tact','power_hp','track_width_mm','boat_type','floor_type','engine_type','max_power','transmission','gearbox','drive','front_susp','rear_susp','shocks','tires','wheels','steering','fuel_tank','fuel_system','weight','brakes','dimensions','equipment','starter','track','control_type','propulsion','trim','leg_len','rpm_range','fuel_cons','fuel_rec','length_width','cockpit','balloon_d','seats','max_hp','capacity','balloons_qty'];
    for (const k of printKeys) {
      const v = r0[k];
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        console.log(`   ${k.padEnd(16)} = ${JSON.stringify(String(v)).substring(0, 100)}`);
      }
    }
    console.log('');
  }

  // --- Основной цикл ---
  const byCategory: Record<string, any[]> = {};
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const category = String(row.category || '').trim();
    const title = String(row.title || '').trim();
    if (!title) { console.log(`⚠️  Строка ${i+2}: нет названия`); continue; }

    const brandRaw = String(row.brand || getBrandFromCategory(category) || '').trim();
    let mainCat = getMainCategory(category);
    const isTechDirect = TECH_CATEGORIES.some(tc => mainCat===tc || mainCat.includes(tc) || tc.includes(mainCat));
    if (!mainCat || !isTechDirect) {
      const detected = detectMainCategory(title, brandRaw, category);
      if (detected) { console.log(`🔎 ОПРЕДЕЛИЛ [${detected.padEnd(13)}] ← ${title.substring(0,55)}`); mainCat = detected; }
    }
    const isTech = TECH_CATEGORIES.some(tc => mainCat===tc || mainCat.includes(tc) || tc.includes(mainCat));
    if (!mainCat || !isTech) { console.log(`⏭️  ПРОПУСК [${String(mainCat).padEnd(13)}]: ${title.substring(0,50)}`); continue; }

    // Поля
    const price = parseFloat(String(row.price ?? '0')) || 0;
    const oldPrice = parseFloat(String(row.oldPrice ?? '')) || null;
    const qtyRaw = row.quantity;
    const quantity = qtyRaw!==undefined&&qtyRaw!==null&&String(qtyRaw).trim()!=='' ? parseInt(String(qtyRaw)) : null;
    const brand = brandRaw;
    const brandSlug = String(row.brandSlug || transliterate(getBrandFromCategory(category) || brand || 'brand')).trim();
    const modelSlug = String(row.modelSlug || row.model || transliterate(title)).trim();
    const photos = parsePhotos(String(row.photo || '').replace(/\\/g, '/'));
    const description = String(row.description || '').trim();
    const text = String(row.text || '').trim();
    const article = String(row.article || '').trim();
    const seoTitle = String(row.seo_title || '').trim();
    const seoDescr = String(row.seo_description || '').trim();
    const autoSEO = generateSEO(title, category);

    // === ХАРАКТЕРИСТИКИ + ФИЛЬТРЫ (В КОРЕНЬ PRODUCT!) ===
    const pNum = (v: any) => { const n = parseFloat(String(v||'').replace(',','.')); return isNaN(n) ? undefined : n; };
    const pStr = (v: any) => v===undefined||v===null ? undefined : String(v).trim() || undefined;
    const characteristics: Record<string,any> = {};
    const filters: Record<string,any> = {};
    const root: Record<string,any> = {};
    const addField = (k: string, v: any) => {
      if (v===undefined||v===null) return;
      filters[k] = v; root[k] = v;
      const cn = CHAR_NAME_MAP[k];
      if (cn && !characteristics[cn]) characteristics[cn] = String(v);
    };
    for (const [key, val] of Object.entries(row)) {
      if (val===undefined||val===null||String(val).trim()==='') continue;
      const kStr = String(key);
      if (kStr.startsWith('Characteristics:')) {
        const cn = kStr.replace('Characteristics:','').trim();
        if (cn) characteristics[cn] = String(val).trim();
      }
      if (kStr.startsWith('char_')) {
        const cn = kStr.replace(/^char[_\s-]+/, '').trim();
        if (cn) characteristics[cn] = String(val).trim();
      }
    }
    for (const f of STD_CHAR_FIELDS) {
      const raw = row[f];
      if (raw===undefined||raw===null) continue;
      const s = String(raw).trim();
      if (s==='') continue;
      const isNumeric = /^-?\d+([.,]\d+)?$/.test(s);
      const val = isNumeric ? (pNum(raw) ?? s) : (pStr(raw) ?? s);
      addField(f, val);
    }
    const fText = root.full_text || root.long_description || text;
    if (fText) { root.full_text = fText; if (!text) root.text = fText; }

    let relatedTags: string[]|undefined = undefined;
    const rRaw = pStr(row.relatedTags || row.related_tags || row.related_products || row.related || '');
    if (rRaw) {
      relatedTags = rRaw.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);
      if (!relatedTags.length) relatedTags = undefined;
    }

    const product = {
      title, category: category || `${mainCat}>>>${brand}`,
      brand, brandSlug: brandSlug || transliterate(brand || mainCat), modelSlug,
      price, oldPrice: oldPrice || undefined,
      quantity: quantity!==null ? quantity : undefined,
      photo: photos, description,
      text: text || (root.full_text as string|undefined),
      full_text: (root.full_text as string|undefined),
      article: article || undefined,
      seo: { title: seoTitle || autoSEO.title, description: seoDescr || autoSEO.description },
      characteristics: Object.keys(characteristics).length ? characteristics : undefined,
      filters: Object.keys(filters).length ? filters : undefined,
      relatedTags,
      ...(Object.keys(root).length ? root : undefined),
    };

    if (!byCategory[mainCat]) byCategory[mainCat] = [];
    const charsN = product.characteristics ? Object.keys(product.characteristics).length : 0;
    const filtersN = product.filters ? Object.keys(product.filters).length : 0;
    const catTag = `[${mainCat.padEnd(13,' ')}]`;
    const tPad = title.substring(0,55).padEnd(55,' ');
    const slugPad = `brand=${product.brandSlug.padEnd(26)} model=${product.modelSlug}`;
    const exists = byCategory[mainCat].findIndex(p =>
      (p.brandSlug===product.brandSlug && p.modelSlug===product.modelSlug) || p.title.toLowerCase()===product.title.toLowerCase()
    );
    if (exists >= 0) {
      console.log(`🔄 ${catTag} ${tPad} | ${slugPad} | ТХ=${String(charsN).padStart(2)}  филтров=${String(filtersN).padStart(2)}`);
      byCategory[mainCat][exists] = { ...byCategory[mainCat][exists], ...product };
    } else {
      console.log(`➕  ${catTag} ${tPad} | ${slugPad} | ТХ=${String(charsN).padStart(2)}  филтров=${String(filtersN).padStart(2)}`);
      byCategory[mainCat].push(product);
    }
  }

  // --- СОХРАНИТЬ В JSON ---
  console.log(`\n📊 Готово к записи:`);
  let total = 0;
  for (const [cat, products] of Object.entries(byCategory)) {
    const slug = transliterate(cat);
    const file = path.join(TECHNIQUE_DIR, `${slug}.json`);
    await fs.writeFile(file, JSON.stringify(products, null, 2), 'utf-8');
    console.log(`  ✅ ${cat.padEnd(13)}: ${String(products.length).padStart(3)} товаров -> src/data/technique/${slug}.json`);
    total += products.length;
  }
  console.log(`\n🎉 Итого обработано: ${total} товаров`);
  if (total === 0) console.log(`\n❌ 0 товаров — пришлите мне первые 30 строк лога импорта (выше)!`);
  else console.log(`\n💡 Запустите: npx astro dev --host 127.0.0.1 --port 5173`);
}

const argFile = process.argv[2];
if (argFile) {
  importCSV(argFile).catch(err => { console.error('❌ Ошибка:', err); process.exit(1); });
} else {
  console.log('ℹ️  Использование: npm run import -- product.csv');
}