import sharp from 'sharp';
import { mkdir, writeFile, rmSync, existsSync, statSync, readdirSync } from 'fs';
import { promises as fsp } from 'fs';
import path from 'path';

const BASE = 'D:/project/seopung_/seopoong_detail/seopoong_detail/detail-page';
const DATA = 'D:/project/seopung_/data';
const OUT = 'D:/project/seopung_/dist/images';
const LQIP_OUT = 'D:/project/seopung_/dist/lqip.json';
const MAX_DIM = 1920;
const WEBP_QUALITY = 80;
const JPEG_QUALITY = 82;

const slides = [
  // ACT 1 - 브랜드 (slide01: CSS only)
  { id: 'slide02', base: BASE, src: '공통/data/어선 모자.jpg' },
  { id: 'slide03', base: BASE, src: '공통/data/어선.jpg' },
  // ACT 2 - 사옥 & 신뢰
  { id: 'slide_f1', base: DATA, src: 'KakaoTalk_20250626_103610365_06.jpg' },  // 사옥 근접 드론
  { id: 'slide_f2', base: DATA, src: 'KakaoTalk_20250626_103610365_09.jpg' },  // 사옥 항공 전경
  { id: 'slide04', base: BASE, src: '공통/data/Gemini_Generated_Image_be5qgybe5qgybe5q.png' },
  { id: 'slide05', base: BASE, src: '공통/data/DSC08139 1.png' },
  // slide06: CSS only (사업실적)
  // ACT 3 - 오징어
  { id: 'slide07', base: BASE, src: '58898 품질인증오징어/data/tc04650000024.jpg' },
  { id: 'slide08', base: BASE, src: '58898 품질인증오징어/data/tc00240104362.png' },
  { id: 'slide_h1', base: DATA, src: 'KakaoTalk_20250626_103619878_02.jpg' },  // HACCP 가공 현장
  { id: 'slide_h2', base: DATA, src: 'KakaoTalk_20250626_103619878.jpg' },     // IQF 냉동 라인
  // ACT 4 - 굴비
  { id: 'slide10', base: BASE, src: '58927 영광법성포굴비/data/배경.jpg' },
  { id: 'slide11', base: BASE, src: '58927 영광법성포굴비/data/굴비3.jpg' },
  { id: 'slide12', base: BASE, src: '58927 영광법성포굴비/data/굴비그림.png' },
  { id: 'slide13', base: DATA, src: 'KakaoTalk_20250626_103610365_13.jpg' },   // 사옥 다른 앵글 (굴비 공정 after)
  { id: 'slide14', base: BASE, src: '58927 영광법성포굴비/data/KakaoTalk_Photo_2026-01-28-17-28-48 005.jpg' },
  { id: 'slide15_table', base: BASE, src: '58927 영광법성포굴비/data/Gemini_Generated_Image_wqwu5bwqwu5bwqwu.png' },
  // ACT 5 - 마무리
  { id: 'slide16', base: BASE, src: '공통/data/Gemini_Generated_Image_hmash3hmash3hmas.png' },
  // slide17: CSS only (로고 마무리)
];

async function processImage(slide) {
  const inputPath = path.join(slide.base, slide.src);
  const ext = path.extname(slide.src).toLowerCase();
  const sharpOpts = ext === '.gif' ? { pages: 1 } : {};
  const meta = await sharp(inputPath, sharpOpts).metadata();

  // 가장 긴 변이 MAX_DIM을 넘지 않도록 리사이즈
  const longSide = Math.max(meta.width, meta.height);
  const resizeOpts = longSide > MAX_DIM
    ? (meta.width >= meta.height ? { width: MAX_DIM } : { height: MAX_DIM })
    : {};

  const webpPath = path.join(OUT, `${slide.id}.webp`);
  await sharp(inputPath, sharpOpts).resize(resizeOpts).webp({ quality: WEBP_QUALITY }).toFile(webpPath);

  const jpgPath = path.join(OUT, `${slide.id}.jpg`);
  await sharp(inputPath, sharpOpts).resize(resizeOpts).jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toFile(jpgPath);

  const lqipBuf = await sharp(inputPath, sharpOpts).resize({ width: 20 }).blur(2).jpeg({ quality: 30 }).toBuffer();
  const lqip = `data:image/jpeg;base64,${lqipBuf.toString('base64')}`;

  const webpSize = statSync(webpPath).size;
  const jpgSize = statSync(jpgPath).size;
  const orient = meta.width > meta.height ? 'LANDSCAPE' : meta.width === meta.height ? 'SQUARE' : 'PORTRAIT';

  console.log(
    `  ${slide.id}: ${meta.width}x${meta.height} [${orient}] → `
    + `WebP ${(webpSize/1024).toFixed(0)}KB, JPEG ${(jpgSize/1024).toFixed(0)}KB`
  );
  return { id: slide.id, lqip };
}

async function main() {
  console.log('서풍 박람회 이미지 최적화 빌드 v3');
  console.log('(사옥전경 + 가공시설 추가)');
  console.log('================================\n');

  if (existsSync(OUT)) {
    for (const f of readdirSync(OUT)) { try { rmSync(path.join(OUT, f)); } catch(e) {} }
  } else {
    await fsp.mkdir(OUT, { recursive: true });
  }

  console.log(`대상: ${slides.length}개 이미지\n`);

  const lqipData = {};
  for (const slide of slides) {
    try {
      const r = await processImage(slide);
      lqipData[r.id] = r.lqip;
    } catch (err) {
      console.error(`  ERROR ${slide.id}: ${err.message}`);
    }
  }

  await fsp.writeFile(LQIP_OUT, JSON.stringify(lqipData, null, 2));
  console.log(`\nLQIP 저장: ${LQIP_OUT}`);

  let total = 0;
  for (const f of readdirSync(OUT)) total += statSync(path.join(OUT, f)).size;
  console.log(`총 출력: ${(total / 1024 / 1024).toFixed(1)}MB`);
  console.log('빌드 완료!');
}

main().catch(console.error);
