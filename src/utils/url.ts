// src/utils/url.ts
// Универсальная helper-функция для ссылок на внутренние страницы Astro.
//
// НУЖНА ПОТОМУ ЧТО: Astro config.base='/mirmotorov-astro/' (GitHub Pages subpath!)
// Astro АВТОМАТИЧЕСКИ добавляет base: ТОЛЬКО к <Image src="/..."> / <link>/<script src>
// НО НЕ ДОБАВЛЯЕТ base: к обычным <a href="/catalog"> ссылкам!
// Поэтому без этой функции: <a href="/catalog"> → https://mirmotorov.github.io/catalog (404! нет /mirmotorov-astro/)
// С этой функцией:   <a href={url('/catalog')}> → https://mirmotorov.github.io/mirmotorov-astro/catalog (РАБОТАЕТ!)
//
// При деплое на КАСТОМНЫЙ ДОМЕН (mirmotorov24.ru) в astro.config.mjs:
//   base: '/' (или убрать base совсем).
// Тогда эта функция url() будет возвращать путь как есть (/catalog) — без изменений.
// НИКАКИХ ИЗМЕНЕНИЙ В КОДЕ ССЫЛОК НЕ ПОНАДОБИТСЯ! 💯

/**
 * Добавляет Astro import.meta.env.BASE_URL prefix к внутренним ссылкам сайта
 * (BASE_URL берётся из astro.config.mjs -> base: '/mirmotorov-astro/' для GitHub Pages)
 *
 * Правильно работает с:
 *   - '/catalog' -> '/mirmotorov-astro/catalog' (для gh pages) или '/catalog' (для кастомного домена)
 *   - '/catalog/kvadrocikly/kvadrocikly-aodes/pathcross-525l' -> с префиксом base
 *   - hash только '#top' -> '#top' без изменений
 *   - внешние ссылки 'https://yandex.ru' / 'mailto:' / 'tel:' -> возвращается без изменений!
 *
 * @param rawPath Любой путь (относительный, с / или без, или URL)
 * @returns Путь с автоматически добавленным BASE_URL (astro.config base:)
 */
export function url(rawPath: string): string {
  if (!rawPath || typeof rawPath !== 'string') return '/';

  const p = rawPath.trim();

  // Внешние ссылки / mailto / tel / hash только / javascript:void
  if (/^(https?:)?\/\//i.test(p) || p.startsWith('mailto:') || p.startsWith('tel:') || p.startsWith('#') || p.startsWith('javascript:')) {
    return p;
  }

  // Берём BASE_URL из Astro environment vars
  // Для GitHub Pages (base: '/mirmotorov-astro/') BASE_URL = '/mirmotorov-astro/'
  // Для кастомного домена base: '/' BASE_URL = '/'
  // @ts-ignore: BASE_URL всегда есть в Astro runtime
  const base: string = (globalThis?.import?.meta?.env?.BASE_URL as string) ?? '/';
  const baseNorm = base.endsWith('/') ? base.slice(0, -1) : base; // убираем trailing slash

  const isAbs = p.startsWith('/');
  const pathNorm = isAbs ? p : '/' + p; // гарантируем что путь с /

  if (!baseNorm || baseNorm === '') return pathNorm;
  if (pathNorm.startsWith(baseNorm + '/')) return pathNorm; // уже добавлен (двойной!)

  return baseNorm + pathNorm;
}

export default url;
