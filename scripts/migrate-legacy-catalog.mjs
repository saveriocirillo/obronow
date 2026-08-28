// One-off migration script: scrapes the legacy obro.pl HTTrack mirror
// (served at http://www.obro.pl) into src/content/products/legacy-catalog.json
// and downloads product images into public/products/legacy/.
//
// Usage: node scripts/migrate-legacy-catalog.mjs

import * as cheerio from 'cheerio';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BASE = 'http://www.obro.pl';
const OUT_JSON = path.resolve('src/content/products/legacy-catalog.json');
const OUT_IMAGES = path.resolve('public/products/legacy');

const CATEGORY_SLUGS = {
  'Łączniki do drewna': 'laczniki-do-drewna',
  'Taśmy montażowe': 'tasmy-montazowe',
  'Złącza ogrodowe': 'zlacza-ogrodowe',
  Zawiasy: 'zawiasy',
  Inne: 'inne',
};

const POLISH_MAP = {
  ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z',
  Ą: 'a', Ć: 'c', Ę: 'e', Ł: 'l', Ń: 'n', Ó: 'o', Ś: 's', Ź: 'z', Ż: 'z',
};

function slugify(input) {
  return input
    .split('')
    .map((ch) => POLISH_MAP[ch] ?? ch)
    .join('')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function fetchDoc(pagePath) {
  const res = await fetch(`${BASE}/${pagePath}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const html = new TextDecoder('iso-8859-2').decode(buf);
  return cheerio.load(html);
}

async function downloadImage(srcPath, destFile) {
  const res = await fetch(`${BASE}/${srcPath}`);
  if (!res.ok) return false;
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(path.dirname(destFile), { recursive: true });
  await writeFile(destFile, buf);
  return true;
}

async function parseProductList() {
  const $ = await fetchDoc('produkty.html');
  const items = [];
  $('#body h4').each((_, h4) => {
    const categoryName = $(h4).text().trim();
    const categorySlug = CATEGORY_SLUGS[categoryName];
    if (!categorySlug) throw new Error(`Unknown category: ${categoryName}`);
    $(h4).next('div.fx').find('a').each((_, a) => {
      const href = $(a).attr('href');
      const id = href.match(/katalog-(\d+)\.html/)[1];
      items.push({ id, href, categoryName, categorySlug });
    });
  });
  return items;
}

const IMAGE_KIND_BY_FOLDER = {
  zdjecia: 'photo',
  techniczne: 'technical',
  montaz: 'installation',
};

async function parseProductPage(item) {
  const $ = await fetchDoc(item.href);
  const titleHtml = $('#body h2').first().html() ?? '';
  const titleParts = titleHtml
    .split(/<br\s*\/?>/i)
    .map((s) => cheerio.load(s).text().trim())
    .filter(Boolean);
  const title = titleParts.join(' / ');

  const dimCols = [];
  $('#body table thead tr').eq(1).find('th').each((_, th) => {
    dimCols.push($(th).text().trim());
  });

  const variants = [];
  $('#body table tbody tr').each((_, tr) => {
    const cells = $(tr).find('td').map((_, td) => $(td).text().trim()).get();
    // cells: [Lp, Nr katalogowy, ...dimCols, Ilość]
    const [, sku, ...rest] = cells;
    const packageQty = rest.pop();
    const dimensions = {};
    dimCols.forEach((col, i) => {
      const val = rest[i];
      if (val && val !== '-') dimensions[col] = val;
    });
    variants.push({ sku, dimensions, packageQty });
  });

  // Use the actual <img class="maly"> sources rather than guessing filenames —
  // some families (e.g. 32, 57, 58) bundle multiple photos/drawings/installation
  // diagrams under one product page.
  const imageSrcs = $('#obrazki img.maly').map((_, img) => $(img).attr('src')).get();
  const images = [];
  for (const src of imageSrcs) {
    const [, folder, filename] = src.match(/^male\/([^/]+)\/(.+)$/) ?? [];
    const kind = IMAGE_KIND_BY_FOLDER[folder] ?? folder ?? 'other';
    const fullSizeSrc = src.replace(/^male\//, 'duze/');
    const destFile = path.join(OUT_IMAGES, `${item.id}-${kind}-${filename}`);
    const ok = await downloadImage(fullSizeSrc, destFile);
    if (ok) images.push({ kind, path: `/products/legacy/${item.id}-${kind}-${filename}` });
  }

  return {
    id: item.id,
    slug: slugify(title) || `product-${item.id}`,
    title,
    titleParts,
    category: item.categorySlug,
    images,
    dimensionColumns: dimCols,
    variants,
    incomplete: variants.length === 0,
  };
}

async function main() {
  const list = await parseProductList();
  console.log(`Found ${list.length} product families across ${new Set(list.map((i) => i.categorySlug)).size} categories.`);

  const products = [];
  const seenSlugs = new Set();
  for (const item of list) {
    process.stdout.write(`Fetching ${item.href}... `);
    const product = await parseProductPage(item);
    if (seenSlugs.has(product.slug)) product.slug = `${product.slug}-${item.id}`;
    seenSlugs.add(product.slug);
    console.log(`${product.title} (${product.variants.length} variants)`);
    products.push(product);
  }

  await mkdir(path.dirname(OUT_JSON), { recursive: true });
  await writeFile(OUT_JSON, JSON.stringify(products, null, 2) + '\n', 'utf-8');
  console.log(`\nWrote ${products.length} product families to ${OUT_JSON}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
