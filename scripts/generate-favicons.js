const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const srcImage = path.join(
  __dirname,
  "..",
  "original.jpg.webp"
);
const publicDir = path.join(__dirname, "..", "public");
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);

async function generate() {
  // Load and trim whitespace, then make it square
  const trimmed = await sharp(srcImage).trim().toBuffer({ resolveWithObject: true });
  const { width, height } = trimmed.info;
  const side = Math.max(width, height);
  const padX = Math.floor((side - width) / 2);
  const padY = Math.floor((side - height) / 2);

  const square = await sharp(trimmed.data)
    .extend({
      top: padY,
      bottom: side - height - padY,
      left: padX,
      right: side - width - padX,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .png()
    .toBuffer();

  // 32x32 favicon (nearest-neighbor to preserve pixel art)
  await sharp(square)
    .resize(32, 32, { kernel: "nearest" })
    .png()
    .toFile(path.join(publicDir, "favicon-32x32.png"));

  // SVG wrapper around the 32x32 PNG for modern browsers
  const png32 = await sharp(square)
    .resize(32, 32, { kernel: "nearest" })
    .png()
    .toBuffer();
  const b64 = png32.toString("base64");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <image href="data:image/png;base64,${b64}" width="32" height="32" image-rendering="pixelated"/>
</svg>`;
  fs.writeFileSync(path.join(publicDir, "favicon.svg"), svg);

  // favicon.ico (ICO wrapping a 32x32 PNG — works in Safari)
  const icoPng = await sharp(square)
    .resize(32, 32, { kernel: "nearest" })
    .png()
    .toBuffer();
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // reserved
  icoHeader.writeUInt16LE(1, 2); // type: ICO
  icoHeader.writeUInt16LE(1, 4); // count: 1
  const icoDir = Buffer.alloc(16);
  icoDir.writeUInt8(32, 0); // width
  icoDir.writeUInt8(32, 1); // height
  icoDir.writeUInt8(0, 2); // color palette
  icoDir.writeUInt8(0, 3); // reserved
  icoDir.writeUInt16LE(1, 4); // color planes
  icoDir.writeUInt16LE(32, 6); // bits per pixel
  icoDir.writeUInt32LE(icoPng.length, 8); // image size
  icoDir.writeUInt32LE(22, 12); // offset (6 + 16)
  fs.writeFileSync(
    path.join(publicDir, "favicon.ico"),
    Buffer.concat([icoHeader, icoDir, icoPng])
  );

  // 180x180 apple-touch-icon
  await sharp(square)
    .resize(180, 180, { kernel: "nearest" })
    .png()
    .toFile(path.join(publicDir, "apple-touch-icon.png"));

  console.log("Favicons generated in public/");
}

generate();
