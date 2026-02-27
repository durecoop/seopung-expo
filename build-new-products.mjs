import sharp from 'sharp';
import { writeFile } from 'fs/promises';
import { readFileSync } from 'fs';
import path from 'path';
import https from 'https';

const OUT = 'D:/project/seopung_/dist/images';
const BASE_URL = 'https://dureimg.ecoop.or.kr:9091/Delsys/DLOG/Goods/GoodsMaster/GoodsImage/';

// 삼치·고등어 신규 제품 이미지
const products = [
  { code: '56614C', name: '삼치자반 330g', slideId: 'slide_samchi1' },
  { code: '54376C', name: '대삼치살 700g', slideId: 'slide_samchi2' },
  { code: '50987C', name: '순살고등어 1kg', slideId: 'slide_godeungeo' },
];

function fetchImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { rejectUnauthorized: false }, res => {
      if (res.statusCode !== 200) { resolve(null); return; }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', () => resolve(null));
    }).on('error', () => resolve(null));
  });
}

async function main() {
  console.log('삼치·고등어 신규 이미지 다운로드 + 최적화');
  console.log('='.repeat(50));

  const lqipData = {};

  for (const p of products) {
    const url = `${BASE_URL}${p.code}.jpg`;
    console.log(`  Fetching ${p.code} (${p.name})...`);
    const buf = await fetchImage(url);
    if (!buf) { console.log('    SKIP - fetch failed'); continue; }

    const id = p.slideId;

    // Save optimized WebP (1920px max for slide background)
    await sharp(buf).resize({ width: 1920, height: 1080, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 }).toFile(path.join(OUT, `${id}.webp`));

    // Save JPEG fallback
    await sharp(buf).resize({ width: 1920, height: 1080, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(OUT, `${id}.jpg`));

    // LQIP
    const lqipBuf = await sharp(buf).resize({ width: 20 }).blur(2).jpeg({ quality: 30 }).toBuffer();
    lqipData[id] = `data:image/jpeg;base64,${lqipBuf.toString('base64')}`;

    const meta = await sharp(path.join(OUT, `${id}.webp`)).metadata();
    console.log(`    -> ${id}.webp ${meta.width}x${meta.height}`);
  }

  // Merge with existing LQIP
  const existingLqip = JSON.parse(readFileSync('D:/project/seopung_/dist/lqip.json', 'utf8'));
  const merged = { ...existingLqip, ...lqipData };
  await writeFile('D:/project/seopung_/dist/lqip.json', JSON.stringify(merged, null, 2));

  console.log(`\n완료! ${Object.keys(lqipData).length}개 신규 이미지 최적화`);
  console.log('LQIP에 추가된 키:', Object.keys(lqipData).join(', '));
}

main().catch(console.error);
