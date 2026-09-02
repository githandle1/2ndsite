import { generatePaintings } from "../lib/compositions/generate.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }
  try {
    const { scene, count, sampleId, effects } = req.body || {};
    const paintings = await generatePaintings(req, { scene, count, sampleId, effects });
    res.status(200).json({ paintings });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "generate failed" });
  }
}
