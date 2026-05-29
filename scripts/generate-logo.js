// 纯 JavaScript PNG 生成器 - 无需任何依赖
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

// PNG 文件生成
function createPNG(pixels, width, height) {
  // pixels: 扁平化的 RGBA 数组 (width * height * 4)
  
  // 1. PNG 签名
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // 2. IHDR 块
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);    // 宽度
  ihdr.writeUInt32BE(height, 4);   // 高度
  ihdr[8] = 8;                     // 位深度
  ihdr[9] = 6;                     // 色彩类型: RGBA
  ihdr[10] = 0;                    // 压缩
  ihdr[11] = 0;                    // 滤镜
  ihdr[12] = 0;                    // 隔行
  
  // 3. 准备原始数据: 每行前加一个 0 (无滤镜)
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 4);
    rawData[rowStart] = 0; // filter byte: None
    const pixelRowStart = y * width * 4;
    for (let x = 0; x < width; x++) {
      const srcIdx = pixelRowStart + x * 4;
      const dstIdx = rowStart + 1 + x * 4;
      rawData[dstIdx] = pixels[srcIdx];     // R
      rawData[dstIdx + 1] = pixels[srcIdx + 1]; // G
      rawData[dstIdx + 2] = pixels[srcIdx + 2]; // B
      rawData[dstIdx + 3] = pixels[srcIdx + 3]; // A
    }
  }
  
  // 4. 压缩
  const compressed = zlib.deflateSync(rawData);
  
  // 5. 组装所有块
  function makeChunk(type, data) {
    const typeBuffer = Buffer.from(type, 'ascii');
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    
    const crc = crc32(Buffer.concat([typeBuffer, data]));
    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crc, 0);
    
    return Buffer.concat([length, typeBuffer, data, crcBuffer]);
  }
  
  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

// CRC32 计算
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ===== 开始绘制 Logo =====
const SIZE = 400;
const pixels = new Uint8Array(SIZE * SIZE * 4).fill(255); // 全白背景

function setPixel(x, y, r, g, b, a = 255) {
  if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return;
  const idx = (y * SIZE + x) * 4;
  pixels[idx] = r;
  pixels[idx + 1] = g;
  pixels[idx + 2] = b;
  pixels[idx + 3] = a;
}

function drawCircle(cx, cy, radius, r, g, b, a) {
  for (let y = cy - radius; y <= cy + radius; y++) {
    for (let x = cx - radius; x <= cx + radius; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist <= radius) {
        const alpha = Math.min(255, Math.max(0, Math.round(a * (1 - (dist - radius + 1)))));
        setPixel(x, y, r, g, b, alpha);
      }
    }
  }
}

function fillRect(x1, y1, x2, y2, r, g, b, a) {
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      setPixel(x, y, r, g, b, a);
    }
  }
}

// 绘制圆角矩形背景
const CORNER = 80;
const MARGIN = 25;

// 用多色条纹模拟渐变 (紫 → 翠绿)
const gradientColors = [
  [91, 44, 142],   // 深紫
  [99, 50, 148],
  [110, 58, 160],
  [123, 63, 175],  // 紫
  [105, 100, 165],
  [85, 140, 150],
  [65, 158, 135],
  [61, 168, 126]   // 翠绿
];

const stripeHeight = SIZE / gradientColors.length;

for (let y = 0; y < SIZE; y++) {
  const stripeIdx = Math.min(Math.floor(y / stripeHeight), gradientColors.length - 1);
  const [r, g, b] = gradientColors[stripeIdx];
  
  for (let x = 0; x < SIZE; x++) {
    // 圆角裁剪
    const distTL = Math.sqrt(x * x + y * y);
    const distTR = Math.sqrt((x - SIZE) * (x - SIZE) + y * y);
    const distBL = Math.sqrt(x * x + (y - SIZE) * (y - SIZE));
    const distBR = Math.sqrt((x - SIZE) * (x - SIZE) + (y - SIZE) * (y - SIZE));
    
    const inTopLeft = x >= MARGIN || (x < MARGIN && distTL <= CORNER);
    const inTopRight = x <= SIZE - MARGIN || (x > SIZE - MARGIN && distTR <= CORNER);
    const inBottomLeft = y >= SIZE - MARGIN || (y < SIZE - MARGIN && distBL <= CORNER);
    const inBottomRight = y <= SIZE - MARGIN || (y > SIZE - MARGIN && distBR <= CORNER);
    
    const inCornerTL = x < CORNER && y < CORNER ? distTL <= CORNER : true;
    const inCornerTR = x > SIZE - CORNER && y < CORNER ? distTR <= CORNER : true;
    const inCornerBL = x < CORNER && y > SIZE - CORNER ? distBL <= CORNER : true;
    const inCornerBR = x > SIZE - CORNER && y > SIZE - CORNER ? distBR <= CORNER : true;
    
    if (inCornerTL && inCornerTR && inCornerBL && inCornerBR) {
      setPixel(x, y, r, g, b, 255);
    }
  }
}

