import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputDir = path.join(__dirname, '..', 'public', 'images', 'partners');
const outputDir = path.join(__dirname, '..', 'src', 'assets', 'images', 'partners');

const targetWidth = 160;
const targetHeight = 90;

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const files = fs.readdirSync(inputDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));

if (files.length === 0) {
  console.error('❌ В папке public/images/partners нет ни одного изображения!');
  process.exit(1);
}

async function processAll() {
  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const outputName = file.toLowerCase().replace(/[^a-z0-9-.]/g, '-');
    const outputPath = path.join(outputDir, outputName);
    await sharp(inputPath)
      .resize(targetWidth, targetHeight, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 } // ← БЕЛЫЙ НЕПРОЗРАЧНЫЙ ФОН
      })
      .toFile(outputPath);
    console.log(`✅ Обработан: ${outputName}`);
  }
  console.log('🎉 Все логотипы нормализованы с белым фоном!');
}

processAll().catch(err => {
  console.error('Ошибка:', err);
  process.exit(1);
});