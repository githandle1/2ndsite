import { EFFECT_GROUPS, BRUSH_TYPES, BRUSH_SLIDERS, PLACEMENT_SLIDERS, DEFAULT_COLOR, clampEffects, defaultEffects } from "./effect-model.js?v=14";
import { parseColor, oklchToHex } from "./color.js";
import { mountColorDial } from "./color-dial.js?v=7";
const sceneEl = document.querySelector("#scene");
const sceneRow = document.querySelector(".scene-row");
const sceneCaption = document.querySelector("#sceneCaption");
const sceneCaptionImg = document.querySelector("#sceneCaptionImg");
const sceneCaptionText = document.querySelector("#sceneCaptionText");
const countEl = document.querySelector("#count");
const paintEl = document.querySelector("#paint");
const wallEl = document.querySelector("#wall");
const samplesEl = document.querySelector("#samples");
const photoEl = document.querySelector("#photo");
const photoChip = document.querySelector("#photoChip");
const paintKit = document.querySelector("#paintKit");
const rerenderEl = document.querySelector("#rerender");
const downloadEl = document.querySelector("#download");
const providerEl = document.querySelector("#provider");
const apiKeyEl = document.querySelector("#apiKey");
const renderer = document.querySelector("#renderer");
const effectGroupsEl = document.querySelector("#effectGroups");
const pigmentColorEl = document.querySelector("#pigmentColor");
const brushEl = document.querySelector("#brush");
const brushControlsEl = document.querySelector("#brushControls");
const placementEl = document.querySelector("#placement");
const placementControlsEl = document.querySelector("#placementControls");

const stored = JSON.parse(localStorage.getItem("wash.settings") || "{}");
if (stored.provider) providerEl.value = stored.provider;
if (stored.apiKey) apiKeyEl.value = stored.apiKey;

let samples = [];
let paintings = [];
let selectedId = null;
const cards = new Map();
const paintQueue = [];
let paintingNow = false;
let rendererReady = false;
let waitingId = null;
let effects = clampEffects(stored.effects || {});
let effectTimer = null;
let effectsDirty = false;
let currentPhoto = null;
let paintWatch = 0;

window.addEventListener("message", onFrameMessage);

providerEl.addEventListener("change", () => {
  persistSettings();
  apiKeyEl.placeholder = providerEl.value === "grok" ? "xai-…" : "sk-…";
});
apiKeyEl.addEventListener("change", persistSettings);
apiKeyEl.placeholder = providerEl.value === "grok" ? "xai-…" : "sk-…";

function sizeScene() {
  sceneEl.style.height = "0px";
  const next = Math.min(sceneEl.scrollHeight, 160);
  sceneEl.style.height = `${Math.max(next, 44)}px`;
}

sceneEl.addEventListener("input", sizeScene);

function setPhotoLabel(name) {
  const label = name ? name : "upload photo";
  photoChip.setAttribute("aria-label", label);
  photoChip.title = label;
  photoChip.classList.toggle("active", Boolean(name));
}

function captionFromName(name) {
  return String(name || "")
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase() || "photograph";
}

function showSceneCaption(dataUrl, name) {
  const caption = captionFromName(name);
  sceneEl.value = caption;
  if (sceneCaptionImg) sceneCaptionImg.src = dataUrl || "";
  if (sceneCaptionText) sceneCaptionText.textContent = caption;
  if (sceneCaption) sceneCaption.hidden = false;
  sceneRow?.classList.add("has-photo");
  sizeScene();
}

function hideSceneCaption() {
  if (sceneCaption) sceneCaption.hidden = true;
  if (sceneCaptionImg) sceneCaptionImg.removeAttribute("src");
  if (sceneCaptionText) sceneCaptionText.textContent = "";
  sceneRow?.classList.remove("has-photo");
  sizeScene();
}

function clearPhoto() {
  currentPhoto = null;
  photoEl.value = "";
  setPhotoLabel("");
  hideSceneCaption();
}

function averageHex(img) {
  const canvas = document.createElement("canvas");
  canvas.width = 24;
  canvas.height = 24;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, 24, 24);
  const data = ctx.getImageData(0, 0, 24, 24).data;
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] + data[i + 1] + data[i + 2] > 700) continue;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    n += 1;
  }
  if (!n) return "#8b2f32";
  const hex = (v) => Math.round(v / n).toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

