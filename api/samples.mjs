import { samples } from "../lib/compositions/templates.js";

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }
  res.status(200).json({ samples });
}
