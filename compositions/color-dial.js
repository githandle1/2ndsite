import { parseColor, oklchToHex, oklchToSrgb } from "./color.js";

const TAU = Math.PI * 2;
const MAX_C = 0.4;

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function geometry(size) {
  const cx = size / 2;
  const cy = size / 2;
  const outer = size / 2 - 0.75;
  const thumb = Math.max(3.5, size * 0.08);
  return { cx, cy, outer, thumb };
}

function cssRgb(ok) {
  const { r, g, b } = oklchToSrgb(ok);
  return `rgb(${r | 0}, ${g | 0}, ${b | 0})`;
}

function assign(target, next) {
  target.l = next.l;
  target.c = next.c;
  target.h = next.h;
}

export function mountColorDial({ canvas, input, value, onChange }) {
  const oklch = { ...(parseColor(value) || parseColor("#8b2f32")) };
  const css = getComputedStyle(document.documentElement);
  const paper = css.getPropertyValue("--paper").trim() || "#faf9f6";
  const hover = css.getPropertyValue("--hover").trim() || "#8b2f32";

  let dragging = false;

  function currentHex() {
    return oklchToHex(oklch);
  }

  function syncInput(emit) {
    const hex = currentHex();
    if (input.value.toLowerCase() !== hex) input.value = hex;
    if (emit) onChange?.(oklch);
  }

  function layout() {
    const dpr = window.devicePixelRatio || 1;
    const cssSize = canvas.clientWidth || 50;
    canvas.width = Math.round(cssSize * dpr);
    canvas.height = Math.round(cssSize * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, size: cssSize };
  }

  function draw() {
    const { ctx, size } = layout();
    const { cx, cy, outer, thumb } = geometry(size);

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, outer, 0, TAU);
    ctx.clip();

    const wheel = ctx.createConicGradient(-Math.PI / 2, cx, cy);
    for (let i = 0; i <= 24; i++) {
      wheel.addColorStop(i / 24, cssRgb({ l: 0.7, c: 0.28, h: (i * 15) % 360 }));
    }
    ctx.fillStyle = wheel;
    ctx.fillRect(0, 0, size, size);

    const shine = ctx.createRadialGradient(cx - outer * 0.22, cy - outer * 0.28, 0, cx, cy, outer);
    shine.addColorStop(0, "rgba(255,255,255,0.14)");
    shine.addColorStop(0.4, "rgba(255,255,255,0)");
    shine.addColorStop(1, "rgba(0,0,0,0.1)");
    ctx.fillStyle = shine;
    ctx.fillRect(0, 0, size, size);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, outer, 0, TAU);
    ctx.strokeStyle = "rgba(36, 33, 31, 0.16)";
    ctx.lineWidth = 1;
    ctx.stroke();

    const angle = ((oklch.h - 90) * Math.PI) / 180;
    const radius = clamp(oklch.c / MAX_C, 0.12, 0.92) * outer;
    const mx = cx + Math.cos(angle) * radius;
    const my = cy + Math.sin(angle) * radius;
    ctx.beginPath();
    ctx.arc(mx, my, thumb, 0, TAU);
    ctx.fillStyle = paper;
    ctx.fill();
    ctx.strokeStyle = hover;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function posFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    const { cx, cy, outer } = geometry(rect.width);
    const x = (event.clientX ?? event.touches?.[0]?.clientX) - rect.left;
    const y = (event.clientY ?? event.touches?.[0]?.clientY) - rect.top;
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.hypot(dx, dy);
    let hue = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (hue < 0) hue += 360;
    return { dist, hue, outer };
  }

  function applyAt(event) {
    const hit = posFromEvent(event);
    oklch.h = hit.hue;
    oklch.c = clamp(hit.dist / Math.max(hit.outer, 1), 0.06, 1) * MAX_C;
    draw();
    syncInput(true);
  }

  function pointerDown(event) {
    event.preventDefault();
    dragging = true;
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
    applyAt(event);
  }

  function pointerMove(event) {
    if (!dragging) return;
    applyAt(event);
  }

  function pointerUp() {
    dragging = false;
  }

  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointermove", pointerMove);
  canvas.addEventListener("pointerup", pointerUp);
  canvas.addEventListener("pointercancel", pointerUp);

  input.addEventListener("change", () => {
    const next = parseColor(input.value);
    if (!next) {
      input.value = currentHex();
      return;
    }
    assign(oklch, next);
    input.value = currentHex();
    draw();
    onChange?.(oklch);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") input.blur();
  });

  input.value = currentHex();
  draw();
  window.addEventListener("resize", draw);

  return {
    setValue(value) {
      const next = parseColor(value);
      if (!next) return;
      assign(oklch, next);
      input.value = currentHex();
      draw();
    },
  };
}
