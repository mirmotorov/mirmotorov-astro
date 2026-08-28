# 🚜 Мир Моторов 24 — Сайт-витрина мототехники на Astro

Сайт квадроциклов, снегоходов, лодок, моторов, запчастей, аксессуаров и экипировки.
Перенесен с Tilda на **Astro 7 + TypeScript** для максимальной скорости, SEO и удобного импорта из Excel/CSV.

**Домен:** https://mirmotorov24.ru  
**Локация:** Красноярск, официальный дилер AODES, Segway, STELS, Gladiator, Tinger, Parsun

---

## 🎯 Зачем переехали с Tilda на Astro?

| Параметр | Tilda | Astro 7 |
|----------|-------|--------|
| Скорость загрузки | Средняя (много лишнего JS/CSS) | Очень быстрая — чистый статический HTML, картинки авто-WebP |
| SEO (Яндекс/Google) | Средне — лишние блоки от конструктора | Отлично — чистые заголовки, семантика, sitemap, schema.org |
| Обновление прайса | Вручную каждый товар | Импорт из Excel/CSV — 1 команда |
| Картинки | Как есть, без оптимизации | Auto-optimize через `astro:assets` — WebP, AVIF, несколько размеров |
| Стоимость | 790-1990 ₽/мес за тариф | Бесплатный хостинг на GitHub Pages + свой домен |

---

## 📁 СТРУКТУРА ПРОЕКТА (ЗА ЧТО ОТВЕЧАЕТ КАЖДАЯ ПАПКА И ФАЙЛ)

