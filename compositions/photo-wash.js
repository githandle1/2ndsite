import { clampEffects } from "./effect-model.js?v=14";
import { oklchToSrgb } from "./color.js";

const PAPER = { r: 250, g: 249, b: 246 };
const TAU = Math.PI * 2;

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function amp(value, low, high) {
  return lerp(low, high, clamp(Number(value) || 0.5, 0, 1));
}

function hash(x, y, seed) {
  let n = Math.imul(x + seed * 13, 374761393) ^ Math.imul(y + seed * 7, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function mix(a, b, t) {
  return {
    r: lerp(a.r, b.r, t),
    g: lerp(a.g, b.g, t),
    b: lerp(a.b, b.b, t),
  };
}

function lumaOf(c) {
  return (c.r * 0.3 + c.g * 0.59 + c.b * 0.11) / 255;
}

function rgba(c, a) {
  return `rgba(${c.r | 0}, ${c.g | 0}, ${c.b | 0}, ${clamp(a, 0, 1)})`;
}

let cachedSrc = "";
let cachedImg = null;

function loadImage(src) {
  if (cachedSrc === src && cachedImg) return Promise.resolve(cachedImg);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      cachedSrc = src;
      cachedImg = img;
      resolve(img);
    };
    img.onerror = () => reject(new Error("the photograph would not open."));
    img.src = src;
  });
}

function profile(type) {
  if (type === "2B") return { wet: 1, dark: 1.18, paper: 0.9, kind: "wash" };
  if (type === "2H") return { wet: 0.85, dark: 0.82, paper: 1.15, kind: "wash" };
  if (type === "marker") return { wet: 0.15, dark: 1.1, paper: 0.75, kind: "marker" };
  if (type === "crayon") return { wet: 0, dark: 1.05, paper: 1.12, kind: "crayon" };
  if (type === "charcoal") return { wet: 0, dark: 1.25, paper: 1.18, kind: "charcoal" };
  if (type === "cpencil") return { wet: 0, dark: 0.94, paper: 1.2, kind: "pencil" };
  if (type === "spray") return { wet: 0.1, dark: 1, paper: 1.08, kind: "spray" };
  return { wet: 1, dark: 1, paper: 1, kind: "wash" };
}

function coverDraw(ctx, img, size, scale, ox, oy) {
  const s = Math.max(size / img.width, size / img.height) * scale;
  const w = img.width * s;
  const h = img.height * s;
  ctx.drawImage(img, (size - w) / 2 + ox, (size - h) / 2 + oy, w, h);
}

function placePhoto(img, size, e, seed) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.fillStyle = `rgb(${PAPER.r}, ${PAPER.g}, ${PAPER.b})`;
  ctx.fillRect(0, 0, size, size);
  const scale = amp(e.composition, 0.62, 1.45);
  const ox = amp(e.placeX, -size * 0.28, size * 0.28);
  const oy = amp(e.placeY, size * 0.28, -size * 0.28);
  coverDraw(ctx, img, size, scale, ox, oy);
  return canvas;
}

function sample(data, size, x, y) {
  const ix = clamp(x | 0, 0, size - 1);
  const iy = clamp(y | 0, 0, size - 1);
  const i = (iy * size + ix) * 4;
  return { r: data[i], g: data[i + 1], b: data[i + 2] };
}

function lumaAt(data, size, x, y) {
  return lumaOf(sample(data, size, x, y));
}

function edgeMag(data, size, x, y) {
  return Math.hypot(
    lumaAt(data, size, x + 1, y) - lumaAt(data, size, x - 1, y),
    lumaAt(data, size, x, y + 1) - lumaAt(data, size, x, y - 1)
  );
}

function grade(color, e, pigment, type) {
  let c = { ...color };
  const lift = amp(e.luminosity, -36, 40);
  const warm = amp(e.warmth, -28, 32);
  const mood = amp(e.valence, 0.72, 1.28);
  c.r = clamp(c.r + lift + warm * 0.8, 0, 255);
  c.g = clamp(c.g + lift + warm * 0.18, 0, 255);
  c.b = clamp(c.b + lift - warm * 0.65, 0, 255);
  c.r = clamp(128 + (c.r - 128) * mood, 0, 255);
  c.g = clamp(128 + (c.g - 128) * mood, 0, 255);
  c.b = clamp(128 + (c.b - 128) * mood, 0, 255);
  c = mix(c, pigment, amp(e.intimacy, 0.03, 0.36));
  c.r = clamp(c.r * type.dark, 0, 255);
  c.g = clamp(c.g * type.dark, 0, 255);
  c.b = clamp(c.b * type.dark, 0, 255);
  return c;
}

