import {
  commonsSearchUrl,
  normalizeCommonsResponse,
  toDatasetRecord,
} from "../lib/compositions/commons.mjs";
import {
  cosineSimilarity,
  expandVisualQuery,
  rankSeedRecords,
  SEMANTIC_MODEL,
  SEMANTIC_MODEL_DTYPE,
  semanticText,
} from "../lib/compositions/semantic-search.mjs";

const STORAGE_KEY = "compositions.library.kept.v2";
const MODEL_MODULE =
  "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0/dist/transformers.web.min.mjs";
const searchForm = document.querySelector("#librarySearch");
const queryInput = document.querySelector("#libraryQuery");
const statusEl = document.querySelector("#libraryStatus");
const gridEl = document.querySelector("#libraryGrid");
const resultCountEl = document.querySelector("#resultCount");
const moreButton = document.querySelector("#libraryMore");
const keptListEl = document.querySelector("#keptList");
const keptEmptyEl = document.querySelector("#keptEmpty");
const keptCountEl = document.querySelector("#keptCount");
const exportButton = document.querySelector("#exportKept");

let licenseFilter = "public-domain";
let exportFormat = "json";
let continuation = null;
let currentQuery = "";
let commonsResults = [];
let seedRecords = [];
let semanticIndex = {};
let semanticPipelinePromise = null;
let requestController = null;
let searchSequence = 0;
const candidateVectors = new Map();
const skipped = new Set();
const kept = loadKept();

function loadKept() {
  try {
    const records = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return new Map(records.map((item) => [item.id, item]));
  } catch {
    return new Map();
  }
}

function saveKept() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...kept.values()]));
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function setStatus(message, busy = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("is-busy", busy);
}

function parseJsonl(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function seedToItem(record) {
  return {
    id: record.id,
    source: "wikimedia commons",
    sourceUrl: record.source_url,
    imageUrl: record.image_url,
    thumbnailUrl: record.thumbnail_url || record.image_url,
    title: record.title,
    artist: record.credit,
    credit: record.credit,
    license: record.license,
    licenseUrl: record.license_url,
    retrievedAt: record.retrieved_at,
    ocrText: record.ocr_text,
    ocrStatus: record.ocr_status,
    caption: record.caption_long,
    captionLong: record.caption_long,
    captionShort: record.caption_short,
    width: record.width,
    height: record.height,
    category: record.category,
    semanticScore: record.semanticScore,
    isSeed: true,
  };
}

async function loadSeed() {
  try {
    const [recordsResponse, indexResponse] = await Promise.all([
      fetch("data/seed/commons-seed.jsonl"),
      fetch("data/seed/semantic-index.json"),
    ]);
    if (!recordsResponse.ok || !indexResponse.ok) throw new Error("seed unavailable");
    seedRecords = parseJsonl(await recordsResponse.text());
    semanticIndex = (await indexResponse.json()).vectors || {};
  } catch {
    seedRecords = [];
    semanticIndex = {};
  }
}

async function semanticPipeline() {
  if (!semanticPipelinePromise) {
    semanticPipelinePromise = import(MODEL_MODULE)
      .then(({ pipeline }) =>
        pipeline("feature-extraction", SEMANTIC_MODEL, { dtype: SEMANTIC_MODEL_DTYPE }),
      )
      .catch((error) => {
        semanticPipelinePromise = null;
        throw error;
      });
  }
  return semanticPipelinePromise;
}

async function embedTexts(texts) {
  const embed = await semanticPipeline();
  const result = await embed(texts, { pooling: "mean", normalize: true });
  const dimensions = result.dims.at(-1);
  return texts.map((_, index) =>
    Array.from(result.data.slice(index * dimensions, (index + 1) * dimensions)),
  );
}

async function fetchCommons(search, offset, signal) {
  const params = new URLSearchParams({ q: search, license: licenseFilter });
  if (offset) params.set("continue", offset);

  try {
    const response = await fetch(`/api/commons?${params}`, { signal });
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || !contentType.includes("application/json")) {
      throw new Error("proxy unavailable");
    }
    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") throw error;
    const response = await fetch(commonsSearchUrl(search, offset), { signal });
    if (!response.ok) throw new Error(`commons returned ${response.status}`);
    return normalizeCommonsResponse(await response.json(), licenseFilter);
  }
}

function rankedSeed(query, queryEmbedding = null) {
  return rankSeedRecords(
    query,
    seedRecords.filter((record) => licenseFilter !== "cc0" || record.license === "cc0"),
    semanticIndex,
    queryEmbedding,
  )
    .filter((record) => record.semanticScore > 0.08)
    .slice(0, 12)
    .map(seedToItem);
}

