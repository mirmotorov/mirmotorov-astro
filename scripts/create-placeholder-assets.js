/**
 * Создаёт минимальные placeholder-изображения в src/assets,
 * если их ещё нет. Замените их реальными через normalize-*.js
 * после добавления исходников в public/images/.
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const assets = [
  { dir: 'src/assets/images/categories', files: [
    { name: 'kvadrocikly.jpg', w: 400, h: 220, color: '#333' },
    { name: 'snegohody.jpg', w: 400, h: 220, color: '#444' },
    { name: 'lodochnye-motory.jpg', w: 400, h: 220, color: '#2a4a6a' },
    { name: 'lodki.jpg', w: 400, h: 220, color: '#1a5a7a' },
    { name: 'aksessuary.jpg', w: 400, h: 220, color: '#555' },
    { name: 'ekipirovka.jpg', w: 400, h: 220, color: '#666' },
    { name: 'zapchasti.jpg', w: 400, h: 220, color: '#777' },
    { name: 'service.jpg', w: 400, h: 220, color: '#888' },
  ]},
  { dir: 'src/assets/images/banners', files: [
    { name: '5.jpg', w: 1400, h: 600, color: '#111' },
  ]},
  { dir: 'src/assets/images/partners', files: [
    { name: 'aodes.png', w: 160, h: 90, color: '#fff' },
    { name: 'baltmotors.png', w: 160, h: 90, color: '#fff' },
    { name: 'gladiator.png', w: 160, h: 90, color: '#fff' },
    { name: 'golfstream.png', w: 160, h: 90, color: '#fff' },
    { name: 'motul.jpg', w: 160, h: 90, color: '#fff' },
    { name: 'ngk.jpg', w: 160, h: 90, color: '#fff' },
    { name: 'parsun.png', w: 160, h: 90, color: '#fff' },
    { name: 'sea-pro.jpg', w: 160, h: 90, color: '#fff' },
    { name: 'segway.png', w: 160, h: 90, color: '#fff' },
    { name: 'stels.jpg', w: 160, h: 90, color: '#fff' },
  ]},
];

async function ensureImage(filePath, w, h, color, ext) {
  if (fs.existsSync(filePath)) {
    console.log(`⏭  уже есть: ${path.relative(root, filePath)}`);
    return;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const pipeline = sharp({
    create: { width: w, height: h, channels: 3, background: color },
  });
  if (ext === 'png') {
    await pipeline.png().toFile(filePath);
  } else {
    await pipeline.jpeg({ quality: 80 }).toFile(filePath);
  }
  console.log(`✅ создан: ${path.relative(root, filePath)}`);
}

const placeholderPublic = path.join(root, 'public', 'placeholder.jpg');
if (!fs.existsSync(placeholderPublic)) {
  await sharp({
    create: { width: 400, height: 300, channels: 3, background: '#ddd' },
  }).jpeg({ quality: 80 }).toFile(placeholderPublic);
  console.log('✅ создан: public/placeholder.jpg');
}

for (const group of assets) {
  for (const file of group.files) {
    const filePath = path.join(root, group.dir, file.name);
    const ext = path.extname(file.name).slice(1);
    await ensureImage(filePath, file.w, file.h, file.color, ext);
  }
}

console.log('🎉 Placeholder-изображения готовы. Замените их через normalize-*.js после добавления исходников.');