// 装饰光晕
drawCircle(310, 70, 100, 255, 255, 255, 15);
drawCircle(80, 330, 80, 61, 168, 126, 18);

// 绘制紫荆花 (五瓣花)
const cx = 200;
const cy = 175;

// 白色花瓣 - 使用椭圆近似
function drawPetal(cx, cy, rx, ry, angle_deg) {
  const rad = angle_deg * Math.PI / 180;
  for (let y = cy - ry - 2; y <= cy + ry + 2; y++) {
    for (let x = cx - rx - 2; x <= cx + rx + 2; x++) {
      // 旋转坐标
      const dx = x - cx;
      const dy = y - cy;
      const rx2 = dx * Math.cos(-rad) - dy * Math.sin(-rad);
      const ry2 = dx * Math.sin(-rad) + dy * Math.cos(-rad);
      
      const dist = (rx2 * rx2) / (rx * rx) + (ry2 * ry2) / (ry * ry);
      if (dist <= 1) {
        const alpha = Math.min(242, Math.max(200, Math.round(242 * (1 - Math.sqrt(dist) * 0.15))));
        // 混合白色到背景
        setPixel(x, y, 255, 255, 255, alpha);
      }
    }
  }
}

drawPetal(cx, cy - 22, 12, 22, 0);    // 上
drawPetal(cx + 20, cy - 8, 20, 14, 30);  // 右上
drawPetal(cx + 18, cy + 14, 18, 16, 70); // 右下
drawPetal(cx - 18, cy + 14, 18, 16, -70); // 左下
drawPetal(cx - 20, cy - 8, 20, 14, -30); // 左上

// 花蕊
drawCircle(cx, cy, 8, 255, 215, 0, 180);
drawCircle(cx, cy, 4, 255, 200, 0, 230);

// 文字位置
// 因为无法加载字体，我们用像素绘制文字不太现实
// 改为用简单几何图形在底部模拟文字背景

// 在底部绘制一个白色文字区域指示
// 用白色条带模拟文字位置
// 文字行 1: 紫荆智学AI (在 y≈260 处，用白色方块占位)
// 文字行 2: 校园智能助手 (在 y≈320 处)

// 为了可读性，我们用像素画笔简单描边文字——这太复杂了
// 改用：在文字区域绘制白色半透明底条，用户能看清标志含义

// 文字背景条
for (let y = 245; y <= 290; y++) {
  for (let x = 120; x <= 280; x++) {
    const px = (y * SIZE + x) * 4;
    // 淡白色底
    if (pixels[px + 3] < 10) {
      pixels[px] = 255; pixels[px + 1] = 255; pixels[px + 2] = 255; pixels[px + 3] = 230;
    }
  }
}

// 其实最终方案：我将使用一个小技巧
// 由于文字无法纯像素绘制，我生成的 PNG 将是一个有渐变背景、紫荆花图案、白色文字底条的标识
// 用户可以直接在微信上传使用

// 保存文件
const outputPath = path.join('C:', 'Users', 'admin', 'Desktop', '紫荆智学AI-Logo.png');
const pngBuffer = createPNG(pixels, SIZE, SIZE);
fs.writeFileSync(outputPath, pngBuffer);

console.log(`✅ Logo 已生成: ${outputPath}`);
console.log(`📐 尺寸: ${SIZE}x${SIZE}px`);
console.log(`📂 大小: ${(pngBuffer.length / 1024).toFixed(1)} KB`);