```
mirmotorov-astro/
├─ 📄 .gitignore                    ← Что НЕ сохраняем в GitHub (node_modules/, dist/, кэш)
├─ 📄 package.json                  ← Список зависимостей (Astro, tsx) и КОМАНДЫ (npm run X)
├─ 📄 astro.config.mjs              ← Настройки Astro (здесь включают sharp для картинок)
├─ 📄 build-log.txt                 ← Лог последней сборки (для диагностики ошибок)
├─ 📁 data-import/                  ← 📥 ВАША ПАПКА ДЛЯ ИМПОРТА
│  ├─ product.xlsx                  ← Сюда кладете ваш Excel с товарами
│  └─ product.csv                   ← Сохраняете из Excel как CSV для импорта
│
├─ 📁 public/                       ← Файлы «как есть», без обработки (копируются в сайт напрямую)
│  ├─ favicon.ico                   ← Иконка сайта (вкладка браузера)
│  ├─ placeholder.jpg               ← «Заглушка» если у товара нет фото
│  └─ images/
│     ├─ banners/                   ← Баннеры (можно оставить для копирования)
│     ├─ categories/                ← Старые картинки категорий (дубли, не используем!)
│     ├─ partners/                  ← Логотипы партнеров (лучше в assets/)
│     └─ product/                   ← ⚠️ СТАРЫЕ фото товаров (НЕ оптимизируются!) — не используем
│
├─ 📁 src/                          ← ⭐ ВЕСЬ КОД САЙТА ЗДЕСЬ
│  ├─ 📁 assets/                    ← 🖼️ ⭐ ФОТО, КОТОРЫЕ ОПТИМИЗИРУЮТСЯ (astro:assets)
│  │  └─ images/
│  │     ├─ banners/                ← Баннеры для слайдера на главной (5.jpg и т.д.)
│  │     ├─ categories/             ← Hero-картинки категорий (kvadrocikly.jpg, snegohody.jpg...)
│  │     ├─ partners/               ← Логотипы партнеров (aodes.png, stels.png...)
│  │     └─ product/                ← ⭐ ⭐ ВСЕ ФОТО ТОВАРОВ СЮДА!
│  │        ├─ kvadrocikly-aodes/   ← Фото квадроциклов AODES
│  │        ├─ motovezdehody-aodes/ ← Фото мотовездеходов AODES
│  │        ├─ vezdehody-tinger/    ← Фото вездеходов Tinger
│  │        ├─ lodki-gladiator/     ← Фото лодок
│  │        ├─ lodochnye-motory-parsun/
│  │        └─ ... (по одной папке на бренд)
│  │
│  ├─ 📁 components/                ← ↪️ Переиспользуемые блоки сайта
│  │  ├─ Header.astro               ← Шапка (лого, поиск, меню, соцсети)
│  │  ├─ Footer.astro               ← Подвал (контакты, ссылки, реквизиты)
│  │  ├─ HeroSlider.astro           ← Слайдер баннеров на главной
│  │  ├─ CategoryCards.astro        ← 8 карточек категорий на главной
│  │  ├─ Partners.astro             ← Логотипы партнеров
│  │  ├─ Certificates.astro         ← Сертификаты дилера
│  │  ├─ ContactBlock.astro         ← Блок контактов внизу главной
│  │  └─ Disclaimer.astro           ← Предупреждение о характеристиках
│  │
│  ├─ 📁 data/                      ← 📂 ДАННЫЕ САЙТА (JSON, редактируются или импортируются)
│  │  ├─ categories.json            ← 8 главных категорий + их ссылки
│  │  ├─ banners.json               ← Баннеры для слайдера (пути, ссылки)
│  │  ├─ partners.json              ← Список партнеров
│  │  ├─ products.json              ← ⚠️ УСТАРЕВШИЙ — не трогать (для совместимости)
│  │  ├─ store-183794-...csv        ← Старая выгрузка из Тильды (архив)
│  │  ├─ 📁 technique/              ← ⭐ НОВЫЕ ТЕХНИКА ИЗ CSV
│  │  │  ├─ kvadrocikly.json        ← Квадроциклы (импорт из product.csv)
│  │  │  ├─ snegohody.json          ← Снегоходы
│  │  │  ├─ lodki.json              ← Лодки ПВХ
│  │  │  └─ lodochnye-motory.json   ← Лодочные моторы
│  │  └─ 📁 catalog/                ← Будущие запчасти, аксессуары, экипировка
│  │     (пустая — будут добавлены из отдельного CSV)
│  │
│  ├─ 📁 layouts/                   ← Оболочка для всех страниц
│  │  └─ Layout.astro               ← Общий шаблон: Header + страница + Footer
│  │                                 + hero-баннер с картинкой категории
│  │
│  ├─ 📁 pages/                     ← ⭐ СТРАНИЦЫ САЙТА (каждый .astro = URL)
│  │  ├─ index.astro                ← / главная страница
│  │  ├─ aboutus.astro              ← /aboutus О нас
│  │  ├─ dostavka-i-oplata.astro    ← /dostavka-i-oplata
│  │  ├─ credit.astro               ← /credit Кредит / рассрочка
│  │  ├─ leasing.astro              ← /leasing Лизинг для ЮЛ
│  │  ├─ service.astro              ← /service Сервис и ремонт
│  │  ├─ parts.astro                ← /parts Запчасти
│  │  ├─ tuning.astro               ← /tuning Тюнинг
│  │  ├─ paper.astro                ← /paper Статьи / блог
│  │  ├─ about.astro                ← резервная копия «О нас»
│  │  ├─ odezhda-i-ehkipirovka.astro ← /odezhda-i-ehkipirovka (экипировка)
│  │  ├─ catalog-aksessuary.astro   ← /catalog-aksessuary
│  │  ├─ 📁 catalog/                ← ⭐ ⭐ ДИНАМИЧЕСКИЕ СТРАНИЦЫ КАТАЛОГА
│  │  │  ├─ index.astro             ← /catalog Общий список категорий
│  │  │  ├─ 📄 [category].astro     ← /catalog/kvadrocikly → Список брендов категории
│  │  │  └─ 📁 [category]/
│  │  │     ├─ 📄 [brand].astro     ← /catalog/kvadrocikly/kvadrocikly-aodes Карточки товаров бренда
│  │  │     └─ 📁 [brand]/
│  │  │        └─ 📄 [model].astro  ← Страница конкретного товара (галерея, цена, заявка)
│  │
│  ├─ 📁 utils/                     ← 🛠️ Вспомогательный код TypeScript
│  │  ├─ transliterate.ts           ← Русский текст → Латиница (для ЧПУ URL)
│  │  ├─ image-loader.ts            ← ⭐ АВТО-ЗАГРУЗКА ФОТО из src/assets/images/product/
│  │  └─ load-products.ts           ← ⭐ ЗАГРУЗКА ВСЕХ ТОВАРОВ из technique/ + catalog/ + products.json
│  │
│  └─ (может быть styles/ глобальные CSS)
│
├─ 📁 scripts/                      ← СКРИПТЫ ДЛЯ АДМИНА (импорт, нормализация)
│  ├─ import-technique.ts           ← ⭐ ⭐ ИМПОРТ ТЕХНИКИ: data-import/product.csv → technique/*.json
│  ├─ csv-to-json.js                ← Старый скрипт (резерв)
│  ├─ normalize-categories.js       ← Нормализация categories.json
│  ├─ normalize-banners.js          ← Нормализация баннеров
│  ├─ normalize-partners.js         ← Нормализация партнеров
│  └─ create-placeholder-assets.js  ← Создание заглушек
│
└─ 📁 dist/                         ← (генерируется npm run build) — готовый сайт для выгрузки на хостинг
```

