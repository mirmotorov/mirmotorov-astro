const MAP: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
  'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
  'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
  ' ': '-', '_': '-',
};

export function transliterate(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map((ch) => MAP[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
}

export function getMainCategory(categoryPath?: string): string {
  return categoryPath?.split('>>>')[0]?.trim() ?? '';
}

export function categoryToSlug(categoryPath?: string): string {
  return transliterate(getMainCategory(categoryPath));
}

export function productUrl(product: {
  category?: string;
  brandSlug?: string;
  modelSlug?: string;
}): string {
  const category = categoryToSlug(product.category);
  const brand = product.brandSlug ?? '';
  const model = product.modelSlug ?? '';
  return `/catalog/${category}/${brand}/${model}`;
}
