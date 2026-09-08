// src/utils/query-parse.ts
// ✅ Best Practice Astro: ВСЕ regexp / regex-операции В .ts ФАЙЛ!
// (в .astro frontmatter regex ломают Rolldown на Windows → Unterminated string)

/** Замена "+" на пробел в query параметрах (application/x-www-form-urlencoded) */
export function spacePlus(s: string): string {
  if (!s) return '';
  let out = '';
  for (let j = 0; j < s.length; j++) {
    const c = s.charAt(j);
    out += c === '+' ? ' ' : c;
  }
  return out;
}

/** Ручной парсер query — БЕЗ Astro.url.searchParams (на Windows он иногда пустой в SSG) */
export function getQueryParam(name: string, urlSearch: string): string {
  if (!urlSearch || !name) return '';
  let q = urlSearch;
  if (q.charAt(0) === '?') q = q.substring(1);
  if (!q) return '';

  let i = 0;
  let start = 0;
  while (i <= q.length) {
    const amp = q.indexOf('&', i);
    const end = amp < 0 ? q.length : amp;
    if (end >= start) {
      const pair = q.substring(start, end);
      if (pair.length > 0) {
        const eqAt = pair.indexOf('=');
        const k = eqAt < 0 ? pair : pair.substring(0, eqAt);
        if (k === name) {
          const v = eqAt < 0 ? '' : pair.substring(eqAt + 1);
          let out = spacePlus(v);
          try { out = decodeURIComponent(out); } catch (_) { /* ignore */ }
          return out;
        }
      }
    }
    if (amp < 0) break;
    i = amp + 1;
    start = i;
  }
  return '';
}

/** Вспомогательные для фильтров бренд-страницы: нормализация полей + диапазоны */

export function cleanStrOnlyAlnum(s: any): string {
  if (s === undefined || s === null) return '';
  const raw = String(s);
  let out = '';
  for (let i = 0; i < raw.length; i++) {
    const c = raw.charAt(i);
    const code = raw.charCodeAt(i);
    // a-z, A-Z, 0-9, А-Я а-я ёЁ → charcode
    if (
      (code >= 48 && code <= 57) ||
      (code >= 65 && code <= 90) ||
      (code >= 97 && code <= 122) ||
      (code >= 0x0410 && code <= 0x044F) || // А…Я а…я
      code === 0x0401 || code === 0x0451 // Ё ё
    ) {
      out += c;
    }
  }
  return out.toLowerCase();
}

/** inRange — УНИВЕРСАЛЬНЫЙ (для price/cc/power/track): БЕЗ REGEX! */
export function inRangeSafe(valRaw: any, range: string): boolean {
  if (!range) return true;
  if (valRaw === undefined || valRaw === null) return false;

  // 1) Число из valRaw: оставляем ТОЛЬКО цифры/./- → через цикл
  let s = '';
  const rawS = String(valRaw);
  for (let i = 0; i < rawS.length; i++) {
    const c = rawS.charAt(i);
    const code = rawS.charCodeAt(i);
    if (code === 46 /* . */ || code === 45 /* - */ || (code >= 48 && code <= 57)) s += c;
  }
  if (!s) return false;
  const num = parseFloat(s);
  if (isNaN(num)) return false;

  // 2) Парс range (split через indexOf)
  if (range.charAt(0) === '-') {
    const bS = range.substring(1);
    const b = parseFloat(bS);
    return !isNaN(b) && num <= b;
  }
  if (range.charAt(range.length - 1) === '-') {
    const aS = range.substring(0, range.length - 1);
    const a = parseFloat(aS);
    return !isNaN(a) && num >= a;
  }
  const dashAt = range.indexOf('-');
  if (dashAt < 0) return false;
  const aS = range.substring(0, dashAt);
  const bS = range.substring(dashAt + 1);
  const a = parseFloat(aS);
  const b = parseFloat(bS);
  return !isNaN(a) && !isNaN(b) && num >= a && num <= b;
}

/** Нормализация тактности (БЕЗ regex) */
export function normTactSafe(s: any): string | undefined {
  if (s === undefined || s === null) return undefined;
  const x = cleanStrOnlyAlnum(s);
  const two = cleanStrOnlyAlnum('2 тактный two');
  const four = cleanStrOnlyAlnum('4 тактный four');
  if (x === '2' || x.startsWith('2такт') || two.includes(x)) return '2';
  if (x === '4' || x.startsWith('4такт') || four.includes(x)) return '4';
  return undefined;
}

/** Нормализация управления (БЕЗ regex) */
export function normControlSafe(s: any): string | undefined {
  if (s === undefined || s === null) return undefined;
  const x = cleanStrOnlyAlnum(s);
  const rum = cleanStrOnlyAlnum('rumpel румпель');
  const dist = cleanStrOnlyAlnum('distance дистанция пульт');
  if (x.substring(0, 3) === rum.substring(0, 3) || rum.includes(x) || x.includes('rum')) return 'rumpel';
  if (x.substring(0, 4) === dist.substring(0, 4) || dist.includes(x) || x.includes('dist') || x.includes('пулт')) return 'distance';
  return undefined;
}

/** Нормализация движителя (БЕЗ regex) */
export function normPropulsionSafe(s: any): string | undefined {
  if (s === undefined || s === null) return undefined;
  const x = cleanStrOnlyAlnum(s);
  const screw = cleanStrOnlyAlnum('screw винт');
  const jet = cleanStrOnlyAlnum('jet дж водомет');
  if (x.includes('vint') || x.includes('винт') || screw.includes(x) || x === 'screw') return 'screw';
  if (x.includes('jet') || x.includes('дж') || x.includes('водом') || jet.includes(x)) return 'jet';
  return undefined;
}

/** Тип лодки (БЕЗ regex) */
export function normBoatTypeSafe(s: any): string | undefined {
  if (s === undefined || s === null) return undefined;
  const x = cleanStrOnlyAlnum(s);
  if (x.includes('кил') || x === cleanStrOnlyAlnum('kilevaya')) return 'kilevaya';
  if (x.includes('тоннел') || x === cleanStrOnlyAlnum('tonnelnaya')) return 'tonnelnaya';
  if (x.includes('rib') || x.includes('риб')) return 'rib';
  return undefined;
}

/** Тип днища (БЕЗ regex) */
export function normFloorTypeSafe(s: any): string | undefined {
  if (s === undefined || s === null) return undefined;
  const x = cleanStrOnlyAlnum(s);
  if (x.includes('фанер') || x === cleanStrOnlyAlnum('fanera')) return 'fanera';
  if (x.includes('алюм') || x === cleanStrOnlyAlnum('aluminum')) return 'aluminum';
  if (x.includes('надув') || x.includes('air') || x.includes('airdeck') || x === 'air') return 'air';
  return undefined;
}
