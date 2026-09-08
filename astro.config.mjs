// @ts-check
import { defineConfig } from 'astro/config';
// import sitemap from '@astrojs/sitemap';

// ⚠️ ВРЕМЕННО! Сайт тестируется на github.io домене — ИНДЕКСАЦИЯ ЗАПРЕЩЕНА!
// Позже (когда перенесём на mirmotorov24.ru) — РАСКОММЕНТИРУЙТЕ:
//   1. Раскомментировать import sitemap from '@astrojs/sitemap';
//   2. Раскомментировать integrations: [sitemap()]
//   3. Раскомментировать site: 'https://mirmotorov24.ru',
//   4. В public/robots.txt заменить временный Disallow: / на Production robots.txt (с Allow и sitemap)
//   5. В src/layouts/Layout.astro УДАЛИТЬ <meta name="robots" content="noindex..."> и googlebot/yandex/rambler!

// https://astro.build/config
// ⚠️ ПОКА ЧТО: site НЕ УКАЗЫВАЕМ! (TILDA продолжает работать на mirmotorov24.ru)
export default defineConfig({
  // integrations: [sitemap()],
  integrations: [],
});

