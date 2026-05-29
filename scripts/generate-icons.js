const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const SIZE = 48;
const IMG_DIR = path.join(__dirname, '..', 'miniprogram', 'images');

if (!fs.existsSync(IMG_DIR)) {
  fs.mkdirSync(IMG_DIR, { recursive: true });
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawIcon(name, color, isActive) {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');

  const fill = isActive ? color : '#C0C0C0';
  const strokeColor = isActive ? color : '#A0A0A0';

  ctx.clearRect(0, 0, SIZE, SIZE);

  if (name === 'home') {
    // House icon
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(24, 8);   // roof top
    ctx.lineTo(8, 22);   // roof left
    ctx.lineTo(8, 40);   // wall left bottom
    ctx.lineTo(40, 40);  // wall right bottom
    ctx.lineTo(40, 22);  // roof right
    ctx.closePath();
    ctx.fill();

    // Door
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(19, 28, 10, 12);
    ctx.fillStyle = fill;
    ctx.fillRect(21, 30, 6, 10);

  } else if (name === 'history') {
    // Clock icon
    ctx.strokeStyle = fill;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(24, 24, 16, 0, Math.PI * 2);
    ctx.stroke();

    // Hour markers
    ctx.fillStyle = fill;
    ctx.fillRect(22, 10, 4, 8); // 12
    ctx.fillRect(22, 30, 4, 8); // 6

    // Clock hands
    ctx.strokeStyle = fill;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(24, 24);
    ctx.lineTo(24, 18);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(24, 24);
    ctx.lineTo(32, 24);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(24, 24, 2.5, 0, Math.PI * 2);
    ctx.fill();

  } else if (name === 'mine') {
    // Person icon
    ctx.fillStyle = fill;
    // Head
    ctx.beginPath();
    ctx.arc(24, 17, 7, 0, Math.PI * 2);
    ctx.fill();
    // Body
    ctx.beginPath();
    ctx.ellipse(24, 30, 10, 7, 0, Math.PI, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(24, 30, 10, 9, 0, 0, Math.PI);
    ctx.fill();
  }

  return canvas.toBuffer('image/png');
}

const icons = [
  { name: 'home', label: '首页' },
  { name: 'history', label: '历史' },
  { name: 'mine', label: '我的' }
];

const ACTIVE_COLOR = '#7B3FAF';

for (const icon of icons) {
  // Inactive (gray)
  const inactiveBuf = drawIcon(icon.name, ACTIVE_COLOR, false);
  fs.writeFileSync(path.join(IMG_DIR, `${icon.name}.png`), inactiveBuf);

  // Active (colored)
  const activeBuf = drawIcon(icon.name, ACTIVE_COLOR, true);
  fs.writeFileSync(path.join(IMG_DIR, `${icon.name}-active.png`), activeBuf);

  console.log(`✅ ${icon.label}: ${icon.name}.png + ${icon.name}-active.png`);
}

// default avatar
const avatarCanvas = createCanvas(48, 48);
const actx = avatarCanvas.getContext('2d');
actx.fillStyle = '#E0E0E0';
actx.beginPath();
actx.arc(24, 24, 24, 0, Math.PI * 2);
actx.fill();
actx.fillStyle = '#A0A0A0';
actx.beginPath();
actx.arc(24, 18, 7, 0, Math.PI * 2);
actx.fill();
actx.beginPath();
actx.ellipse(24, 32, 12, 8, 0, 0, Math.PI);
actx.fill();
fs.writeFileSync(path.join(IMG_DIR, 'default-avatar.png'), avatarCanvas.toBuffer('image/png'));
console.log('✅ 默认头像: default-avatar.png');

console.log('\n🎉 所有图标已生成！');