function rasterizePhoto(source) {
  const width = source.naturalWidth || source.width;
  const height = source.naturalHeight || source.height;
  if (!width || !height) throw new Error("that photograph would not open.");
  const max = 1400;
  const scale = Math.min(1, max / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  canvas.getContext("2d").drawImage(source, 0, 0, canvas.width, canvas.height);
  return {
    dataUrl: canvas.toDataURL("image/jpeg", 0.86),
    hex: averageHex(source),
  };
}

function loadImageUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("that photograph would not open."));
    img.src = url;
  });
}

async function readPhotoFile(file) {
  const name = file.name.replace(/\.[^.]+$/, "").toLowerCase() || "photograph";
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      const next = rasterizePhoto(bitmap);
      bitmap.close?.();
      return { ...next, name };
    } catch {
      /* fall through and try a blob url */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImageUrl(url);
    return { ...rasterizePhoto(img), name };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function onPhotoChosen() {
  const file = photoEl.files?.[0];
  if (!file) return;
  setStatus("opening the photograph…");
  try {
    const photo = await readPhotoFile(file);
    currentPhoto = photo.dataUrl;
    setPhotoLabel(photo.name);
    if (photo.hex) colorDial?.setValue(photo.hex);
    persistSettings();
    showSceneCaption(photo.dataUrl, photo.name);
    paintPhoto();
  } catch (err) {
    setStatus(err.message || "that photograph would not open.");
  }
}

function paintPhoto() {
  if (!currentPhoto) return;
  const n = Math.max(1, Math.min(6, Number(countEl.value) || 4));
  const base = Math.floor(Math.random() * 8000);
  paintings = Array.from({ length: n }, (_, i) => ({
    id: `photo-${base}-${i + 1}`,
    prompt: sceneEl.value.trim() || "photograph",
    seed: 11 + i * 97,
    photo: currentPhoto,
    code: "",
    source: "photo",
  }));
  paintEl.disabled = true;
  setStatus("washing the photograph…");
  renderGrid(paintings);
  paintEl.disabled = false;
}

photoEl.addEventListener("change", onPhotoChosen);

function bindReset(id, fn) {
  document.querySelector(id)?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    fn();
  });
}

function openPaintSections() {
  for (const id of ["brush", "placement", "effects", "sketch"]) {
    const pane = document.querySelector(`#${id}`);
    if (pane) pane.open = true;
  }
}

function fitPaintKit() {
  if (!paintKit || fitPaintKit.done) return;
  const mobile = window.matchMedia("(max-width: 720px)").matches;
  paintKit.open = false;
  openPaintSections();
  const samples = document.querySelector("#sampleKit");
  if (samples) samples.open = !mobile;
  paintKit.addEventListener("toggle", () => {
    if (paintKit.open) openPaintSections();
  });
  fitPaintKit.done = true;
}

function persistSettings() {
  effects = readEffects();
  localStorage.setItem(
    "wash.settings",
    JSON.stringify({
      provider: providerEl.value,
      apiKey: apiKeyEl.value,
      effects,
    })
  );
}

function readEffects() {
  const next = { color: parseColor(pigmentColorEl?.value) || effects.color || DEFAULT_COLOR };
  const typeEl = document.querySelector("#brushType");
  if (typeEl) next.brushType = typeEl.value;
  const ranges = [
    ...brushControlsEl.querySelectorAll("input[type=range]"),
    ...placementControlsEl.querySelectorAll("input[type=range]"),
    ...effectGroupsEl.querySelectorAll("input[type=range]"),
  ];
  for (const input of ranges) {
    next[input.dataset.effect] = Number(input.value) / 100;
  }
  return clampEffects(next);
}

let colorDial = null;

function makeSlider(id, label, value) {
  const row = document.createElement("label");
  row.className = "slide";
  const name = document.createElement("span");
  name.textContent = label;
  const input = document.createElement("input");
  input.type = "range";
  input.min = "0";
  input.max = "100";
  input.step = "1";
  input.dataset.effect = id;
  input.value = String(Math.round((value ?? 0.5) * 100));
  input.setAttribute("aria-label", label);
  row.append(name, input);
  return row;
}

