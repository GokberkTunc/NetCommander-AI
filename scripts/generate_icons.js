const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Generate a 256x256 icon in uncompressed BMP wrapped in ICO format
function createBmpData(width, height) {
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const buffer = Buffer.alloc(pixelArraySize, 0);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (height - 1 - y) * rowSize + x * 3;
      
      // Outer background: Dark Slate (#10141D)
      let r = 16, g = 20, b = 29;

      // Outer bezel (border: 14px)
      const border = 14;
      if (x >= border && x < width - border && y >= border && y < height - border) {
        // Monitor bezel (#1B2232)
        r = 27; g = 34; b = 50;
        
        // Inner Screen area (border: 28px)
        const screenBorder = 28;
        if (x >= screenBorder && x < width - screenBorder && y >= screenBorder && y < height - screenBorder) {
          // Screen CRT background: Deep Navy/Black (#070A11)
          r = 7; g = 10; b = 17;

          // Top Header Bar / Dots (Retro SysAdmin lights)
          if (y >= screenBorder + 10 && y <= screenBorder + 20) {
            if (x >= screenBorder + 14 && x <= screenBorder + 24) { r = 255; g = 82; b = 82; }   // Red dot
            if (x >= screenBorder + 32 && x <= screenBorder + 42) { r = 255; g = 177; b = 66; }  // Yellow dot
            if (x >= screenBorder + 50 && x <= screenBorder + 60) { r = 0; g = 230; b = 118; }   // Green dot
          }

          // Draw Terminal prompt '>' in emerald green (#00E676)
          const cx = Math.floor(width / 3.2);
          const cy = Math.floor(height / 1.85);
          const size = 36;

          if (Math.abs(y - cy) <= (x - (cx - size)) && x >= cx - size && x <= cx + size/2 && y >= cy - size && y <= cy + size) {
            r = 0; g = 230; b = 118;
          }

          // Cursor '_' or AI Spark in cyan (#00E5FF)
          if (x >= cx + size + 10 && x <= cx + size * 2 + 10 && y >= cy + size/2 && y <= cy + size/2 + 10) {
            r = 0; g = 229; b = 255;
          }

          // AI Circuit / Spark Nodes on the right
          const nodeX = width - screenBorder - 50;
          const nodeY = cy;
          const dist = Math.sqrt((x - nodeX) * (x - nodeX) + (y - nodeY) * (y - nodeY));
          if (dist <= 14) {
            r = 0; g = 210; b = 255; // Core node
          } else if (dist <= 18 && dist > 14) {
            r = 41; g = 121; b = 255; // Halo
          }
        }
      }

      buffer[offset] = b;     // Blue
      buffer[offset + 1] = g; // Green
      buffer[offset + 2] = r; // Red
    }
  }

  return buffer;
}

function createIcoFile(width, height) {
  const bmpData = createBmpData(width, height);
  const biSize = 40;
  const biWidth = width;
  const biHeight = height * 2; // In ICO, BITMAPINFOHEADER height is 2 * height (XOR + AND masks)
  const biPlanes = 1;
  const biBitCount = 24;
  const biCompression = 0;
  const biSizeImage = bmpData.length;
  
  const andMaskSize = Math.ceil(width / 32) * 4 * height;
  const andMask = Buffer.alloc(andMaskSize, 0); // All 0 = opaque

  const dibHeader = Buffer.alloc(40);
  dibHeader.writeUInt32LE(biSize, 0);
  dibHeader.writeInt32LE(biWidth, 4);
  dibHeader.writeInt32LE(biHeight, 8);
  dibHeader.writeUInt16LE(biPlanes, 12);
  dibHeader.writeUInt16LE(biBitCount, 14);
  dibHeader.writeUInt32LE(biCompression, 16);
  dibHeader.writeUInt32LE(biSizeImage, 20);
  dibHeader.writeInt32LE(0, 24);
  dibHeader.writeInt32LE(0, 28);
  dibHeader.writeUInt32LE(0, 32);
  dibHeader.writeUInt32LE(0, 36);

  const imageBuffer = Buffer.concat([dibHeader, bmpData, andMask]);

  // ICO Header (6 bytes) + 1 Directory Entry (16 bytes)
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // Reserved
  icoHeader.writeUInt16LE(1, 2); // 1 = ICO
  icoHeader.writeUInt16LE(1, 4); // Number of images = 1

  const dirEntry = Buffer.alloc(16);
  dirEntry.writeUInt8(0, 0); // 0 means 256 in ICO spec
  dirEntry.writeUInt8(0, 1); // 0 means 256 in ICO spec
  dirEntry.writeUInt8(0, 2); // Color palette
  dirEntry.writeUInt8(0, 3); // Reserved
  dirEntry.writeUInt16LE(1, 4); // Color planes
  dirEntry.writeUInt16LE(24, 6); // Bits per pixel
  dirEntry.writeUInt32LE(imageBuffer.length, 8); // Size of image data
  dirEntry.writeUInt32LE(6 + 16, 12); // Offset of image data

  return Buffer.concat([icoHeader, dirEntry, imageBuffer]);
}

const icoBuffer = createIcoFile(256, 256);
fs.writeFileSync(path.join(assetsDir, 'icon.ico'), icoBuffer);
fs.writeFileSync(path.join(assetsDir, 'icon.png'), icoBuffer);
console.log('Generated assets/icon.ico (256x256) successfully');
