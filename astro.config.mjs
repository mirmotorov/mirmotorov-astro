// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
// ⚠️ ПОКА ЧТО ДОМЕН НЕ УКАЗЫВАЕМ! (TILDA ПРОДОЛЖАЕТ РАБОТАТЬ НА mirmotorov24.ru)
// ПОТОМ (КОГДА ВСЁ ГОТОВО) ЗАМЕНИТЬ НА:
// site: 'https://mirmotorov24.ru',
export default defineConfig({
  integrations: [sitemap()],
});
