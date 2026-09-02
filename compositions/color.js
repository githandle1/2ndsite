function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function srgbToLinear(c) {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(c) {
  const x = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  return clamp(x, 0, 1) * 255;
}

function mul3(matrix, vec) {
  return [
    matrix[0][0] * vec[0] + matrix[0][1] * vec[1] + matrix[0][2] * vec[2],
    matrix[1][0] * vec[0] + matrix[1][1] * vec[1] + matrix[1][2] * vec[2],
    matrix[2][0] * vec[0] + matrix[2][1] * vec[1] + matrix[2][2] * vec[2],
  ];
}

// CSS Color 4, D65
const LIN_SRGB_TO_XYZ = [
  [506752 / 1228815, 87881 / 245763, 12673 / 70218],
  [87098 / 409605, 175762 / 245763, 12673 / 175545],
  [7918 / 409605, 87881 / 737289, 1001167 / 1053270],
];
const XYZ_TO_LIN_SRGB = [
  [12831 / 3959, -329 / 214, -1974 / 3959],
  [-851781 / 878810, 1648619 / 878810, 36519 / 878810],
  [705 / 12673, -2585 / 12673, 705 / 667],
];
const XYZ_TO_LMS = [
  [0.819022437996703, 0.3619062600528904, -0.1288737815209879],
  [0.0329836539323885, 0.9292868615863434, 0.0361446663506424],
  [0.0481771893596242, 0.2642395317527308, 0.6335478284694309],
];
const LMS_TO_OKLAB = [
  [0.210454268309314, 0.7936177747023054, -0.0040720430116193],
  [1.9779985324311684, -2.4285922420485799, 0.450593709617411],
  [0.0259040424655478, 0.7827717124575296, -0.8086757549230774],
];
const OKLAB_TO_LMS = [
  [1, 0.3963377773761749, 0.2158037573099136],
  [1, -0.1055613458156586, -0.0638541728258133],
  [1, -0.0894841775298119, -1.2914855480194092],
];
const LMS_TO_XYZ = [
  [1.2268798758459243, -0.5578149944602171, 0.2813910456659647],
  [-0.0405757452148008, 1.112286803280317, -0.0717110580655164],
  [-0.0763729366746601, -0.4214933324022432, 1.5869240198367816],
];

function linearSrgbToOklab(r, g, b) {
  const xyz = mul3(LIN_SRGB_TO_XYZ, [r, g, b]);
  const lms = mul3(XYZ_TO_LMS, xyz).map((c) => Math.cbrt(c));
  const [L, a, bOk] = mul3(LMS_TO_OKLAB, lms);
  return { L, a, b: bOk };
}

function oklabToLinearSrgb(L, a, b) {
  const lms = mul3(OKLAB_TO_LMS, [L, a, b]).map((c) => c ** 3);
  const xyz = mul3(LMS_TO_XYZ, lms);
  const [r, g, bLin] = mul3(XYZ_TO_LIN_SRGB, xyz);
  return { r, g, b: bLin };
}

export function normalizeOklch({ l, c, h }) {
  let hue = Number(h);
  if (!Number.isFinite(hue)) hue = 0;
  hue = ((hue % 360) + 360) % 360;
  return {
    l: clamp(Number(l) || 0, 0, 1),
    c: Math.max(0, Number(c) || 0),
    h: hue,
  };
}

function oklchToOklab({ l, c, h }) {
  const hr = (h * Math.PI) / 180;
  return { L: l, a: c * Math.cos(hr), b: c * Math.sin(hr) };
}

function oklabToOklch({ L, a, b }) {
  const c = Math.hypot(a, b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return normalizeOklch({ l: L, c, h: c < 1e-8 ? 0 : h });
}

function inGamut(rgb) {
  const eps = 1e-5;
  return rgb.r >= -eps && rgb.r <= 1 + eps && rgb.g >= -eps && rgb.g <= 1 + eps && rgb.b >= -eps && rgb.b <= 1 + eps;
}

function linearFromOklch(ok) {
  const lab = oklchToOklab(ok);
  return oklabToLinearSrgb(lab.L, lab.a, lab.b);
}

export function hexToRgb(hex) {
  const h = String(hex || "")
    .replace("#", "")
    .trim();
  if (h.length === 3 && /^[0-9a-f]+$/i.test(h)) {
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
    };
  }
  if (h.length >= 6 && /^[0-9a-f]+$/i.test(h.slice(0, 6))) {
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }
  return null;
}

export function rgbToHex({ r, g, b }) {
  const h = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

export function rgbToOklch(rgb) {
  return oklabToOklch(
    linearSrgbToOklab(srgbToLinear(rgb.r), srgbToLinear(rgb.g), srgbToLinear(rgb.b))
  );
}

export function hexToOklch(hex) {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToOklch(rgb) : null;
}

export function oklchToSrgb(ok) {
  const color = normalizeOklch(ok);
  let rgb = linearFromOklch(color);
  if (!inGamut(rgb)) {
    let lo = 0;
    let hi = color.c;
    for (let i = 0; i < 18; i++) {
      const mid = (lo + hi) / 2;
      rgb = linearFromOklch({ ...color, c: mid });
      if (inGamut(rgb)) lo = mid;
      else hi = mid;
    }
    rgb = linearFromOklch({ ...color, c: lo });
  }
  return {
    r: linearToSrgb(rgb.r),
    g: linearToSrgb(rgb.g),
    b: linearToSrgb(rgb.b),
  };
}

export function oklchToHex(ok) {
  return rgbToHex(oklchToSrgb(ok));
}

export function formatOklch(ok) {
  const color = normalizeOklch(ok);
  return `oklch(${(color.l * 100).toFixed(1)}% ${color.c.toFixed(3)} ${color.h.toFixed(1)})`;
}

export function parseColor(value) {
  if (value == null || value === "") return null;
  if (typeof value === "object") {
    if (Number.isFinite(value.l) && Number.isFinite(value.c) && Number.isFinite(value.h)) {
      return normalizeOklch(value);
    }
    return null;
  }
  const s = String(value).trim();
  const oklch = s.match(/^oklch\(\s*([0-9.]+)(%?)\s+([0-9.]+)\s+(-?[0-9.]+)(?:deg)?\s*\)$/i);
  if (oklch) {
    let l = Number(oklch[1]);
    if (oklch[2] === "%" || l > 1) l /= 100;
    return normalizeOklch({ l, c: Number(oklch[3]), h: Number(oklch[4]) });
  }
  return hexToOklch(s);
}

export function mixOklch(a, b, t) {
  const from = normalizeOklch(a);
  const to = normalizeOklch(b);
  const amount = clamp(t, 0, 1);
  const c = from.c + (to.c - from.c) * amount;
  let h = from.h;
  if (from.c < 1e-4 && to.c >= 1e-4) h = to.h;
  else if (to.c < 1e-4 && from.c >= 1e-4) h = from.h;
  else {
    let dh = to.h - from.h;
    if (dh > 180) dh -= 360;
    if (dh < -180) dh += 360;
    h = from.h + dh * amount;
    if (h < 0) h += 360;
    if (h >= 360) h -= 360;
  }
  return normalizeOklch({
    l: from.l + (to.l - from.l) * amount,
    c,
    h,
  });
}
