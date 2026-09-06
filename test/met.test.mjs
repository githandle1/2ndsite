import test from "node:test";
import assert from "node:assert/strict";

import { toDatasetRecord } from "../lib/compositions/commons.mjs";
import {
  MET_OPEN_ACCESS_URL,
  metObjectUrl,
  metSearchUrl,
  normalizeMetObject,
  normalizeMetObjects,
} from "../lib/compositions/met.mjs";

const retrievedAt = "2026-09-06T08:30:00.000Z";

function metObject(overrides = {}) {
  return {
    objectID: 123,
    isPublicDomain: true,
    primaryImage: "https://images.metmuseum.org/CRDImages/ep/original/example.jpg",
    primaryImageSmall: "https://images.metmuseum.org/CRDImages/ep/web-large/example.jpg",
    objectURL: "https://www.metmuseum.org/art/collection/search/123",
    title: "Evening Interior",
    artistDisplayName: "Example Painter",
    objectName: "Painting",
    classification: "Paintings",
    medium: "Oil on canvas",
    objectDate: "1888",
    culture: "American",
    department: "American Paintings and Sculpture",
    accessionNumber: "12.34",
    creditLine: "Gift of an Example Donor, 1912",
    repository: "Metropolitan Museum of Art, New York, NY",
    tags: [{ term: "Interiors" }, { term: "Evening" }],
    ...overrides,
  };
}

test("Met search requests only public-domain records with images", () => {
  const url = new URL(metSearchUrl("flowers & dusk"));
  assert.equal(url.searchParams.get("q"), "flowers & dusk");
  assert.equal(url.searchParams.get("hasImages"), "true");
  assert.equal(url.searchParams.get("isPublicDomain"), "true");
  assert.equal(metObjectUrl(123), `${url.origin}/public/collection/v1/objects/123`);
});

test("Met normalization rejects restricted or unusable object records", () => {
  assert.equal(normalizeMetObject(metObject({ isPublicDomain: false })), null);
  assert.equal(normalizeMetObject(metObject({ primaryImage: "" })), null);
  assert.equal(normalizeMetObject(metObject({ objectID: null })), null);
  assert.equal(
    normalizeMetObjects([
      metObject(),
      metObject({ objectID: 124, isPublicDomain: false }),
      metObject({ objectID: 125, primaryImage: "" }),
    ]).length,
    1,
  );
});

test("Met records use the shared item shape and preserve Open Access provenance", () => {
  const item = normalizeMetObject(metObject(), retrievedAt);
  assert.equal(item.id, "met:123");
  assert.equal(item.source, "met open access");
  assert.equal(item.license, "public domain");
  assert.equal(item.licenseUrl, MET_OPEN_ACCESS_URL);
  assert.equal(item.retrievedAt, retrievedAt);
  assert.deepEqual(item.provenance, {
    source: "The Metropolitan Museum of Art Open Access",
    objectId: 123,
    accessionNumber: "12.34",
    repository: "Metropolitan Museum of Art, New York, NY",
    department: "American Paintings and Sculpture",
    classification: "Paintings",
    objectName: "Painting",
    objectDate: "1888",
    culture: "American",
    medium: "Oil on canvas",
    creditLine: "Gift of an Example Donor, 1912",
    tags: ["Interiors", "Evening"],
  });
  assert.match(item.caption, /Paintings/);
  assert.match(item.caption, /Interiors, Evening/);

  const record = toDatasetRecord(item);
  assert.equal(record.source, "met open access");
  assert.equal(record.license_note, "The Met Open Access API marks this object as public domain.");
  assert.equal(record.provenance.accessionNumber, "12.34");
  assert.equal(record.source_url, item.sourceUrl);
  assert.equal(record.image_url, item.imageUrl);
});
