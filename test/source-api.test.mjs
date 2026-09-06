import test from "node:test";
import assert from "node:assert/strict";

import commonsHandler from "../api/commons.mjs";
import metHandler from "../api/met.mjs";

function mockResponse() {
  return {
    payload: null,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

function commonsPayload(pageid, nextOffset) {
  return {
    query: {
      pages: [
        {
          pageid,
          title: `File:Open image ${pageid}.jpg`,
          fullurl: `https://commons.wikimedia.org/?curid=${pageid}`,
          imageinfo: [
            {
              url: `https://upload.wikimedia.org/${pageid}.jpg`,
              thumburl: `https://upload.wikimedia.org/thumb/${pageid}.jpg`,
              extmetadata: {
                LicenseShortName: { value: "Public domain" },
                UsageTerms: { value: "Public domain" },
              },
            },
          ],
        },
      ],
    },
    continue: nextOffset ? { gsroffset: nextOffset } : undefined,
  };
}

test("Commons proxy aggregates two 50-result searches per shelf page", async () => {
  const originalFetch = globalThis.fetch;
  const urls = [];
  globalThis.fetch = async (url) => {
    urls.push(new URL(url));
    const offset = Number(new URL(url).searchParams.get("gsroffset") || 0);
    return {
      ok: true,
      json: async () => commonsPayload(offset + 1, offset + 50),
    };
  };

  try {
    const response = mockResponse();
    await commonsHandler(
      { method: "GET", query: { q: "landscape", license: "public-domain" } },
      response,
    );
    assert.equal(response.statusCode, 200);
    assert.equal(urls.length, 2);
    assert.deepEqual(
      urls.map((url) => url.searchParams.get("gsrlimit")),
      ["50", "50"],
    );
    assert.deepEqual(
      urls.map((url) => Number(url.searchParams.get("gsroffset") || 0)),
      [0, 50],
    );
    assert.equal(response.payload.items.length, 2);
    assert.equal(response.payload.continue, 100);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Met proxy resolves 60 objects with bounded concurrency and pagination", async () => {
  const originalFetch = globalThis.fetch;
  let active = 0;
  let maximumActive = 0;
  let objectRequests = 0;
  globalThis.fetch = async (url) => {
    const parsed = new URL(url);
    if (parsed.pathname.endsWith("/search")) {
      return {
        ok: true,
        json: async () => ({ objectIDs: Array.from({ length: 75 }, (_, index) => index + 1) }),
      };
    }

    objectRequests += 1;
    active += 1;
    maximumActive = Math.max(maximumActive, active);
    const objectID = Number(parsed.pathname.split("/").at(-1));
    await new Promise((resolve) => setTimeout(resolve, 1));
    active -= 1;
    return {
      ok: true,
      json: async () => ({
        objectID,
        isPublicDomain: true,
        primaryImage: `https://images.metmuseum.org/${objectID}.jpg`,
        title: `Open object ${objectID}`,
      }),
    };
  };

  try {
    const response = mockResponse();
    await metHandler({ method: "GET", query: { q: "portrait" } }, response);
    assert.equal(response.statusCode, 200);
    assert.equal(objectRequests, 60);
    assert.ok(maximumActive <= 12);
    assert.equal(response.payload.items.length, 60);
    assert.equal(response.payload.continue, 60);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
