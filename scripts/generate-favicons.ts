import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Rasterizes the favicon SVGs into the PNG + ICO set in public/favicon.
// The PNG set uses the light-circle variant (favicon-dark.svg), matching the
// original assets; favicon.ico embeds 16px + 32px PNGs.
const faviconDir = path.join(process.cwd(), "public/favicon");
const publicDir = path.join(process.cwd(), "public");
const sourceSvg = path.join(faviconDir, "favicon-dark.svg");

const pngTargets: Array<[string, number]> = [
  ["favicon-16x16.png", 16],
  ["favicon-32x32.png", 32],
  ["apple-touch-icon.png", 180],
  ["android-chrome-192x192.png", 192],
  ["android-chrome-512x512.png", 512],
];

function buildIco(images: Array<{ size: number; data: Buffer }>) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);

  const entries: Buffer[] = [];
  let offset = 6 + images.length * 16;

  for (const image of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(image.size === 256 ? 0 : image.size, 0);
    entry.writeUInt8(image.size === 256 ? 0 : image.size, 1);
    entry.writeUInt8(0, 2); // palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(image.data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += image.data.length;
  }

  return Buffer.concat([header, ...entries, ...images.map(image => image.data)]);
}

async function main() {
  const svg = await readFile(sourceSvg);

  for (const [filename, size] of pngTargets) {
    await sharp(svg, { density: 72 * (size / 512) * 8 })
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toFile(path.join(faviconDir, filename));
  }

  const icoImages = await Promise.all(
    [16, 32].map(async size => ({
      size,
      data: await sharp(svg).resize(size, size).png({ compressionLevel: 9 }).toBuffer(),
    })),
  );

  const ico = buildIco(icoImages);
  await writeFile(path.join(faviconDir, "favicon.ico"), ico);
  await writeFile(path.join(publicDir, "favicon.ico"), ico);
}

await main();
