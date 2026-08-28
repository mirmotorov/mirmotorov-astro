// Скрипт для импорта техники из CSV -> JSON файлы по категориям
// Запуск: npm run import -- filename.csv
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Пути
const DATA_DIR = path.join(ROOT, 'src', 'data');
const TECHNIQUE_DIR = path.join(DATA_DIR, 'technique');
const IMPORT_DIR = path.join(ROOT, 'data-import');

// Список главных категорий техники
const TECH_CATEGORIES = [
  'Квадроциклы',
  'Снегоходы',
  'Лодочные моторы',
  'Лодки',
  'Вездеходы',
  'Мотовездеходы',
  'Гидроциклы',
];

// Уверяемся что папки существуют
async function ensureDir(dir: string) {
  try { await fs.mkdir(dir, { recursive: true }); } catch {}
}

// Простая транслитерация для slugs (чтобы не зависеть от загрузки .ts модуля в Node)
const MAP: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
  'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
  'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
  ' ': '-', '_': '-',
};

function transliterate(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map((ch) => MAP[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

function getMainCategory(categoryPath?: string): string {
  if (!categoryPath) return '';
  // Форматы: "Квадроциклы>>>Квадроциклы AODES;Техника" или "Квадроциклы"
  const first = categoryPath.split('>>>')[0].split(';')[0].trim();
  return first;
}

function getBrandFromCategory(categoryPath?: string): string {
  if (!categoryPath) return '';
  // "Квадроциклы>>>Квадроциклы AODES;Техника" -> "Квадроциклы AODES"
  const between = categoryPath.split('>>>')[1];
  if (!between) return '';
  return between.split(';')[0].trim();
}

// Автогенерация SEO-полей если их нет
function generateSEO(title: string, category: string) {
  const cleanTitle = title.replace(/\s+/g, ' ').trim();
  const cat = getMainCategory(category).toLowerCase() || 'мототехнику';
  return {
    title: `Купить ${cleanTitle} в Красноярске`,
    description: `${cleanTitle} купить в Красноярске в магазине Мир Моторов. Официальный дилер, гарантия, доставка по РФ. Подробности по телефону 8 (391) 272-05-55`,
  };
}

// Парсинг фото (поддержка разделителей: ; / пробел / URL)
function parsePhotos(str: string): string[] {
  if (!str) return [];
  return str
    .split(/[;\s]+/)
    .map((s) => s.trim())
    .filter((s) => s && s.length > 3)
    .map((s) => {
      // Если это URL Тильды — достаем имя файла из конца URL
      if (s.startsWith('http')) {
        try {
          const parts = s.split('/');
          const last = parts[parts.length - 1];
          const decoded = decodeURIComponent(last).replace(/[^a-zA-Z0-9_\-\.А-Яа-я]/g, '');
          return decoded || s;
        } catch {
          return s;
        }
      }
      // Убираем лишние префиксы если пользователь указал полный путь
      let clean = s.replace(/\\/g, '/');
      clean = clean.replace(/^.*public\/images\/product\//i, '');
      clean = clean.replace(/^.*src\/assets\/images\/product\/(technique\/)?/i, '');
      clean = clean.replace(/^\/?images\/product\//i, '');
      clean = clean.replace(/^\/?technique\//i, '');
      return clean;
    });
}

// Основная функция импорта
async function importCSV(fileName: string) {
  await ensureDir(TECHNIQUE_DIR);
  await ensureDir(IMPORT_DIR);

  const filePath = path.join(IMPORT_DIR, fileName);
  console.log(`📖 Читаем файл: ${filePath}`);

  let raw: string;
  try {
    raw = await fs.readFile(filePath, 'utf-8');
  } catch (e) {
    console.error(`❌ Файл не найден: ${filePath}`);
    console.error(`ℹ️  Положите CSV в папку: data-import/${productUrl.csv}`);
    process.exit(1);
  }

  // Попробуем определить разделитель (Tilda CSV использует ;)
  const firstLine = raw.split('\n')[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';
  console.log(`🔍 Разделитель: "${delimiter}"`);

  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    delimiter,
    bom: true,
    trim: true,
  });

  console.log(`✅ Строк в CSV: ${rows.length}`);

  // Группируем по категориям
  const byCategory: Record<string, any[]> = {};

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Поддержка названий столбцов из Тильды и нашего формата
    const category = (row.category || row.Category || row['Категория'] || '').trim();
    const title = (row.title || row.Title || row['Название'] || row['Title'] || '').trim();
    if (!title) {
      console.log(`⚠️  Строка ${i + 2}: нет названия — пропускаем`);
      continue;
    }

    const mainCat = getMainCategory(category);
    const isTech = TECH_CATEGORIES.some(
      (tc) => mainCat === tc || mainCat.includes(tc) || tc.includes(mainCat)
    );
    if (!mainCat || !isTech) {
      console.log(`⏭️  Пропускаем не-технику [${mainCat}]: ${title.substring(0, 50)}`);
      continue;
    }

    const price = parseFloat(row.price || row.Price || row['Цена'] || '0') || 0;
    const oldPrice = parseFloat(
      row.oldPrice || row['old price'] || row['Price Old'] || row['Старая цена'] || ''
    ) || null;
    const quantityRaw = row.quantity ?? row.Quantity ?? row['Остаток'] ?? row['Quantity'];
    const quantity =
      quantityRaw !== undefined && quantityRaw !== null && quantityRaw !== ''
        ? parseInt(String(quantityRaw))
        : null;

    const brand = (
      row.brand ||
      row.Brand ||
      row['Бренд'] ||
      row.Brand ||
      getBrandFromCategory(category) ||
      ''
    ).trim();

    // ЧПУ-поля: либо берём из CSV, либо генерируем
    // (с поддержкой опечатки в CSV: brandSlig вместо brandSlug)
    const brandSlug = (
      row.brandSlug ||
      row.brandSlig ||
      row['brand slug'] ||
      transliterate(getBrandFromCategory(category) || brand || 'brand')
    ).trim();
    const modelSlug = (
      row.modelSlug ||
      row['model slug'] ||
      row.model ||
      transliterate(title)
    ).trim();

    // Парсим фото: также исправляем обратные слэши (\ -> /) на случай если в Excel пути через \ как в Windows
    const photoRaw = row.photo || row.Photo || row['Фото'] || row['Images'] || '';
    const photos = parsePhotos(String(photoRaw).replace(/\\/g, '/'));

    // Описания (с поддержкой опечатки: descriotion вместо description)
    const description = (
      row.description || row.descriotion || row.Description || row['Описание'] || row['Краткое описание'] || ''
    ).trim();
    const text = (
      row.text || row.Text || row['Подробное описание'] || row['Full text'] || ''
    ).trim();
    // Артикул (с поддержкой опечатки: aricle вместо article)
    const article = (
      row.article || row.aricle || row.SKU || row['Артикул'] || row['SKU'] || row['External ID'] || ''
    ).trim();

    // SEO
    const seoTitle = (
      row.seo_title ||
      row['SEO title'] ||
      row['seo title'] ||
      row['SEO Title'] ||
      ''
    ).trim();
    const seoDescr = (
      row.seo_description ||
      row['SEO descr'] ||
      row['seo description'] ||
      row['SEO Description'] ||
      ''
    ).trim();
    const autoSEO = generateSEO(title, category);

    // Характеристики: формат Тильды ("Characteristics:Длина, см") + ПРОСТОЙ ФОРМАТ char_ИМЯ
    const characteristics: Record<string, any> = {};
    for (const [key, val] of Object.entries(row)) {
      if (val === undefined || val === null || String(val).trim() === '') continue;
      // Формат Тильды
      if (typeof key === 'string' && key.startsWith('Characteristics:')) {
        const charName = key.replace('Characteristics:', '').trim();
        if (charName) characteristics[charName] = String(val).trim();
      }
      // ⭐ НОВЫЙ ПРОСТОЙ ФОРМАТ: столбцы char_Двигатель = "650 куб.см", char_Мощность = "44 л.с."
      if (typeof key === 'string' && key.startsWith('char_')) {
        const charName = key.replace(/^char[_\s-]+/, '').trim();
        if (charName) characteristics[charName] = String(val).trim();
      }
    }

    // ⭐ ⭐ ⭐ ПОЛЯ ДЛЯ ФИЛЬТРОВ (слева в каталоге)
    // Заполняйте эти столбцы в Excel — и фильтры заработают автоматически!
    const filters: Record<string, any> = {};
    const pNum = (v: any) => { const n = parseFloat(String(v || '').replace(',', '.')); return isNaN(n) ? undefined : n; };
    const pStr = (v: any) => v === undefined || v === null ? undefined : String(v).trim() || undefined;

    // Квадроциклы, Снегоходы
    if (pNum(row.engine_cc)) filters.engine_cc = pNum(row.engine_cc);
    if (pStr(row.tact)) filters.tact = pStr(row.tact);     // "2" или "4"
    // Лодочные моторы
    if (pNum(row.power_hp)) filters.power_hp = pNum(row.power_hp);
    if (pStr(row.control_type)) filters.control_type = pStr(row.control_type);  // "rumpel" / "distance" / "румпель" / "дистанция"
    if (pStr(row.propulsion)) filters.propulsion = pStr(row.propulsion);        // "screw" / "jet" / "винт" / "джет"
    // Снегоходы
    if (pNum(row.track_width_mm)) filters.track_width_mm = pNum(row.track_width_mm);
    // Лодки
    if (pStr(row.boat_type)) filters.boat_type = pStr(row.boat_type);           // "kilevaya" / "tonnelnaya" / "rib" (или русские слова — поймет)
    if (pStr(row.floor_type)) filters.floor_type = pStr(row.floor_type);        // "fanera" / "aluminum" / "air"

    // ⭐ СОПУТСТВУЮЩИЕ ТОВАРЫ (аксессуары, запчасти — подходит на этот товар)
    // В Excel: через запятую modelSlug товаров. Пример: pathcross-650,pathcross-625,stels-800
    let relatedTags: string[] | undefined = undefined;
    const relatedRaw = pStr(row.related_tags) || pStr(row.related) || pStr(row.related_products) || '';
    if (relatedRaw) {
      relatedTags = relatedRaw
        .split(/[,;\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (!relatedTags.length) relatedTags = undefined;
    }

    const product = {
      title,
      category: category || `${mainCat}>>>${brand}`,
      brand,
      brandSlug: brandSlug || transliterate(brand || mainCat),
      modelSlug,
      price,
      oldPrice: oldPrice || undefined,
      quantity: quantity !== null ? quantity : undefined,
      photo: photos,
      description,
      text: text || undefined,
      article: article || undefined,
      seo: {
        title: seoTitle || autoSEO.title,
        description: seoDescr || autoSEO.description,
      },
      characteristics: Object.keys(characteristics).length ? characteristics : undefined,
      filters: Object.keys(filters).length ? filters : undefined,
      relatedTags,
    };

    if (!byCategory[mainCat]) byCategory[mainCat] = [];

    // Дедуп по brandSlug+modelSlug или по title
    const exists = byCategory[mainCat].findIndex(
      (p) =>
        (p.brandSlug === product.brandSlug && p.modelSlug === product.modelSlug) ||
        p.title.toLowerCase() === product.title.toLowerCase()
    );
    if (exists >= 0) {
      console.log(`🔄 Обновляем: ${title.substring(0, 60)}`);
      byCategory[mainCat][exists] = { ...byCategory[mainCat][exists], ...product };
    } else {
      console.log(`➕ Новый товар: ${title.substring(0, 60)}`);
      byCategory[mainCat].push(product);
    }
  }

  console.log(`\n📊 Готово к записи:`);

  // Сохраняем по категориям
  let total = 0;
  for (const [cat, products] of Object.entries(byCategory)) {
    const slug = transliterate(cat);
    const file = path.join(TECHNIQUE_DIR, `${slug}.json`);
    await fs.writeFile(file, JSON.stringify(products, null, 2), 'utf-8');
    console.log(
      `  ✅ ${cat}: ${products.length} товаров -> src/data/technique/${slug}.json`
    );
    total += products.length;
  }

  console.log(`\n🎉 Итого обработано: ${total} товаров`);
  if (total > 0) {
    console.log('\n💡 Не забудьте:');
    console.log('   1. Перенести фото товаров в src/assets/images/product/technique/[папка_бренда]/');
    console.log('   2. Запустить npm run dev чтобы проверить отображение');
  }
}

// Читаем аргументы: npm run import -- technique.csv
const argFile = process.argv[2];
if (argFile) {
  importCSV(argFile).catch((err) => {
    console.error('❌ Ошибка импорта:', err);
    process.exit(1);
  });
} else {
  console.log('ℹ️  Использование: npm run import -- название_файла.csv');
  console.log('   Пример:     npm run import -- technique-all.csv');
  console.log('\n📁 Доступные CSV файлы в папке data-import/:');
  fs.readdir(IMPORT_DIR)
    .then((files) => {
      const csvs = files.filter((f) => f.toLowerCase().endsWith('.csv'));
      if (csvs.length === 0) console.log('   (пусто — положите CSV сюда)');
      else csvs.forEach((f) => console.log(`   - ${f}`));
    })
    .catch(() => {});
}