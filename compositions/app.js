import { EFFECT_GROUPS, BRUSH_TYPES, BRUSH_SLIDERS, PLACEMENT_SLIDERS, DEFAULT_COLOR, clampEffects, defaultEffects } from "./effect-model.js?v=14";
import { parseColor, oklchToHex } from "./color.js";
import { mountColorDial } from "./color-dial.js?v=7";

const sceneEl = document.querySelector("#scene");
const countEl = document.querySelector("#count");
const paintEl = document.querySelector("#paint");
const statusEl = document.querySelector("#status");
const wallEl = document.querySelector("#wall");
const emptyEl = document.querySelector("#empty");
const samplesEl = document.querySelector("#samples");
const codePanel = document.querySelector(".code-panel");
const codeEl = document.querySelector("#code");
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

function mountPlacementPanel() {
  placementControlsEl.innerHTML = "";
  for (const key of PLACEMENT_SLIDERS) {
    placementControlsEl.append(makeSlider(key.id, key.label, effects[key.id]));
  }
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

  document.querySelector("#resetEffects").addEventListener("click", resetEffects);
  document.querySelector("#resetBrush").addEventListener("click", resetBrush);
  document.querySelector("#resetPlacement").addEventListener("click", resetPlacement);

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
  if (![...cards.values()].some((rec) => rec.item.code)) return;
  effectsDirty = true;
  clearTimeout(effectTimer);
  effectTimer = setTimeout(flushEffects, 280);
}

function flushEffects() {
  if (!effectsDirty) return;
  if (paintingNow) return;
  const ids = [];
  for (const [id, rec] of cards) {
    if (rec?.item.code) ids.push(id);
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

function setStatus(text) {
  statusEl.textContent = text || "";
}

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
  for (const sample of samples) {
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
      generate({ sampleId: sample.id, scene: sample.prompt });
    });
    samplesEl.append(button);
  }
}

function clearWall() {
  paintQueue.length = 0;
  paintingNow = false;
  waitingId = null;
  cards.clear();
  wallEl.innerHTML = "";
}

function renderGrid(items) {
  emptyEl?.remove();
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
        <div class="veil">pigment settling…</div>
      </div>
      <div class="caption">
        <span>${item.source === "sample" ? "sample" : "sketch"} ${index + 1}</span>
        <span class="caption-meta">
          <span>seed ${item.seed}</span>
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
      if (event.target.closest(".save")) return;
      selectPainting(item.id);
    });
    sheet.addEventListener("keydown", (event) => {
      if (event.target.closest(".save")) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectPainting(item.id);
      }
    });
    sheet.querySelector(".save").addEventListener("click", (event) => {
      event.stopPropagation();
      downloadPainting(item.id);
    });
    grid.append(sheet);
    cards.set(item.id, { item, sheet, dataUrl: null });

    if (item.error || !item.code) {
      const veil = sheet.querySelector(".veil");
      veil.classList.add("error");
      veil.textContent = item.error || "no sketch returned";
      return;
    }
    paintQueue.push(item.id);
  });

  const first = items.find((item) => item.code);
  if (first) selectPainting(first.id);
  drainQueue();
}

function drainQueue() {
  if (paintingNow || !rendererReady) return;
  const id = paintQueue.shift();
  if (!id) {
    const ready = [...cards.values()].filter((rec) => rec.dataUrl).length;
    if (ready) setStatus(`${ready} sketches ready. click one to edit the code.`);
    flushEffects();
    return;
  }
  const rec = cards.get(id);
  if (!rec?.item.code) {
    drainQueue();
    return;
  }
  paintingNow = true;
  waitingId = id;
  renderer.contentWindow.postMessage(
    {
      type: "paint",
      code: rec.item.code,
      seed: rec.item.seed,
      size: 720,
      density: 1,
      effects: readEffects(),
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
  const painting = paintings.find((item) => item.id === id);
  for (const sheet of wallEl.querySelectorAll(".sheet")) {
    sheet.classList.toggle("active", sheet.dataset.id === id);
  }
  if (!painting?.code) {
    codePanel.hidden = true;
    return;
  }
  codePanel.hidden = false;
  codeEl.value = painting.code;
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

paintEl.addEventListener("click", () => generate());

rerenderEl.addEventListener("click", () => {
  const rec = cards.get(selectedId);
  if (!rec) return;
  rec.item.code = codeEl.value;
  const painting = paintings.find((item) => item.id === selectedId);
  if (painting) painting.code = codeEl.value;
  queuePaint(selectedId, { replace: true });
});

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

downloadEl.addEventListener("click", () => downloadPainting(selectedId));

renderer.addEventListener("load", () => {
  rendererReady = true;
  drainQueue();
});

if (renderer.contentDocument?.readyState === "complete") {
  rendererReady = true;
}

loadSamples().catch((err) => setStatus(err.message));
mountEffects();
sizeScene();