function currentVisibleResults(query, queryEmbedding = null) {
  const seed = rankedSeed(query, queryEmbedding);
  const known = new Set(seed.map((item) => item.id));
  return [...seed, ...commonsResults.filter((item) => !known.has(item.id))].filter(
    (item) => !skipped.has(item.id),
  );
}

async function rerankWithModel(query, sequence) {
  try {
    const [queryEmbedding] = await embedTexts([query]);
    if (sequence !== searchSequence) return;

    const missing = commonsResults.filter((item) => !candidateVectors.has(item.id));
    if (missing.length) {
      const vectors = await embedTexts(missing.map((item) => semanticText(toDatasetRecord(item))));
      missing.forEach((item, index) => candidateVectors.set(item.id, vectors[index]));
    }
    if (sequence !== searchSequence) return;

    commonsResults = commonsResults
      .map((item) => ({
        ...item,
        semanticScore: cosineSimilarity(queryEmbedding, candidateVectors.get(item.id)),
      }))
      .sort((left, right) => right.semanticScore - left.semanticScore);
    renderResults(query, queryEmbedding, true);
    setStatus(
      `${rankedSeed(query, queryEmbedding).length} caption matches · ${commonsResults.length} expanded commons candidates.`,
    );
  } catch {
    if (sequence === searchSequence) {
      setStatus(
        `${rankedSeed(query).length} local caption matches · commons is expanded lexically. embedding model unavailable.`,
      );
    }
  }
}

async function searchLibrary({ append = false } = {}) {
  const search = queryInput.value.trim();
  if (!search) {
    queryInput.focus();
    setStatus("add something to search for.");
    return;
  }

  requestController?.abort();
  requestController = new AbortController();
  const offset = append ? continuation : null;
  const sequence = append ? searchSequence : ++searchSequence;
  currentQuery = search;
  moreButton.disabled = true;
  if (!append) {
    commonsResults = [];
    skipped.clear();
    gridEl.setAttribute("aria-busy", "true");
    renderResults(search);
  }
  setStatus(append ? "opening another commons shelf…" : "ranking captions by meaning…", true);

  try {
    const expanded = expandVisualQuery(search);
    const response = await fetchCommons(expanded, offset, requestController.signal);
    if (sequence !== searchSequence) return;
    const known = new Set(commonsResults.map((item) => item.id));
    commonsResults.push(...response.items.filter((item) => !known.has(item.id)));
    continuation = response.continue;
    renderResults(search);
    setStatus(
      `${rankedSeed(search).length} caption matches · ${commonsResults.length} expanded commons candidates. refining…`,
      true,
    );
    rerankWithModel(search, sequence);
  } catch (error) {
    if (error.name !== "AbortError") {
      renderResults(search);
      setStatus(`${rankedSeed(search).length} local caption matches · commons is quiet right now.`);
      rerankWithModel(search, sequence);
    }
  } finally {
    gridEl.removeAttribute("aria-busy");
    moreButton.disabled = false;
  }
}

function renderResults(query = currentQuery, queryEmbedding = null, modelRanked = false) {
  gridEl.replaceChildren();
  const visible = currentVisibleResults(query, queryEmbedding);
  for (const item of visible) gridEl.append(createCandidateCard(item, modelRanked));
  const seedCount = visible.filter((item) => item.isSeed).length;
  resultCountEl.textContent = visible.length
    ? `${seedCount} meaning ${seedCount === 1 ? "match" : "matches"} · ${visible.length} showing`
    : "";
  moreButton.hidden = continuation === null;
}

