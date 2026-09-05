import { CELLS, averageHex, blobToDataUrl, planFromPixels, rasterContain, splitSubjectFromImageData } from "./photo-wash-plan.js?v=2";

async function sourceFrom(payload) {
  if (payload.bitmap) return payload.bitmap;
  if (payload.file) return createImageBitmap(payload.file);
  if (payload.photo) {
    const res = await fetch(payload.photo);
    return createImageBitmap(await res.blob());
  }
  throw new Error("no image to work with");
}

async function rasterize(payload) {
  const bitmap = await sourceFrom(payload);
  const max = 1400;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = new OffscreenCanvas(width, height);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, width, height);
  const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.86 });
  const hex = averageHex(bitmap);
  bitmap.close?.();
  return { dataUrl: await blobToDataUrl(blob), hex };
}

async function planWash(payload) {
  const bitmap = await sourceFrom(payload);
  const data = rasterContain(bitmap, CELLS);
  const marks = planFromPixels(data, CELLS, payload.size || 720, payload.seed, payload.effects);
  bitmap.close?.();
  return { marks, brushName: payload.effects?.brushType || "HB" };
}

async function encodePng(payload) {
  const bitmap = await sourceFrom(payload);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  canvas.getContext("2d").drawImage(bitmap, 0, 0);
  const blob = await canvas.convertToBlob({ type: "image/png" });
  bitmap.close?.();
  return { dataUrl: await blobToDataUrl(blob) };
}

async function canvasUrl(pixels, width, height) {
  const canvas = new OffscreenCanvas(width, height);
  canvas.getContext("2d").putImageData(new ImageData(pixels, width, height), 0, 0);
  return blobToDataUrl(await canvas.convertToBlob({ type: "image/png" }));
}

async function splitSubject(payload) {
  const bitmap = await sourceFrom(payload);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0);
  const split = splitSubjectFromImageData(ctx.getImageData(0, 0, bitmap.width, bitmap.height));
  bitmap.close?.();
  const [baseUrl, liftUrl] = await Promise.all([
    canvasUrl(split.base, split.width, split.height),
    canvasUrl(split.lift, split.width, split.height),
  ]);
  return { baseUrl, liftUrl, hits: split.hits, hitsSize: split.hitsSize };
}

const jobs = { rasterize, planWash, encodePng, splitSubject };

self.onmessage = async (event) => {
  const { id, type } = event.data || {};
  const job = jobs[type];
  if (!job) {
    self.postMessage({ id, ok: false, error: "unknown image job" });
    return;
  }
  try {
    const result = await job(event.data);
    self.postMessage({ id, ok: true, result });
  } catch (err) {
    self.postMessage({ id, ok: false, error: String(err.message || err) });
  }
};
