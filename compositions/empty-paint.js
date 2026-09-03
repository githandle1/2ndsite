const SIZE = 32;
const FPS = 10;
const INK = "#d3c9ba";

// A round brush tilted 45°: long handle, ferrule band, one-pixel gap,
// then bristles that taper to a point at the bottom-left.
const SPRITE = [
  "................................",
  "................................",
  "................................",
  ".........................##.....",
  "........................####....",
  ".......................#####....",
  "......................#####.....",
  ".....................#####......",
  "....................#####.......",
  "...................#####........",
  "..................#####.........",
  ".................#####..........",
  "................#####...........",
  "............########............",
  "...........########.............",
  "............######..............",
  ".........##..#####..............",
  "........####..#####.............",
  ".......######..###..............",
  ".......#######..#...............",
  "......#########.................",
  "......#########.................",
  ".....#########..................",
  ".....########...................",
  "....#######.....................",
  "....#####.......................",
  "...####.........................",
  "...##...........................",
  "................................",
  "................................",
  "................................",
  "................................",
];

function hash(x, y, s) {
  let n = Math.imul(x + s * 13, 374761393) ^ Math.imul(y + s * 7, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function spritePixels() {
  const pixels = [];
  for (let y = 0; y < SIZE; y++) {
    const row = SPRITE[y] || "";
    for (let x = 0; x < SIZE; x++) {
      if (row[x] === "#") pixels.push({ x, y, order: hash(x, y, 3) * 0.6 + (x + (SIZE - y)) / 60 });
    }
  }
  pixels.sort((a, b) => a.order - b.order);
  return pixels;
}

function plot(ctx, x, y) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
  ctx.fillStyle = INK;
  ctx.fillRect(x, y, 1, 1);
}

export function startEmptyPaint(canvas) {
  if (!canvas) return () => {};
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const pixels = spritePixels();
  let frame = 0;
  let timer = 0;

  function draw() {
    if (!canvas.isConnected) return;
    ctx.clearRect(0, 0, SIZE, SIZE);

    const shown = Math.min(pixels.length, Math.max(0, Math.floor((frame - 1) * 6)));

    for (let i = 0; i < shown; i++) {
      const p = pixels[i];
      plot(ctx, p.x, p.y);
    }

    if (shown >= pixels.length) return;

    frame += 1;
    timer = window.setTimeout(draw, 1000 / FPS);
  }

  draw();
  return () => window.clearTimeout(timer);
}
