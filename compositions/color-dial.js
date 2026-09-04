import { parseColor, oklchToHex, oklchToSrgb } from "./color.js";

const TAU = Math.PI * 2;
const MAX_C = 0.4;
const PIGMENTS = [
  { hex: "#8b2f32", name: "alizarin" },
  { hex: "#c45a2a", name: "sienna" },
  { hex: "#d4a24a", name: "ochre" },
  { hex: "#5f7a3a", name: "sap" },
  { hex: "#2f6f6a", name: "viridian" },
  { hex: "#3a6fa0", name: "cerulean" },
  { hex: "#3d4580", name: "ultramarine" },
  { hex: "#5a4a62", name: "mauve" },
  { hex: "#3f3c3a", name: "ink" },
  { hex: "#f0e6d4", name: "cream" },
];

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function geometry(size) {
  const cx = size / 2;
  const cy = size / 2;
  const outer = size / 2 - 1;
  const hole = outer * 0.34;
  const thumb = Math.max(5, size * 0.055);
  return { cx, cy, outer, hole, thumb };
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

function hexClose(a, b) {
  return String(a || "").toLowerCase() === String(b || "").toLowerCase();
}

export function mountColorDial({ canvas, input, value, onChange }) {
  const oklch = { ...(parseColor(value) || parseColor("#8b2f32")) };
  const css = getComputedStyle(document.documentElement);
  const paper = css.getPropertyValue("--paper").trim() || "#faf9f6";
  const hover = css.getPropertyValue("--hover").trim() || "#8b2f32";
  const lightEl = document.querySelector("#colorLight");
  const pigmentsEl = document.querySelector("#pigments");

  let dragging = false;

  function currentHex() {
    return oklchToHex(oklch);
  }

  function syncLight() {
    if (!lightEl) return;
    const next = String(Math.round(oklch.l * 100));
    if (lightEl.value !== next) lightEl.value = next;
  }

  function syncPigments() {
    if (!pigmentsEl) return;
    const hex = currentHex();
    for (const btn of pigmentsEl.querySelectorAll("button")) {
      btn.setAttribute("aria-selected", hexClose(btn.dataset.hex, hex) ? "true" : "false");
    }
  }

  function syncInput(emit) {
    const hex = currentHex();
    if (input.value.toLowerCase() !== hex) input.value = hex;
    syncLight();
    syncPigments();
    if (emit) onChange?.(oklch);
  }

  function layout() {
    const dpr = window.devicePixelRatio || 1;
    const cssSize = canvas.clientWidth || 96;
    canvas.width = Math.round(cssSize * dpr);
    canvas.height = Math.round(cssSize * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, size: cssSize };
  }

  function draw() {
    const { ctx, size } = layout();
    const { cx, cy, outer, hole, thumb } = geometry(size);

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, outer, 0, TAU);
    ctx.arc(cx, cy, hole, 0, TAU, true);
    ctx.clip();

    const wheel = ctx.createConicGradient(-Math.PI / 2, cx, cy);
    for (let i = 0; i <= 24; i++) {
      wheel.addColorStop(i / 24, cssRgb({ l: oklch.l, c: 0.28, h: (i * 15) % 360 }));
    }
    ctx.fillStyle = wheel;
    ctx.fillRect(0, 0, size, size);

    const fade = ctx.createRadialGradient(cx, cy, hole, cx, cy, outer);
    fade.addColorStop(0, "rgba(250,249,246,0.55)");
    fade.addColorStop(0.42, "rgba(250,249,246,0)");
    fade.addColorStop(1, "rgba(0,0,0,0.12)");
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, size, size);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, hole - 1, 0, TAU);
    ctx.fillStyle = cssRgb(oklch);
    ctx.fill();
    ctx.strokeStyle = "rgba(36, 33, 31, 0.16)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, outer, 0, TAU);
    ctx.strokeStyle = "rgba(36, 33, 31, 0.16)";
    ctx.lineWidth = 1;
    ctx.stroke();

    const angle = ((oklch.h - 90) * Math.PI) / 180;
    const radius = clamp(oklch.c / MAX_C, 0.18, 0.92) * (outer - hole) + hole;
    const mx = cx + Math.cos(angle) * radius;
    const my = cy + Math.sin(angle) * radius;
    ctx.beginPath();
    ctx.arc(mx, my, thumb, 0, TAU);
    ctx.fillStyle = paper;
    ctx.fill();
    ctx.strokeStyle = hover;
    ctx.lineWidth = 1.25;
    ctx.stroke();
  }

  function posFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    const { cx, cy, outer, hole } = geometry(rect.width);
    const x = (event.clientX ?? event.touches?.[0]?.clientX) - rect.left;
    const y = (event.clientY ?? event.touches?.[0]?.clientY) - rect.top;
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.hypot(dx, dy);
    let hue = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (hue < 0) hue += 360;
    return { dist, hue, outer, hole };
  }

  function applyAt(event) {
    const hit = posFromEvent(event);
    if (hit.dist < hit.hole * 0.72) return;
    oklch.h = hit.hue;
    const ring = Math.max(hit.outer - hit.hole, 1);
    oklch.c = clamp((hit.dist - hit.hole) / ring, 0.06, 1) * MAX_C;
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

  function mountPigments() {
    if (!pigmentsEl || pigmentsEl.childElementCount) return;
    for (const pigment of PIGMENTS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.hex = pigment.hex;
      btn.style.setProperty("--swatch", pigment.hex);
      btn.setAttribute("aria-label", pigment.name);
      btn.setAttribute("role", "option");
      btn.addEventListener("click", () => {
        const next = parseColor(pigment.hex);
        if (!next) return;
        assign(oklch, next);
        draw();
        syncInput(true);
      });
      pigmentsEl.append(btn);
    }
  }

  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointermove", pointerMove);
  canvas.addEventListener("pointerup", pointerUp);
  canvas.addEventListener("pointercancel", pointerUp);

  lightEl?.addEventListener("input", () => {
    oklch.l = clamp(Number(lightEl.value) / 100, 0.08, 0.94);
    draw();
    syncInput(true);
  });

  input.addEventListener("change", () => {
    const next = parseColor(input.value);
    if (!next) {
      input.value = currentHex();
      return;
    }
    assign(oklch, next);
    input.value = currentHex();
    draw();
    syncLight();
    syncPigments();
    onChange?.(oklch);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") input.blur();
  });

  mountPigments();
  input.value = currentHex();
  syncLight();
  syncPigments();
  draw();
  window.addEventListener("resize", draw);

  return {
    setValue(value) {
      const next = parseColor(value);
      if (!next) return;
      assign(oklch, next);
      input.value = currentHex();
      syncLight();
      syncPigments();
      draw();
    },
  };
}