function createCandidateCard(item, modelRanked = false) {
  const card = element("article", `library-card${item.isSeed ? " is-semantic" : ""}`);
  card.dataset.id = item.id;

  const frame = element("div", "frame library-frame");
  const image = document.createElement("img");
  image.src = item.thumbnailUrl;
  image.alt = item.captionShort || item.title;
  image.loading = "lazy";
  image.decoding = "async";

  const license = element("a", "library-license", item.license);
  license.href = item.licenseUrl;
  license.target = "_blank";
  license.rel = "noopener noreferrer";
  license.setAttribute("aria-label", `${item.license} license`);
  frame.append(image, license);

  const copy = element("div", "library-card-copy");
  const sourceLine = element(
    "span",
    "library-match",
    item.isSeed
      ? `${modelRanked ? "semantic" : "caption"} match · ${Math.round(item.semanticScore * 100)}%`
      : item.semanticScore
        ? `commons rerank · ${Math.round(item.semanticScore * 100)}%`
        : "expanded commons",
  );
  const title = element("a", "library-card-title", item.title);
  title.href = item.sourceUrl;
  title.target = "_blank";
  title.rel = "noopener noreferrer";
  const caption = element("p", "library-card-caption", item.captionShort || item.caption);
  const artist = element("p", "library-card-artist", item.artist);
  copy.append(sourceLine, title, caption, artist);

  const actions = element("div", "library-card-actions");
  const keepButton = element("button", "library-action library-keep");
  keepButton.type = "button";
  keepButton.textContent = kept.has(item.id) ? "kept" : "keep";
  keepButton.classList.toggle("is-kept", kept.has(item.id));
  keepButton.setAttribute("aria-pressed", kept.has(item.id) ? "true" : "false");
  keepButton.addEventListener("click", () => toggleKept(item));

  const skipButton = element("button", "library-action", "skip");
  skipButton.type = "button";
  skipButton.addEventListener("click", () => {
    skipped.add(item.id);
    renderResults();
  });
  actions.append(keepButton, skipButton);
  card.append(frame, copy, actions);
  return card;
}

function toggleKept(item) {
  if (kept.has(item.id)) kept.delete(item.id);
  else kept.set(item.id, { ...item, retrievedAt: item.retrievedAt || new Date().toISOString() });
  saveKept();
  renderKept();
  renderResults();
}

function renderKept() {
  keptListEl.replaceChildren();
  const records = [...kept.values()];
  keptCountEl.textContent = String(records.length);
  keptEmptyEl.hidden = records.length > 0;
  exportButton.disabled = records.length === 0;

  for (const item of records) {
    const row = element("article", "library-kept-item");
    const image = document.createElement("img");
    image.src = item.thumbnailUrl;
    image.alt = "";
    image.loading = "lazy";

    const body = element("div", "library-kept-body");
    const title = element("a", "library-kept-title", item.title);
    title.href = item.sourceUrl;
    title.target = "_blank";
    title.rel = "noopener noreferrer";

    const longLabel = element("label", "library-caption-label", "detailed caption");
    const longCaption = document.createElement("textarea");
    longCaption.rows = 4;
    longCaption.value = item.captionLong || item.caption || "";
    longCaption.setAttribute("aria-label", `detailed caption for ${item.title}`);
    longCaption.addEventListener("change", () => {
      item.captionLong = longCaption.value.trim();
      item.caption = item.captionLong;
      saveKept();
    });
    longLabel.append(longCaption);

    const shortLabel = element("label", "library-caption-label", "short caption");
    const shortCaption = document.createElement("textarea");
    shortCaption.rows = 2;
    shortCaption.value = item.captionShort || item.title;
    shortCaption.setAttribute("aria-label", `short caption for ${item.title}`);
    shortCaption.addEventListener("change", () => {
      item.captionShort = shortCaption.value.trim();
      saveKept();
    });
    shortLabel.append(shortCaption);
    body.append(title, longLabel, shortLabel);

    const remove = element("button", "library-remove", "×");
    remove.type = "button";
    remove.setAttribute("aria-label", `remove ${item.title}`);
    remove.addEventListener("click", () => {
      kept.delete(item.id);
      saveKept();
      renderKept();
      renderResults();
    });
    row.append(image, body, remove);
    keptListEl.append(row);
  }
}

function downloadKept() {
  const records = [...kept.values()].map(toDatasetRecord);
  const content =
    exportFormat === "jsonl"
      ? `${records.map((record) => JSON.stringify(record)).join("\n")}\n`
      : `${JSON.stringify(records, null, 2)}\n`;
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `compositions-library.${exportFormat}`;
  link.click();
  URL.revokeObjectURL(url);
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  searchLibrary();
});

moreButton.addEventListener("click", () => searchLibrary({ append: true }));
exportButton.addEventListener("click", downloadKept);

for (const button of document.querySelectorAll("[data-license]")) {
  button.addEventListener("click", () => {
    licenseFilter = button.dataset.license;
    for (const peer of document.querySelectorAll("[data-license]")) {
      peer.classList.toggle("active", peer === button);
    }
    queryInput.value = currentQuery || queryInput.value;
    searchLibrary();
  });
}

for (const button of document.querySelectorAll("[data-format]")) {
  button.addEventListener("click", () => {
    exportFormat = button.dataset.format;
    for (const peer of document.querySelectorAll("[data-format]")) {
      peer.classList.toggle("active", peer === button);
    }
  });
}

await loadSeed();
renderKept();
searchLibrary();