function mountBrushPanel() {
  brushControlsEl.innerHTML = "";

  const typeRow = document.createElement("label");
  typeRow.className = "slide";
  const typeName = document.createElement("span");
  typeName.textContent = "type";
  const typeSelect = document.createElement("select");
  typeSelect.id = "brushType";
  typeSelect.setAttribute("aria-label", "brush type");
  for (const name of BRUSH_TYPES) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name.toLowerCase();
    typeSelect.append(option);
  }
  typeSelect.value = effects.brushType || "HB";
  typeRow.append(typeName, typeSelect);
  brushControlsEl.append(typeRow);

  for (const key of BRUSH_SLIDERS) {
    brushControlsEl.append(makeSlider(key.id, key.label, effects[key.id]));
  }
}

function hiddenRange(id, value) {
  const input = document.createElement("input");
  input.type = "range";
  input.min = "0";
  input.max = "100";
  input.step = "1";
  input.dataset.effect = id;
  input.value = String(Math.round((value ?? 0.5) * 100));
  input.className = "visually-hidden";
  input.setAttribute("aria-label", id === "placeX" ? "across" : "up");
  return input;
}

function mountStick(xInput, yInput) {
  const well = document.createElement("div");
  well.className = "stick";
  well.tabIndex = 0;
  well.setAttribute("role", "slider");
  well.setAttribute("aria-label", "placement stick");
  const thumb = document.createElement("div");
  thumb.className = "stick-thumb";
  well.append(thumb);

  const reach = 22;

  function syncThumb() {
    const x = Number(xInput.value) / 100;
    const y = Number(yInput.value) / 100;
    thumb.style.transform = `translate(${(x - 0.5) * 2 * reach}px, ${(0.5 - y) * 2 * reach}px)`;
  }

  function setFromPointer(clientX, clientY) {
    const box = well.getBoundingClientRect();
    const dx = clientX - (box.left + box.width / 2);
    const dy = clientY - (box.top + box.height / 2);
    const dist = Math.hypot(dx, dy) || 1;
    const clamped = Math.min(dist, reach);
    const nx = (dx / dist) * clamped;
    const ny = (dy / dist) * clamped;
    xInput.value = String(Math.round((0.5 + nx / reach / 2) * 100));
    yInput.value = String(Math.round((0.5 - ny / reach / 2) * 100));
    syncThumb();
    onEffectInput();
  }

  well.addEventListener("pointerdown", (event) => {
    well.classList.add("is-dragging");
    well.setPointerCapture(event.pointerId);
    setFromPointer(event.clientX, event.clientY);
  });
  well.addEventListener("pointermove", (event) => {
    if (!well.classList.contains("is-dragging")) return;
    setFromPointer(event.clientX, event.clientY);
  });
  const endDrag = () => well.classList.remove("is-dragging");
  well.addEventListener("pointerup", endDrag);
  well.addEventListener("pointercancel", endDrag);
  well.addEventListener("keydown", (event) => {
    const step = event.shiftKey ? 8 : 3;
    const move = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowDown: [0, -step], ArrowUp: [0, step] }[event.key];
    if (!move) return;
    event.preventDefault();
    xInput.value = String(Math.min(100, Math.max(0, Number(xInput.value) + move[0])));
    yInput.value = String(Math.min(100, Math.max(0, Number(yInput.value) + move[1])));
    syncThumb();
    onEffectInput();
  });

  xInput.addEventListener("input", syncThumb);
  yInput.addEventListener("input", syncThumb);
  syncThumb();
  well.syncThumb = syncThumb;
  return well;
}

function mountPlacementPanel() {
  placementControlsEl.innerHTML = "";
  const xInput = hiddenRange("placeX", effects.placeX);
  const yInput = hiddenRange("placeY", effects.placeY);
  const board = document.createElement("div");
  board.className = "place-board";
  const stick = mountStick(xInput, yInput);
  stick.id = "placeStick";
  board.append(stick, makeSlider("composition", "size", effects.composition));
  placementControlsEl.append(xInput, yInput, board);
}

