import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';

const csvFile = process.argv[2];
if (!csvFile) {
  console.error('Укажите путь к CSV-файлу');
  process.exit(1);
}

const delimiter = ';';

// Простая транслитерация для slug
function transliterate(text) {
  const map = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    ' ': '-', '_': '-', '/': '-', '\\': '-'
  };
  return text.toLowerCase().split('').map(ch => map[ch] || ch).join('')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
}

const data = [];
fs.createReadStream(path.resolve(csvFile))
  .pipe(parse({ columns: true, delimiter, skip_empty_lines: true, bom: true }))
  .on('data', (row) => {
    // Название: сначала из Title, если пусто — из SEO title
    let title = row['Title'] || '';
    if (!title && row['SEO title']) {
      title = row['SEO title'].replace(/\s*купить\s+в\s+.*$/i, '').trim();
    }
    if (!title) title = 'Без названия';

    // Цена
    const priceRaw = row['Price'] || '0';
    const price = parseFloat(priceRaw.replace(',', '.').replace(/\s/g, '')) || 0;

    // Старая цена
    const oldPriceRaw = row['Price Old'] || '';
    const oldPrice = oldPriceRaw ? parseFloat(oldPriceRaw.replace(',', '.').replace(/\s/g, '')) || null : null;

    // Фото: разбиваем по пробелам и запятым, оставляем только URL
    const photoRaw = row['Photo'] || '';
    const photos = photoRaw
      .split(/[,\s]+/)
      .map(s => s.trim())
      .filter(s => s.startsWith('http'));

    // Slug из Url, если есть, иначе из Title
    let slug = '';
    if (row['Url'] && row['Url'].trim() !== '') {
      // Берём последний сегмент URL, убираем слеши
      slug = row['Url'].replace(/^\/+|\/+$/g, '').split('/').pop();
    } else {
      slug = transliterate(title);
    }

    // Характеристики: собираем все, что начинается с 'Characteristics:'
    const characteristics = {};
    for (let key of Object.keys(row)) {
      if (key.startsWith('Characteristics:')) {
        const name = key.replace('Characteristics:', '').trim();
        characteristics[name] = row[key] || '';
      }
    }

    const product = {
      tildaUid: row['Tilda UID'] || '',
      brand: row['Brand'] || '',
      sku: row['SKU'] || '',
      mark: row['Mark'] || '',
      category: row['Category'] || '',
      title: title,
      description: row['Description'] || '',
      text: row['Text'] || '',
      photo: photos,
      price: price,
      quantity: parseInt(row['Quantity']) || 0,
      oldPrice: oldPrice,
      editions: row['Editions'] || '',
      modification: row['Modifications'] || '',
      externalId: row['External ID'] || '',
      characteristics: characteristics,
      seo: {
        title: row['SEO title'] || '',
        description: row['SEO descr'] || '',
        keywords: row['SEO keywords'] || '',
      },
      url: row['Url'] || '',
      slug: slug,
    };

    data.push(product);
  })
  .on('end', () => {
    const outPath = 'src/data/products.json';
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✅ Создан ${outPath} с ${data.length} товарами.`);
  })
  .on('error', (err) => {
    console.error('Ошибка парсинга CSV:', err.message);
  });