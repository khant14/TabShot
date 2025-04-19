const { createCanvas } = require('canvas');
const fs = require('fs');

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#4CAF50';
  ctx.beginPath();
  ctx.roundRect(size * 0.1, size * 0.1, size * 0.8, size * 0.8, size * 0.15);
  ctx.fill();

  // Inner rectangle
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.roundRect(size * 0.25, size * 0.25, size * 0.5, size * 0.5, size * 0.1);
  ctx.fill();

  // Center circle
  ctx.fillStyle = '#4CAF50';
  ctx.beginPath();
  ctx.arc(size * 0.5, size * 0.5, size * 0.15, 0, Math.PI * 2);
  ctx.fill();

  return canvas.toBuffer('image/png');
}

// Create icons directory if it doesn't exist
if (!fs.existsSync('icons')) {
  fs.mkdirSync('icons');
}

// Generate icons in different sizes
[16, 48, 128].forEach(size => {
  const iconBuffer = generateIcon(size);
  fs.writeFileSync(`icons/icon${size}.png`, iconBuffer);
  console.log(`Generated icon${size}.png`);
}); 