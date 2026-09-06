import { commonsSearchUrl, normalizeCommonsResponse } from "../lib/compositions/commons.mjs";

const ALLOWED_FILTERS = new Set(["public-domain", "cc0"]);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  const search = String(req.query?.q || "").trim();
  const license = ALLOWED_FILTERS.has(req.query?.license) ? req.query.license : "public-domain";
  const offset = Number.parseInt(req.query?.continue, 10) || 0;

  if (!search) {
    res.status(400).json({ error: "add something to search for" });
    return;
  }

  try {
    const response = await fetch(commonsSearchUrl(search, offset), {
      headers: {
        Accept: "application/json",
        "User-Agent": "mayasthinking-compositions/1.0 (open access image curator)",
      },
    });

    if (!response.ok) throw new Error(`commons returned ${response.status}`);

    const normalized = normalizeCommonsResponse(await response.json(), license);
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=900");
    res.status(200).json(normalized);
  } catch (error) {
    console.error("commons search failed", error);
    res.status(502).json({ error: "commons is quiet right now. try again in a moment." });
  }
}