function dryMark(ctx, x, y, r, color, alpha, kind, weight, seed, i) {
  ctx.save();
  ctx.strokeStyle = rgba(color, alpha);
  ctx.fillStyle = rgba(color, alpha);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (kind === "spray") {
    const n = 7 + Math.floor(weight * 18);
    for (let k = 0; k < n; k++) {
      const px = x + (hash(i, k, seed) - 0.5) * r * 2.2;
      const py = y + (hash(k, i, seed) - 0.5) * r * 2.2;
      ctx.globalAlpha = alpha * (0.25 + hash(i, k + 3, seed) * 0.7);
      ctx.beginPath();
      ctx.arc(px, py, 0.4 + hash(i, k + 9, seed) * (1.2 + weight), 0, TAU);
      ctx.fill();
    }
  } else {
    const strokes = kind === "crayon" ? 4 : kind === "charcoal" ? 3 : 2;
    ctx.lineWidth = kind === "pencil" ? 0.6 + weight * 0.8 : kind === "charcoal" ? 1.4 + weight * 2.2 : 1.2 + weight * 2.4;
    for (let k = 0; k < strokes; k++) {
      const ang = (hash(i, k, seed) - 0.5) * (kind === "pencil" ? 0.8 : 1.6);
      const len = r * (0.8 + hash(i, k + 2, seed) * 1.4);
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(ang) * len, y - Math.sin(ang) * len);
      const mid = 6 * (hash(i, k + 4, seed) - 0.5);
      ctx.quadraticCurveTo(x + mid, y - mid, x + Math.cos(ang) * len, y + Math.sin(ang) * len);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function wetWash(src, size, e, pigment, type, seed) {
  const out = new Uint8ClampedArray(src.length);
  const bands = Math.round(amp(e.brushSharpness, 3, 7));
  const paperAmt = amp(e.density, 0.38, 0.14) * type.paper;
  const weight = amp(e.brushWeight, 0.78, 1.22);
  const grain = amp(e.granulation, 0.018, 0.1) * amp(e.brushGrain, 0.4, 1.35);
  const scatter = amp(e.brushScatter, 0.4, 5);
  const still = amp(e.stillness, 1.25, 0.35);
  const edgeAmt = amp(e.edgeSoftness, 0.18, 0.03);
  const depth = e.spatialDepth;
  const open = amp(e.brushSpacing, 0.08, 0.28);

  for (let y = 0, i = 0; y < size; y++) {
    for (let x = 0; x < size; x++, i += 4) {
      const jx = (hash(x, y, seed) - 0.5) * scatter * still;
      const jy = (hash(y, x, seed + 3) - 0.5) * scatter * still;
      let c = sample(src, size, x + jx, y + jy);
      const light = lumaOf(c);
      const pooled = Math.round(light * bands) / bands;
      const stain = clamp((1 - pooled) * weight, 0, 1);
      c = mix(PAPER, c, 0.18 + stain * 0.55);
      c = grade(c, e, pigment, type);
      const paper = clamp(0.22 + paperAmt + pooled * 0.42 + open, 0, 0.9);
      c = mix(c, PAPER, paper);

      const edge = edgeMag(src, size, x, y);
      if (edge > 0.028) {
        const ring = clamp(edge * 1.5, 0, 0.32) * (1 - edgeAmt) * weight;
        c = mix(c, { r: c.r * 0.7, g: c.g * 0.73, b: c.b * 0.76 }, ring);
      }

      const fade = lerp(1, 1 - clamp((y / size) * 0.28, 0, 0.28), depth);
      c = mix(PAPER, c, fade);

      const tooth = (hash(x, y, seed + 17) - 0.48) * 70 * grain;
      out[i] = clamp(c.r + tooth, 0, 255);
      out[i + 1] = clamp(c.g + tooth * 0.88, 0, 255);
      out[i + 2] = clamp(c.b + tooth * 0.72, 0, 255);
      out[i + 3] = 255;
    }
  }
  return out;
}

export async function renderPhotoWash({ photo, seed = 1, size = 720, effects = null }) {
  const e = clampEffects(effects || {});
  const type = profile(e.brushType);
  const img = await loadImage(photo);
  const placed = placePhoto(img, size, e, seed);
  const pigment = oklchToSrgb(e.color);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  ctx.fillStyle = `rgb(${PAPER.r}, ${PAPER.g}, ${PAPER.b})`;
  ctx.fillRect(0, 0, size, size);

  const wetBlur = type.kind === "marker"
    ? amp(e.edgeSoftness, 0.2, 1.4)
    : type.wet
      ? amp(e.edgeSoftness, 0.8, 2.8)
      : amp(e.edgeSoftness, 0.15, 1.2);
  ctx.save();
  ctx.filter = `blur(${wetBlur.toFixed(1)}px) saturate(${amp(e.valence, 88, 128)}%)`;
  ctx.globalAlpha = type.kind === "wash" || type.kind === "marker" ? 1 : 0.72;
  ctx.drawImage(placed, 0, 0);
  ctx.restore();

  const src = ctx.getImageData(0, 0, size, size);
  const next = ctx.createImageData(size, size);
  next.data.set(wetWash(src.data, size, e, pigment, type, seed));
  ctx.putImageData(next, 0, 0);

  if (type.kind !== "wash" && type.kind !== "marker") {
    const step = Math.max(7, Math.round(size * amp(e.brushSpacing, 0.014, 0.032)));
    const weight = amp(e.brushWeight, 0.4, 1.8);
    for (let y = step * 0.5; y < size; y += step) {
      for (let x = step * 0.5; x < size; x += step) {
        const srcPx = sample(src.data, size, x, y);
        if (lumaOf(srcPx) > 0.88) continue;
        const color = grade(srcPx, e, pigment, type);
        dryMark(ctx, x, y, step * 0.7, color, 0.42, type.kind, weight, seed, (x + y) | 0);
      }
    }
  }

  return canvas.toDataURL("image/jpeg", 0.92);
}

window.__renderPhotoWash = renderPhotoWash;
