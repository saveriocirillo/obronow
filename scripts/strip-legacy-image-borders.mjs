// One-off cleanup: every image scraped from the legacy obro.pl site has a
// thin green rounded-rect frame baked in at a fixed inset (verified: all
// 147 images are 400x400 with the ring spanning px 4-395 on both axes).
// Crop it out.
//
// Usage: node scripts/strip-legacy-image-borders.mjs

import sharp from 'sharp';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

const DIR = path.resolve('public/products/legacy');
const INSET = 16; // clears the ring (px 4-5) and its rounded-corner arcs (worst case px 12)

async function main() {
	const files = (await readdir(DIR)).filter((f) => f.endsWith('.jpg'));
	for (const file of files) {
		const filePath = path.join(DIR, file);
		const buffer = await sharp(filePath)
			.extract({ left: INSET, top: INSET, width: 400 - INSET * 2, height: 400 - INSET * 2 })
			.jpeg({ quality: 92 })
			.toBuffer();
		await sharp(buffer).toFile(filePath);
	}
	console.log(`Cropped border from ${files.length} images.`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
