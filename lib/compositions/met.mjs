const MET_API = "https://collectionapi.metmuseum.org/public/collection/v1";
export const MET_OPEN_ACCESS_URL =
  "https://www.metmuseum.org/about-the-met/policies-and-documents/open-access";

function text(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

export function metSearchUrl(search) {
  const params = new URLSearchParams({
    q: search.trim(),
    hasImages: "true",
    isPublicDomain: "true",
  });
  return `${MET_API}/search?${params}`;
}

export function metObjectUrl(objectId) {
  return `${MET_API}/objects/${encodeURIComponent(objectId)}`;
}

export function normalizeMetObject(object, retrievedDate = new Date().toISOString()) {
  const imageUrl = text(object?.primaryImage);
  const thumbnailUrl = text(object?.primaryImageSmall) || imageUrl;
  if (!object?.objectID || object.isPublicDomain !== true || !imageUrl) return null;

  const title = text(object.title) || `Met object ${object.objectID}`;
  const artist = text(object.artistDisplayName) || text(object.culture) || "unknown";
  const credit = text(object.creditLine) || text(object.department) || "The Metropolitan Museum of Art";
  const tags = (object.tags || []).map((tag) => text(tag?.term)).filter(Boolean);
  const details = [
    text(object.objectName),
    text(object.classification),
    text(object.department),
    text(object.medium),
    text(object.objectDate),
    text(object.culture),
    tags.join(", "),
  ].filter(Boolean);

  return {
    id: `met:${object.objectID}`,
    source: "met open access",
    sourceUrl:
      text(object.objectURL) ||
      `https://www.metmuseum.org/art/collection/search/${object.objectID}`,
    title,
    artist,
    credit,
    license: "public domain",
    licenseUrl: MET_OPEN_ACCESS_URL,
    licenseNote: "The Met Open Access API marks this object as public domain.",
    imageUrl,
    thumbnailUrl,
    width: null,
    height: null,
    category: text(object.classification) || text(object.objectName) || text(object.department),
    caption: [title, artist !== "unknown" ? `by ${artist}` : "", ...details]
      .filter(Boolean)
      .join(". "),
    retrievedAt: retrievedDate,
    provenance: {
      source: "The Metropolitan Museum of Art Open Access",
      objectId: object.objectID,
      accessionNumber: text(object.accessionNumber) || null,
      repository: text(object.repository) || "Metropolitan Museum of Art, New York, NY",
      department: text(object.department) || null,
      classification: text(object.classification) || null,
      objectName: text(object.objectName) || null,
      objectDate: text(object.objectDate) || null,
      culture: text(object.culture) || null,
      medium: text(object.medium) || null,
      creditLine: text(object.creditLine) || null,
      tags,
    },
  };
}

export function normalizeMetObjects(objects, retrievedDate) {
  return objects.map((object) => normalizeMetObject(object, retrievedDate)).filter(Boolean);
}