function mountEffects() {
  effectGroupsEl.innerHTML = "";
  mountBrushPanel();
  mountPlacementPanel();
  EFFECT_GROUPS.forEach((group, index) => {
    const details = document.createElement("details");
    details.open = index < 1;
    const summary = document.createElement("summary");
    summary.textContent = group.label;
    details.append(summary);
    for (const key of group.keys) {
      details.append(makeSlider(key.id, key.label, effects[key.id]));
    }
    effectGroupsEl.append(details);
  });

  pigmentColorEl.value = oklchToHex(effects.color || DEFAULT_COLOR);
  colorDial = mountColorDial({
    canvas: document.querySelector("#colorDial"),
    input: pigmentColorEl,
    value: effects.color || DEFAULT_COLOR,
    onChange: onEffectInput,
  });

  bindReset("#resetEffects", resetEffects);
  bindReset("#resetBrush", resetBrush);
  bindReset("#resetPlacement", resetPlacement);

  const root = document.querySelector("#effects");
  root.addEventListener("input", onEffectInput);
  root.addEventListener("change", onEffectInput);
  brushEl.addEventListener("input", onEffectInput);
  brushEl.addEventListener("change", onEffectInput);
  placementEl.addEventListener("input", onEffectInput);
  placementEl.addEventListener("change", onEffectInput);
  persistSettings();
}

function resetBrush() {
  const baseline = defaultEffects();
  const typeEl = document.querySelector("#brushType");
  if (typeEl) typeEl.value = baseline.brushType;
  for (const input of brushControlsEl.querySelectorAll("input[type=range]")) {
    input.value = "50";
  }
  persistSettings();
  scheduleEffectRender();
}

function resetPlacement() {
  for (const input of placementControlsEl.querySelectorAll("input[type=range]")) {
    input.value = "50";
  }
  document.querySelector("#placeStick")?.syncThumb?.();
  persistSettings();
  scheduleEffectRender();
}

function resetEffects() {
  const baseline = defaultEffects();
  for (const input of effectGroupsEl.querySelectorAll("input[type=range]")) {
    input.value = "50";
  }
  colorDial?.setValue(baseline.color);
  persistSettings();
  scheduleEffectRender();
}

function onEffectInput() {
  persistSettings();
  scheduleEffectRender();
}

function scheduleEffectRender() {
  if (![...cards.values()].some((rec) => rec.item.code || rec.item.photo)) return;
  effectsDirty = true;
  clearTimeout(effectTimer);
  effectTimer = setTimeout(flushEffects, 280);
}

function flushEffects() {
  if (!effectsDirty) return;
  if (paintingNow) return;
  const ids = [];
  for (const [id, rec] of cards) {
    if (rec?.item.code || rec?.item.photo) ids.push(id);
  }
  if (!ids.length) {
    effectsDirty = false;
    return;
  }
  effectsDirty = false;
  for (const id of ids) queuePaint(id, { replace: true });
}

function queuePaint(id, { replace = false } = {}) {
  const rec = cards.get(id);
  if (!rec) return;
  rec.sheet.querySelector("img")?.remove();
  rec.sheet.querySelector(".save")?.setAttribute("disabled", "");
  rec.dataUrl = null;
  rec.item.dataUrl = null;
  let veil = rec.sheet.querySelector(".veil");
  if (!veil) {
    veil = document.createElement("div");
    veil.className = "veil";
    rec.sheet.querySelector(".frame").append(veil);
  }
  veil.textContent = replace ? "adjusting…" : "pigment settling…";
  if (!paintQueue.includes(id)) paintQueue.push(id);
  drainQueue();
}

function setStatus(_text) {}

function authHeaders() {
  const headers = { "content-type": "application/json" };
  const key = apiKeyEl.value.trim();
  if (key) {
    headers["x-api-key"] = key;
    headers["x-llm-provider"] = providerEl.value;
  }
  return headers;
}

