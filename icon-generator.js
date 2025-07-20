const fs = require("fs");
const { createCanvas } = require("canvas");

const sizes = [16, 48, 128];
const iconColor = "#4a4a4a";
const backgroundColor = "#ffffff";

sizes.forEach((size) => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, size, size);

  // Draw media icon - simple play button design
  ctx.fillStyle = iconColor;
  const padding = size * 0.2;
  const triangleSize = size - padding * 2;

  ctx.beginPath();
  ctx.moveTo(padding + triangleSize * 0.2, padding);
  ctx.lineTo(padding + triangleSize * 0.2, padding + triangleSize);
  ctx.lineTo(padding + triangleSize * 0.8, padding + triangleSize / 2);
  ctx.closePath();
  ctx.fill();

  // Save to file
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(`icon${size}.png`, buffer);
});
