import {
  commonsSearchUrl,
  normalizeCommonsResponse,
  toDatasetRecord,
} from "../lib/compositions/commons.mjs";

const STORAGE_KEY = "compositions.library.kept.v1";
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
let results = [];
let requestController = null;
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

async function searchCommons({ append = false } = {}) {
  const search = queryInput.value.trim();
  if (!search) {
    queryInput.focus();
    setStatus("add something to search for.");
    return;
  }

  requestController?.abort();
  requestController = new AbortController();
  const offset = append ? continuation : null;
  currentQuery = search;
  moreButton.disabled = true;
  setStatus(append ? "opening another shelf…" : "looking through commons…", true);
  if (!append) {
    gridEl.setAttribute("aria-busy", "true");
    resultCountEl.textContent = "";
  }

  try {
    const response = await fetchCommons(search, offset, requestController.signal);
    if (!append) {
      results = [];
      skipped.clear();
    }
    const known = new Set(results.map((item) => item.id));
    results.push(...response.items.filter((item) => !known.has(item.id)));
    continuation = response.continue;
    renderResults();
    setStatus(
      results.length
        ? `${results.length} open ${results.length === 1 ? "file" : "files"} found.`
        : "no public-domain files found. try another phrase.",
    );
  } catch (error) {
    if (error.name !== "AbortError") {
      setStatus("commons is quiet right now. try again in a moment.");
    }
  } finally {
    gridEl.removeAttribute("aria-busy");
    moreButton.disabled = false;
  }
}

function renderResults() {
  gridEl.replaceChildren();
  const visible = results.filter((item) => !skipped.has(item.id));
  for (const item of visible) gridEl.append(createCandidateCard(item));
  resultCountEl.textContent = results.length ? `${visible.length} showing` : "";
  moreButton.hidden = continuation === null;
}

function createCandidateCard(item) {
  const card = element("article", "library-card");
  card.dataset.id = item.id;

  const frame = element("div", "frame library-frame");
  const image = document.createElement("img");
  image.src = item.thumbnailUrl;
  image.alt = item.title;
  image.loading = "lazy";
  image.decoding = "async";

  const license = element("a", "library-license", item.license);
  license.href = item.licenseUrl;
  license.target = "_blank";
  license.rel = "noopener noreferrer";
  license.setAttribute("aria-label", `${item.license} license`);
  frame.append(image, license);

  const copy = element("div", "library-card-copy");
  const title = element("a", "library-card-title", item.title);
  title.href = item.sourceUrl;
  title.target = "_blank";
  title.rel = "noopener noreferrer";
  const artist = element("p", "library-card-artist", item.artist);
  copy.append(title, artist);

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
    card.remove();
    resultCountEl.textContent = `${results.length - skipped.size} showing`;
  });
  actions.append(keepButton, skipButton);
  card.append(frame, copy, actions);
  return card;
}

function toggleKept(item) {
  if (kept.has(item.id)) kept.delete(item.id);
  else kept.set(item.id, { ...item, retrievedAt: new Date().toISOString() });
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

    const label = element("label", "library-caption-label", "caption");
    const caption = document.createElement("textarea");
    caption.rows = 2;
    caption.value = item.caption;
    caption.setAttribute("aria-label", `caption for ${item.title}`);
    caption.addEventListener("change", () => {
      item.caption = caption.value.trim();
      saveKept();
    });
    label.append(caption);
    body.append(title, label);

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
  searchCommons();
});

moreButton.addEventListener("click", () => searchCommons({ append: true }));
exportButton.addEventListener("click", downloadKept);

for (const button of document.querySelectorAll("[data-license]")) {
  button.addEventListener("click", () => {
    licenseFilter = button.dataset.license;
    for (const peer of document.querySelectorAll("[data-license]")) {
      peer.classList.toggle("active", peer === button);
    }
    queryInput.value = currentQuery || queryInput.value;
    searchCommons();
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

renderKept();
searchCommons();
