const fs = require('fs');
const path = require('path');

// Reads logo.jpeg.b64 from project root and writes logo.jpeg
const b64Path = path.join(__dirname, '..', 'logo.jpeg.b64');
const outPath = path.join(__dirname, '..', 'logo.jpeg');

if (!fs.existsSync(b64Path)) {
  console.error('Base64 file not found:', b64Path);
  process.exit(1);
}

const b64 = fs.readFileSync(b64Path, 'utf8').trim();
fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
console.log('Wrote', outPath);
