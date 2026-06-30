import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const publicDir = path.join(process.cwd(), "public");

await Promise.all([
  sharp(path.join(publicDir, "favicon.svg"))
    .resize(256, 256)
    .png()
    .toFile(path.join(publicDir, "favicon.png")),
  sharp(path.join(publicDir, "logo.svg"))
    .resize(704, 160)
    .png()
    .toFile(path.join(publicDir, "logo.png")),
  sharp(path.join(publicDir, "og-image.svg"))
    .resize(1200, 630)
    .png()
    .toFile(path.join(publicDir, "og-image.png")),
]);

const outputs = await Promise.all(
  ["favicon.png", "logo.png", "og-image.png"].map(async (name) => {
    const stats = await fs.stat(path.join(publicDir, name));
    return { name, bytes: stats.size };
  })
);

console.log(JSON.stringify(outputs));