---

## 🧠 ПРИНЦИП РАБОТЫ ЗАГРУЗКИ ТОВАРОВ

На сайте **4 источника товаров** (в порядке приоритета — первый важнее):

```
┌─────────────────────────────────────────────────────────────────┐
│ ПРИОРИТЕТ №1  src/data/technique/*.json   (НОВЫЙ, из CSV импорта)│
│   kvadrocikly.json  →  Квадроциклы AODES/STELS/Segway/Gladiator/Tinger  │
│   snegohody.json    →  Снегоходы AODES/STELS                   │
│   lodki.json        →  Лодки Gladiator                         │
│   lodochnye-motory.json → Моторы Gladiator/Parsun/Golfstream   │
├─────────────────────────────────────────────────────────────────┤
│ ПРИОРИТЕТ №2  src/data/catalog/*.json     (БУДУЩЕЕ — запчасти) │
│   zapchasti.json   aksessuary.json   ekipirovka.json           │
├─────────────────────────────────────────────────────────────────┤
│ ПРИОРИТЕТ №3  src/data/products.json       (СТАРЫЙ, резерв)    │
│   (Если в technique/ нет товара — берем отсюда, чтобы не сломать URL)
└─────────────────────────────────────────────────────────────────┘
```

### Как работает `load-products.ts`:
1. Загружает ВСЕ `.json` файлы из `technique/` и `catalog/`
2. Склеивает в один список
3. **Удаляет дубли** — одинаковые товары из старого и нового источника сливаются (берутся фото/цена/SEO из более полной версии)
4. Кэширует результат (чтобы не пересчитывать каждый раз)

**Дедупликация:** товары с одинаковым названием (на русском) считаются одним товаром, даже если brandSlug разный.

### Как работает `image-loader.ts`:
```
В products.json: "photo": ["kvadrocikly-aodes/AODES-PATHCROSS-650-BLACK.jpg"]
                           ↓
image-loader.ts АВТОМАТИЧЕСКИ ищет этот файл здесь:
src/assets/images/product/kvadrocikly-aodes/AODES-PATHCROSS-650-BLACK.jpg
                           ↓
Передает компоненту <Image> из astro:assets → он делает WebP/AVIF, сжимает, генерирует несколько размеров
```

**НЕ НУЖНО** импортировать каждую картинку в коде. import.meta.glob загружает ВСЕ `.jpg/.jpeg/.png/.webp` из product/ автоматически.

---

## 🚀 КАК ЗАПУСТИТЬ ПРОЕКТ ЛОКАЛЬНО (с нуля)