async function loadSamples() {
  const res = await fetch("/api/samples");
  const data = await res.json();
  samples = data.samples || [];
  samplesEl.innerHTML = "";
  samples.forEach((sample, index) => {
    if (index === 2) {
      const br = document.createElement("span");
      br.className = "chips-break";
      br.setAttribute("aria-hidden", "true");
      samplesEl.append(br);
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.textContent = String(sample.title || "").toLowerCase();
    button.addEventListener("click", () => {
      sceneEl.value = sample.prompt;
      sizeScene();
      if (sample.color) {
        colorDial?.setValue(sample.color);
      }
      if (sample.brushType) {
        const typeEl = document.querySelector("#brushType");
        if (typeEl && BRUSH_TYPES.includes(sample.brushType)) typeEl.value = sample.brushType;
      }
      if (sample.color || sample.brushType) persistSettings();
      clearPhoto();
      generate({ sampleId: sample.id, scene: sample.prompt });
    });
    samplesEl.append(button);
  });
}

function clearWall() {
  paintQueue.length = 0;
  paintingNow = false;
  waitingId = null;
  cards.clear();
  wallEl.innerHTML = "";
}

function renderGrid(items) {
  clearWall();
  const grid = document.createElement("div");
  grid.className = "grid";
  wallEl.append(grid);

  items.forEach((item, index) => {
    const sheet = document.createElement("div");
    sheet.className = "sheet";
    sheet.dataset.id = item.id;
    sheet.tabIndex = 0;
    sheet.innerHTML = `
      <div class="frame">
        <button type="button" class="pick" data-id="${item.id}" aria-label="export training json" title="export for tinker" aria-pressed="false"${item.code ? "" : " disabled"}></button>
        <div class="veil">pigment settling…</div>
      </div>
      <div class="caption">
        <span>sample ${index + 1}</span>
        <span class="caption-meta">
          <button type="button" class="save" data-id="${item.id}" aria-label="save png" title="save" disabled>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M8 2.4v8.2" fill="none" stroke="currentColor" stroke-width="1.5" />
              <path d="M5.2 8.4 8 11.2 10.8 8.4" fill="none" stroke="currentColor" stroke-width="1.5" />
              <path d="M3.2 13.5h9.6" fill="none" stroke="currentColor" stroke-width="1.5" />
            </svg>
          </button>
        </span>
      </div>
    `;
    sheet.addEventListener("click", (event) => {
      if (event.target.closest(".save, .pick")) return;
      selectPainting(item.id);
    });
    sheet.addEventListener("keydown", (event) => {
      if (event.target.closest(".save, .pick")) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectPainting(item.id);
      }
    });
    sheet.querySelector(".save").addEventListener("click", (event) => {
      event.stopPropagation();
      downloadPainting(item.id);
    });
    sheet.querySelector(".pick").addEventListener("click", (event) => {
      event.stopPropagation();
      exportTraining(item.id);
    });
    grid.append(sheet);
    cards.set(item.id, { item, sheet, dataUrl: null });

    if (item.error || (!item.code && !item.photo)) {
      const veil = sheet.querySelector(".veil");
      veil.classList.add("error");
      veil.textContent = item.error || "no sketch returned";
      return;
    }
    paintQueue.push(item.id);
  });

  const first = items.find((item) => item.code || item.photo);
  if (first) selectPainting(first.id);
  drainQueue();
}

function drainQueue() {
  if (paintingNow || !rendererReady) return;
  const id = paintQueue.shift();
  if (!id) {
    const ready = [...cards.values()].filter((rec) => rec.dataUrl).length;
    if (ready) {
      const photo = [...cards.values()].some((rec) => rec.item.photo);
      setStatus(photo ? `${ready} washes ready.` : `${ready} sketches ready.`);
    }
    flushEffects();
    return;
  }
  const rec = cards.get(id);
  if (!rec?.item.code && !rec?.item.photo) {
    drainQueue();
    return;
  }
  paintingNow = true;
  waitingId = id;
  clearTimeout(paintWatch);
  paintWatch = setTimeout(() => {
    if (!paintingNow || waitingId !== id) return;
    paintingNow = false;
    waitingId = null;
    const stuck = cards.get(id);
    const veil = stuck?.sheet.querySelector(".veil");
    if (veil) {
      veil.classList.add("error");
      veil.textContent = "the wash never dried. try the photo again.";
    }
    setStatus("the wash never dried. try the photo again.");
    drainQueue();
  }, 20000);
  const frame = renderer.contentWindow;
  if (frame) frame.__pendingPhoto = rec.item.photo || null;
  const effects = readEffects();
  if (rec.item.source === "sample") effects.preservePaint = true;
  frame?.postMessage(
    {
      type: "paint",
      code: rec.item.code,
      photo: Boolean(rec.item.photo),
      seed: rec.item.seed,
      size: 800,
      density: 1,
      effects,
    },
    "*"
  );
}

