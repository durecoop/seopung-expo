import sharp from 'sharp';
import { writeFile, readFileSync } from 'fs';
import path from 'path';

const OUT = 'D:/project/seopung_/dist/images';

const images = [
  { src: 'D:/project/seopung_/KakaoTalk_20260227_170140904.jpg', id: 'slide_pb_cj', name: 'CJ프레쉬웨이 어린이 안심 수산물' },
  { src: 'D:/project/seopung_/KakaoTalk_20260227_170140904_01.jpg', id: 'slide_pb_pulmuone1', name: '풀무원 순살생선' },
  { src: 'D:/project/seopung_/KakaoTalk_20260227_170140904_02.jpg', id: 'slide_pb_pulmuone2', name: '풀무원 녹차 해산물' },
];

async function main() {
  console.log('PB 납품 제품 이미지 최적화');
  console.log('='.repeat(50));

  const lqipData = {};

  for (const img of images) {
    console.log(`  Processing ${img.name}...`);
    const buf = readFileSync(img.src);

    await sharp(buf).resize({ width: 1920, height: 1080, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 }).toFile(path.join(OUT, `${img.id}.webp`));

    await sharp(buf).resize({ width: 1920, height: 1080, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(OUT, `${img.id}.jpg`));

    const lqipBuf = await sharp(buf).resize({ width: 20 }).blur(2).jpeg({ quality: 30 }).toBuffer();
    lqipData[img.id] = `data:image/jpeg;base64,${lqipBuf.toString('base64')}`;

    const meta = await sharp(path.join(OUT, `${img.id}.webp`)).metadata();
    console.log(`    -> ${img.id}.webp ${meta.width}x${meta.height}`);
  }

  // Merge LQIP
  const existing = JSON.parse(readFileSync('D:/project/seopung_/dist/lqip.json', 'utf8'));
  const merged = { ...existing, ...lqipData };
  await writeFile('D:/project/seopung_/dist/lqip.json', JSON.stringify(merged, null, 2), () => {});

  console.log('\nLQIP keys added:', Object.keys(lqipData).join(', '));
  // Print for copy-paste into L{}
  for (const [k, v] of Object.entries(lqipData)) {
    console.log(`"${k}":"${v}"`);
  }
}

main().catch(console.error);