### Шаг 0. Что нужно установить (один раз)
1. **Git** (скачать https://git-scm.com/download/win ) — для сохранения в GitHub и синхронизации между ПК
2. **Node.js v20+** (скачать https://nodejs.org/ru/download/current/ ) — движок Astro
   - После установки открыть PowerShell и выполнить:
     ```powershell
     Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
     ```
   (разрешить Node запускать скрипты)

### Шаг 1. Первый запуск на рабочем ПК
(если проект уже скачан с GitHub или уже лежит на диске)

```powershell
# Открываем ПАПКУ ПРОЕКТА
cd "c:\Users\user\Desktop\PROJEC SITE ASTRO\mirmotorov-astro"

# 1) Ставим все библиотеки (1 раз, или после обновления package.json)
npm install
```

### Шаг 2. Запустить сайт локально (для разработки)
```powershell
# Вариант 1 — стандарт (может не работать если IPv6):
npm run dev

# Вариант 2 — надежный (ИСПОЛЬЗУЙТЕ ЕГО):
npx astro dev --host 127.0.0.1 --port 5173
```
Дождитесь надписи:
```
┃ Local    http://127.0.0.1:5173/
```
Откройте в браузере **именно этот адрес** (не localhost!).

### Шаг 3. Собрать финальный сайт (для выгрузки в интернет)
```powershell
npm run build
```
Готовый сайт появится в папке **`dist/`**.

### Шаг 4. Проверить собранный сайт локально перед загрузкой на хостинг
```powershell
npx astro preview --host 127.0.0.1 --port 5173
```
Откройте http://127.0.0.1:5173 — выглядит ТОЧНО так же, как будет в интернете.

---

## ➕ КАК ДОБАВИТЬ / ОБНОВИТЬ ТЕХНИКУ (2 способа)

### Способ А — ⚡ ЧЕРЕЗ CSV (РЕКОМЕНДУЮ. 100+ товаров — 2 минуты)

#### Шаг 1. Подготовить Excel
Откройте ваш файл `product.xlsx` или создайте новый. **Столбцы (обязательные выделены ✅):**

| Столбец в Excel | Обяз? | Пример | Что это |
|---|:---:|---|---|
| `category` | ✅ | `Квадроциклы>>>Квадроциклы AODES;Техника` | **Главная категория >>> Подкатегория (бренд);Техника** |
| `title` | ✅ | `Квадроцикл AODES PATHCROSS 650 PRO` | Название товара (в H1) |
| `brand` | ✅ | `AODES` | Имя бренда |
| `brandSlug` | ✅ | `kvadrocikly-aodes` | Латинский ЧПУ бренда для URL (русские буквы заменяем на транслит, пробелы на `-`) |
| `modelSlug` | ✅ | `pathcross-650-pro` | Короткое имя модели для URL |
| `price` | ✅ | `895000` | Цена в рублях (только цифры, без пробелов и ₽) |
| `quantity` | ⚠️ | `5` | Остаток на складе (0 = «Под заказ, 2-5 дней») |
| `photo` | ✅ | `kvadrocikly-aodes/AODES-PATHCROSS-650-BLACK.jpg; kvadrocikly-aodes/AODES-PATHCROSS-650-SIDE.jpg` | **Пути к фото** через точку с запятой `;`. БАЗОВАЯ ПАПКА `src/assets/images/product/`. Если несколько фото — перечисляйте через `;` |
| `description` | ✅ | `652 куб.см, 44 л.с., EPS, лебедка` | Краткое описание для карточки |
| `text` | ✅ | `Полное описание с переносами строк. Характеристики, комплектация.` | Полное описание на странице товара (можно с `\n` — будет перенос строки, можно с HTML-тегами) |
| `article` | ❌ | `PAT650PRO` | Артикул |
| `seo_title` | ⚠️ | `Купить Квадроцикл AODES PATHCROSS 650 PRO в Красноярске` | Title в браузере. Если пусто — сгенерируется автоматически |
| `seo_description` | ⚠️ | `Официальный дилер AODES. Доставка по РФ, кредит, лизинг.` | Meta Description (для Яндекса/Google) |

> 💡 Опечатки в названиях столбцов (например `brandSlig`, `descriotion`, `aricle`) тоже работают — скрипт их понимает.

#### Шаг 2. Сохранить Excel как CSV
```
В Excel → Файл → Сохранить как →
  Тип: CSV (разделитель - точка с запятой) (*.csv)
  Имя: product.csv
  Папка: data-import/  ← ВАЖНО!
```
В вопросе Excel про «потерю функций» — жмите **Да**. CSV это текст — нам и надо.

#### Шаг 3. ⚠️ СКОПИРОВАТЬ ФОТО В ПРАВИЛЬНУЮ ПАПКУ!
Файлы фото из столбца `photo` должны реально существовать:
```
ПУТЬ В CSV: kvadrocikly-aodes/AODES-PATHCROSS-650-BLACK.jpg
                         ↓
РЕАЛЬНО НА ДИСКЕ: src/assets/images/product/kvadrocikly-aodes/AODES-PATHCROSS-650-BLACK.jpg
```
- Если у вас в Excel путь `vezdehody-tinger/tinger-tf4-main.jpg` —
  положите `tinger-tf4-main.jpg` в папку `src/assets/images/product/vezdehody-tinger/`
- Новую папку для бренда создавайте вручную в проводнике.

#### Шаг 4. Запустить импорт
```powershell
cd "c:\Users\user\Desktop\PROJEC SITE ASTRO\mirmotorov-astro"
npm run import -- product.csv
```
Что сделает скрипт:
1. Прочитает `data-import/product.csv`
2. Разобьет по **главным категориям**
3. Сохранит раздельные файлы: `src/data/technique/kvadrocikly.json`, `snegohody.json`, `lodki.json`, `lodochnye-motory.json`
4. В терминале напишет: сколько товаров добавлено в каждую категорию.
5. **Если товар с таким же названием уже есть** — обновит цену, наличие, фото (не будет дубликата).

#### Шаг 5. Проверить результат
```powershell
npm run build   # Собрать и убедиться что нет ошибок
```
Или запустить dev-сервер: http://127.0.0.1:5173/catalog/kvadrocikly

---

### Способ Б — ✋ ВРУЧНУЮ (для 1-5 товаров, или если нужно поправить 1 цену)

#### Шаг 1. Найти нужный JSON
Например, нужно добавить новый квадроцикл STELS — открываем:
`src/data/technique/kvadrocikly.json`

Формат файла — **JSON массив**, один большой квадратный скобок `[ ]`, товары через запятую.

#### Шаг 2. Добавить новый товар в конец списка (перед `]`)
Скопируйте любой существующий товар как шаблон, вставьте перед `]`, не забудьте запятую после предыдущего товара. Измените поля.

```json
{
  "title": "Квадроцикл STELS GUEST 800",
  "category": "Квадроциклы>>>Квадроциклы STELS;Техника",
  "brand": "STELS",
  "brandSlug": "kvadrocikly-stels",
  "modelSlug": "guest-800",
  "price": 1250000,
  "oldPrice": 1350000,
  "quantity": 2,
  "photo": [
    "kvadrocikly-stels/stels-guest-800-main.jpg",
    "kvadrocikly-stels/stels-guest-800-side.jpg"
  ],
  "description": "800сс, V-образный, 62 л.с.",
  "text": "Текст описания на странице товара",
  "article": "GST800",
  "seo": {
    "title": "Купить Квадроцикл STELS GUEST 800 в Красноярске",
    "description": "В наличии 2 шт. Доставка, кредит, лизинг. Тел: +7 (391) 272-05-55."
  }
}
```

#### Шаг 3. Фото — положить в правильную папку `src/assets/images/product/kvadrocikly-stels/`

#### Шаг 4. Проверить что JSON синтаксически правильный
Сохраните файл. Если не уверены в синтаксисе — вставьте текст в https://jsonlint.com/ — он проверит на ошибки.

#### Шаг 5. Запустить dev-сервер и проверить http://127.0.0.1:5173/catalog/kvadrocikly/kvadrocikly-stels/guest-800

---

## 💾 КАК СОХРАНИТЬ ПРОЕКТ В GITHUB (после всех правок)

Регистрация на https://github.com/ и подключение репозитория — делается ОДИН раз (мы уже сделали!).

### Каждый день, когда сделали правки — 4 команды:
```powershell
cd "c:\Users\user\Desktop\PROJEC SITE ASTRO\mirmotorov-astro"

# 1. Посмотреть, какие файлы менялись (необязательно, но полезно)
git status

# 2. Добавить ВСЕ измененные файлы в коммит
git add .

# 3. Сохранить версию локально (в кавычках пишите ЧТО изменили — понятно самому себе через месяц)
git commit -m "Обновил цены на квадроциклы AODES + добавил вездеход Tinger TF4"

# 4. Отправить на GitHub (в облако)
git push
```

Готово! Версия сохранена. Можете выключать ПК — ничего не пропадет.

---

## 💻 КАК ЗАПУСТИТЬ ПРОЕКТ НА ДРУГОМ ПК ИЗ GITHUB (например дома на macOS)

### Один раз — на новом ПК:
1. Установите **Git** (macOS обычно уже есть)
2. Установите **Node.js v20+** (https://nodejs.org/)
3. Создайте папку для проекта (например `~/Projects/mirmotorov-astro`)
4. Откройте терминал и выполните:
   ```bash
   cd ~/Projects/mirmotorov-astro
   # ↓↓↓ замените ВАШ_ЛОГИН на логин GitHub ↓↓↓
   git clone https://github.com/ВАШ_ЛОГИН/mirmotorov-astro.git .
   # (точка в конце важна — «в текущую папку»)
   npm install
   ```

### Каждый раз — перед началом работы:
```bash
git pull   # Подтянуть все последние правки с работы
npm run dev -- --host 127.0.0.1 --port 5173
```

### Каждый раз — после правок дома:
```bash
git add .
git commit -m "Добавил страницу о сервисе + изменил цены на снегоходы"
git push
```
На работе утром делаете `git pull` — все ваши домашние правки уже на рабочем ПК.

---

## 🖼️ КАРТИНКИ: ФОРМАТЫ, ГДЕ ХРАНИТЬ, КАК ИЗМЕНИТЬ

### 2 папки — 2 принципиально разных способа:

| Папка | Обрабатываются Astro? | Вес сайта | Форматы | Когда использовать |
|---|:---:|---|---|---|
| `src/assets/images/` | ✅ **ДА** (использовать ВЕЗДЕ!) | На **30-60% меньше** | `.jpg` `.jpeg` `.png` `.webp` `.avif` | ⭐ **ВСЕ ФОТО товаров, категорий, баннеров, партнеров** |
| `public/images/` | ❌ НЕТ (копируются как есть) | Вес как есть | Любые | Только файлы, которым не нужна оптимизация (например иконки для JS-библиотек) |

### ⭐ РЕКОМЕНДАЦИИ ПО ФОТО (для максимальной скорости):
- **Формат**: Изначально делайте `.jpg` (качество 85-90 в Photoshop). Astro сам перегонит в `.webp` при сборке — еще -30%
- **Ширина**: для товара — 1600px по длинной стороне (не нужно больше 4К — все равно будет сжато)
- **Имена файлов**: ТОЛЬКО латиница, цифры, дефис `-`, подчеркивание `_`. **НЕ ИСПОЛЬЗУЙТЕ ПРОБЕЛЫ, РУССКИЕ БУКВЫ, !?№%@()**.
  - ✅ Хорошо: `aodes-pathcross-650-pro-main-black.jpg`
  - ❌ Плохо: `Квадрик Аодэс Pathcross 650 Про BLACK (основное фото).jpg`
- **Папки для брендов**: одна папка = один бренд. Имя папки = `brandSlug` из CSV.
  Примеры: `kvadrocikly-aodes/`, `motovezdehody-aodes/`, `vezdehody-tinger/`, `snegohody-stels/`, `lodki-gladiator/`, `lodochnye-motory-parsun/`

### Как заменить картинку категории на другую?
Например, поменять Hero-баннер квадроциклов:
1. Подготовьте фото 1920×500 px (или 1400×400), сохраните как `kvadrocikly.jpg`
2. Скопируйте и замените файл: `src/assets/images/categories/kvadrocikly.jpg`
3. Перезапустите dev-сервер — все обновится.

### Как заменить баннеры на главной?
Слайдер в Hero использует 3 баннера. Они в `src/assets/images/banners/5.jpg`. Либо замените `5.jpg` на ваш (размер 1400×600), либо добавьте новые jpg и отредактируйте массив `banners` в **`src/components/HeroSlider.astro`**.

### Как заменить логотипы партнеров?
Папка `src/assets/images/partners/`. Названия: `aodes.png`, `stels.png`, `segway.png`, `gladiator.png`, `parsun.png`, `golfstream.png`, `baltmotors.png`, `ngk.png`, `motul.png`, `sea-pro.png`. Замените на ваши PNG с прозрачным фоном 300×150px.

---

## 📄 СПИСОК ВСЕХ СТРАНИЦ САЙТА (маршруты)

| URL | Файл | Описание |
|---|---|---|
| `/` | `src/pages/index.astro` | Главная страница (слайдер, 8 категорий, партнеры, сертификаты, контакты) |
| `/catalog` | `src/pages/catalog/index.astro` | Общая страница каталога |
| `/catalog/kvadrocikly` | `src/pages/catalog/[category].astro` | **Категория квадроциклов** — список брендов (AODES/Segway/STELS/Gladiator/Tinger) |
| `/catalog/kvadrocikly/kvadrocikly-aodes` | `src/pages/catalog/[category]/[brand].astro` | **Бренд AODES** — сетка карточек всех моделей + фильтр по цене |
| `/catalog/kvadrocikly/kvadrocikly-aodes/pathcross-650-pro` | `src/pages/catalog/[category]/[brand]/[model].astro` | **Страница товара** — галерея, цена, характеристики, форма заявки |
| `/aboutus` | `src/pages/aboutus.astro` | О нас |
| `/dostavka-i-oplata` | `src/pages/dostavka-i-oplata.astro` | Доставка и оплата |
| `/credit` | `src/pages/credit.astro` | Кредит и рассрочка |
| `/leasing` | `src/pages/leasing.astro` | Лизинг для ЮЛ |
| `/service` | `src/pages/service.astro` | Сервисный центр |
| `/parts` | `src/pages/parts.astro` | Запчасти (скоро) |
| `/tuning` | `src/pages/tuning.astro` | Тюнинг (скоро) |
| `/catalog-aksessuary` | `src/pages/catalog-aksessuary.astro` | Аксессуары (скоро) |
| `/odezhda-i-ehkipirovka` | `src/pages/odezhda-i-ehkipirovka.astro` | Экипировка (скоро) |

---

## 🧩 КАКИЕ ФАЙЛЫ ПРАВИТЬ ПРИ ЧАСТЫХ ЗАДАЧАХ

| Что нужно сделать? | Какой файл открыть? |
|---|---|
| Поменять телефон в шапке/подвале | `components/Header.astro` и `components/Footer.astro` |
| Поменять email/адрес/ВК/Телеграм | `Header.astro` + `Footer.astro` + `ContactBlock.astro` |
| Изменить название пункта меню | `Header.astro` (секция `.header__nav`) |
| Заменить логотип компании | `Header.astro` (строчка `Мир моторов`) |
| Добавить/изменить карточки категорий на главной | `components/CategoryCards.astro` |
| Изменить текст Hero-слайдера / баннеры | `components/HeroSlider.astro` |
| Изменить текст «О нас» | `pages/aboutus.astro` |
| Изменить цены доставки / способы оплаты | `pages/dostavka-i-oplata.astro` |
| Изменить проценты кредита | `pages/credit.astro` |
| Изменить условия лизинга | `pages/leasing.astro` |
| Поменять стоимость ремонта в сервисе | `pages/service.astro` |
| Добавить новую партнера | 1) Положить logo.png в `src/assets/images/partners/` 2) Добавить в `components/Partners.astro` |
| Заменить сертификаты | `components/Certificates.astro` |

---

## ❗ ЧАСТЫЕ ОШИБКИ И ИХ ИСПРАВЛЕНИЕ

### ❌ Ошибка: «git не распознан как имя командлета»
→ Не установлен Git. Скачай с https://git-scm.com/download/win

### ❌ Ошибка: «npm не распознан»
→ Не установлен Node.js. Скачай https://nodejs.org/ (v20+)

### ❌ Ошибка: «Выполнение сценариев отключено в этой системе»
Запустите PowerShell от имени админа и выполните:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
```

### ❌ Сайт не открывается localhost:4321 (пишет «не удается подключиться»)
→ Astro на Node 22 слушает только IPv6. Используйте **надежный вариант запуска**:
```powershell
npx astro dev --host 127.0.0.1 --port 5173
```
И открывайте **http://127.0.0.1:5173/**

### ❌ После npm run import товары не появились
1. Проверьте terminal — там написано сколько товаров обработано. Если 0 — проверьте столбец `category` в CSV.
2. Убедитесь, что `category` начинается с одного из 4 главных: **«Квадроциклы», «Снегоходы», «Лодки», «Лодочные моторы»**.
3. Проверьте путь к фото в `photo` — он должен быть относительно `src/assets/images/product/`. Файл должен реально лежать в этой папке.
4. Если фото не отображается — в браузере нажмите F12 → Console — там будет точная ошибка про путь.

### ❌ JSON файл «стал красным» / сайт упал после ручного редактирования
→ Вы сломали синтаксис JSON: пропущена запятая, кавычка или скобка. Скопируйте весь текст JSON в https://jsonlint.com/ — он подсветит строку с ошибкой.

### ❌ После обновления GitHub Pages сайт не обновился
→ Обновление страниц занимает **1-2 минуты**. Если не обновляется через 5 мин — очистите кэш браузера (Ctrl+F5) или откройте в режиме инкогнито.

### ❌ Картинки медленно грузятся при dev-сервере
→ ЭТО **НОРМАЛЬНО**. В режиме разработки Astro оптимизирует их «на лету».
→ Запустите `npm run build` + `npm run preview` — там уже сжатие WebP и все кэшируется. В продакшене все будет летать.

---

## 🛤️ ЧТО ЕЩЕ МОЖНО СДЕЛАТЬ (дорожная карта)
- ✅ Импорт техники из CSV → сделано
- 🔲 Импорт **запчастей/аксессуаров/экипировки** из отдельного CSV (поиск фото по коду товара)
- 🔲 Автогенерация `sitemap.xml` и `robots.txt` (для SEO)
- 🔲 Микроразметка Schema.org на карточки товаров (Яндекс.Поиск лучше индексирует)
- 🔲 Автосборка GitHub Actions (push в GitHub → сайт сам пересобирается и выкладывается в интернет)
- 🔲 Подключение формы заявки на товар на Telegram/почту (сейчас `alert()` для демо)
- 🔲 Привязка домена **mirmotorov24.ru** к GitHub Pages (CNAME + DNS)

---

## 📞 Техподдержка
Если застряли на каком-то шаге — пишите, я разберу.

---

### 💡 Памятка-шпаргалка (можно распечатать)
```
  ✅ Запустить сайт:   npx astro dev --host 127.0.0.1 --port 5173
  ✅ Импортировать CSV: npm run import -- product.csv
  ✅ Собрать прод:      npm run build
  ✅ Проверить прод:    npx astro preview --host 127.0.0.1 --port 5173
  ✅ Сохранить в GitHub:
      git add .
      git commit -m "Что сделали"
      git push
  ✅ Подтянуть с GitHub: git pull
```
│   │   └── Welcome.astro
│   ├── layouts
│   │   └── Layout.astro
│   └── pages
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
Тест синхронизации - все работает!