const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const svgPath = path.join(__dirname, "..", "src", "favicon.svg");
const publicDir = path.join(__dirname, "..", "public");
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);

async function generate() {
  const svg = fs.readFileSync(svgPath);

  // Copy SVG for modern browsers
  fs.copyFileSync(svgPath, path.join(publicDir, "favicon.svg"));

  // 32x32 PNG
  await sharp(svg).resize(32, 32).png().toFile(path.join(publicDir, "favicon-32x32.png"));

  // favicon.ico (ICO wrapping 32x32 PNG)
  const icoPng = await sharp(svg).resize(32, 32).png().toBuffer();
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0);
  icoHeader.writeUInt16LE(1, 2);
  icoHeader.writeUInt16LE(1, 4);
  const icoDir = Buffer.alloc(16);
  icoDir.writeUInt8(32, 0);
  icoDir.writeUInt8(32, 1);
  icoDir.writeUInt8(0, 2);
  icoDir.writeUInt8(0, 3);
  icoDir.writeUInt16LE(1, 4);
  icoDir.writeUInt16LE(32, 6);
  icoDir.writeUInt32LE(icoPng.length, 8);
  icoDir.writeUInt32LE(22, 12);
  fs.writeFileSync(
    path.join(publicDir, "favicon.ico"),
    Buffer.concat([icoHeader, icoDir, icoPng])
  );

  // 180x180 apple-touch-icon
  await sharp(svg).resize(180, 180).png().toFile(path.join(publicDir, "apple-touch-icon.png"));

  console.log("Favicons generated in public/");
}

generate();
