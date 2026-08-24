import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputDir = path.join(__dirname, '..', 'public', 'images', 'banners');
const outputDir = path.join(__dirname, '..', 'src', 'assets', 'images', 'banners');

const targetWidth = 1400;
const targetHeight = 600;

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const files = fs.readdirSync(inputDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));

if (files.length === 0) {
  console.error('❌ В папке public/images/banners нет изображений!');
  process.exit(1);
}

async function processAll() {
  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const outputName = file.toLowerCase().replace(/[^a-z0-9-.]/g, '-');
    const outputPath = path.join(outputDir, outputName);
    await sharp(inputPath)
      .resize(targetWidth, targetHeight, {
        fit: 'cover',    // обрезаем по краям, чтобы заполнить всё без полей
        position: 'center'
      })
      .toFile(outputPath);
    console.log(`✅ Баннер: ${outputName}`);
  }
  console.log('🎉 Все баннеры нормализованы!');
}

processAll().catch(err => {
  console.error('Ошибка:', err);
  process.exit(1);
});