function onFrameMessage(event) {
  if (event.source !== renderer.contentWindow || !event.data) return;
  if (event.data.type === "ready") {
    rendererReady = true;
    drainQueue();
    return;
  }
  if (event.data.type !== "painted") return;

  const rec = cards.get(waitingId);
  paintingNow = false;
  waitingId = null;
  clearTimeout(paintWatch);

  if (rec) {
    const veil = rec.sheet.querySelector(".veil");
    if (event.data.error) {
      veil?.classList.add("error");
      if (veil) veil.textContent = event.data.error;
    } else if (event.data.dataUrl) {
      rec.dataUrl = event.data.dataUrl;
      rec.item.dataUrl = event.data.dataUrl;
      const img = document.createElement("img");
      img.alt = rec.item.prompt || "watercolor";
      img.src = event.data.dataUrl;
      rec.sheet.querySelector(".frame").prepend(img);
      veil?.remove();
      rec.sheet.querySelector(".save")?.removeAttribute("disabled");
    } else if (veil) {
      veil.classList.add("error");
      veil.textContent = "the wash dried invisibly. try re-rendering.";
    }
  }

  drainQueue();
}

function selectPainting(id) {
  selectedId = id;
  for (const sheet of wallEl.querySelectorAll(".sheet")) {
    sheet.classList.toggle("active", sheet.dataset.id === id);
  }
}

async function generate({ scene, sampleId } = {}) {
  const prompt = (scene ?? sceneEl.value).trim();
  paintEl.disabled = true;
  setStatus(sampleId ? "loading sample washes…" : "the model is writing sketches…");

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        scene: prompt,
        count: Number(countEl.value),
        sampleId: sampleId || undefined,
        effects: readEffects(),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "generate failed");
    paintings = data.paintings || [];
    const failed = paintings.filter((item) => item.error).length;
    setStatus(
      failed
        ? `${paintings.length - failed} painted, ${failed} failed.`
        : "wetting the paper…"
    );
    renderGrid(paintings);
  } catch (err) {
    setStatus(err.message);
  } finally {
    paintEl.disabled = false;
  }
}

paintEl.addEventListener("click", () => {
  if (currentPhoto) {
    paintPhoto();
    return;
  }
  generate();
});

rerenderEl?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  if (!selectedId) return;
  queuePaint(selectedId, { replace: true });
});

function trainingExample(item) {
  return {
    messages: [
      { role: "system", content: item.system || "" },
      { role: "user", content: item.user || `Scene: ${item.prompt || ""}` },
      { role: "assistant", content: item.code || "" },
    ],
    metadata: {
      id: item.id,
      scene: item.prompt || "",
      seed: item.seed,
      variant: item.variant || "",
      source: item.source || "",
      effects: item.effects || readEffects(),
    },
  };
}

function exportTraining(id) {
  const rec = cards.get(id);
  if (!rec?.item?.code) {
    setStatus("nothing to train on yet.");
    return;
  }
  const slug = String(rec.item.prompt || "wash")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "wash";
  const blob = new Blob([`${JSON.stringify(trainingExample(rec.item), null, 2)}\n`], {
    type: "application/json",
  });
  downloadBlob(blob, `tinker-${slug}-${rec.item.seed}.json`);
  const pick = rec.sheet.querySelector(".pick");
  pick?.classList.add("picked");
  pick?.setAttribute("aria-pressed", "true");
  setStatus("saved training json.");
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadPainting(id) {
  const rec = cards.get(id);
  if (!rec) return;
  const dataUrl = rec.dataUrl || rec.item.dataUrl;
  if (!dataUrl) {
    setStatus("nothing to export yet.");
    return;
  }
  downloadBlob(await (await fetch(dataUrl)).blob(), `wash-${rec.item.seed}.png`);
  setStatus("saved png.");
}

downloadEl?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  downloadPainting(selectedId);
});

renderer.addEventListener("load", () => {
  rendererReady = true;
  drainQueue();
});

if (renderer.contentDocument?.readyState === "complete") {
  rendererReady = true;
}

const masthead = document.querySelector(".masthead");
masthead?.addEventListener("click", (event) => {
  if (event.target.closest("a")) return;
  masthead.classList.toggle("is-open");
});

loadSamples().catch((err) => setStatus(err.message));
mountEffects();
fitPaintKit();
sizeScene();
