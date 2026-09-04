import { COMPOSITION_VARIANTS, SYSTEM_PROMPT, userPrompt } from "./prompt.js";
import { describeEffects } from "../../compositions/effect-model.js";
import { sampleById, templates } from "./templates.js";

const BANNED = /\b(fetch|XMLHttpRequest|WebSocket|eval|Function|importScripts|localStorage|indexedDB|Worker|import\s|require\s*\(|process\.|document\.|window\.|globalThis)\b/;

export function extractPaintFunction(raw) {
  if (!raw || typeof raw !== "string") {
    throw new Error("Empty model response");
  }

  const fence = raw.match(/```(?:javascript|js)?\s*([\s\S]*?)```/i);
  let code = (fence ? fence[1] : raw).trim();
  code = code.replace(/^javascript\s+/i, "").trim();

  if (!/function\s+paint\s*\(/.test(code)) {
    code = `function paint() {\n${code}\n}`;
  }

  const start = code.search(/function\s+paint\s*\(/);
  if (start > 0) code = code.slice(start);

  const fn = extractBalancedFunction(code);
  if (!fn) throw new Error("Could not find a complete paint() function");
  return fn.trim();
}

function extractBalancedFunction(code) {
  const match = code.match(/function\s+paint\s*\([^)]*\)\s*\{/);
  if (!match) return null;
  const start = match.index;
  let depth = 0;
  let started = false;
  for (let i = start; i < code.length; i++) {
    const ch = code[i];
    if (ch === "{") {
      depth += 1;
      started = true;
    } else if (ch === "}") {
      depth -= 1;
      if (started && depth === 0) return code.slice(start, i + 1);
    }
  }
  return null;
}

export function assertSafeSketch(code) {
  if (BANNED.test(code)) {
    throw new Error("Generated sketch used a blocked API");
  }
  if (!/brush\.(fill|circle|polygon)\s*\(/.test(code)) {
    throw new Error("Sketch did not use p5.brush fills");
  }
  return code;
}

function headersFromRequest(req) {
  const provider = String(req.headers["x-llm-provider"] || process.env.LLM_PROVIDER || "").toLowerCase();
  const key = String(req.headers["x-api-key"] || "").trim();
  return { provider, key };
}

function inferProviderName(provider, key) {
  if (key.startsWith("xai-")) return "grok";
  if (key.startsWith("sk-ant-")) return "anthropic";
  if (provider === "grok" || provider === "xai") return "grok";
  if (provider === "openai") return "openai";
  if (provider === "anthropic") return "anthropic";
  if (key.startsWith("sk-")) return "openai";
  return provider || "";
}

function resolveProvider({ provider, key }) {
  const name = inferProviderName(provider, key);
  const grokKey = name === "grok" && key ? key : process.env.XAI_API_KEY || process.env.GROK_API_KEY;
  const openaiKey = name === "openai" && key ? key : process.env.OPENAI_API_KEY;
  const anthropicKey = name === "anthropic" && key ? key : process.env.ANTHROPIC_API_KEY;

  if (name === "grok" && (key || grokKey)) return { name: "grok", apiKey: key || grokKey };
  if (name === "openai" && (key || openaiKey)) return { name: "openai", apiKey: key || openaiKey };
  if (name === "anthropic" && (key || anthropicKey)) {
    return { name: "anthropic", apiKey: key || anthropicKey };
  }
  if (grokKey) return { name: "grok", apiKey: grokKey };
  if (anthropicKey) return { name: "anthropic", apiKey: anthropicKey };
  if (openaiKey) return { name: "openai", apiKey: openaiKey };
  return null;
}

const OPENAI_COMPAT = {
  grok: {
    url: "https://api.x.ai/v1/chat/completions",
    modelEnv: "XAI_MODEL",
    model: "grok-4.6",
    label: "Grok",
  },
  openai: {
    url: "https://api.openai.com/v1/chat/completions",
    modelEnv: "OPENAI_MODEL",
    model: "gpt-4.1",
    label: "OpenAI",
  },
};

async function complete({ provider, messages }) {
  if (provider.name === "anthropic") {
    const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": provider.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 3500,
        system: SYSTEM_PROMPT,
        messages: messages.map(({ role, content }) => ({ role, content })),
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Anthropic error ${response.status}: ${text.slice(0, 280)}`);
    }
    const data = await response.json();
    return (data.content || []).map((part) => part.text || "").join("\n");
  }

  const spec = OPENAI_COMPAT[provider.name];
  if (!spec) throw new Error(`Unknown provider: ${provider.name}`);

  const model = process.env[spec.modelEnv] || spec.model;
  const response = await fetch(spec.url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.9,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${spec.label} error ${response.status}: ${text.slice(0, 280)}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function generateOne({ provider, scene, seed, variant, effectsText }) {
  const raw = await complete({
    provider,
    messages: [{ role: "user", content: userPrompt({ scene, seed, variant, effectsText }) }],
  });
  return assertSafeSketch(extractPaintFunction(raw));
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export async function generatePaintings(req, { scene, count = 4, sampleId, effects }) {
  const n = Math.max(1, Math.min(6, Number(count) || 4));
  const provider = resolveProvider(headersFromRequest(req));
  const effectsText = describeEffects(effects || {});

  if (sampleId && templates[sampleId]) {
    const sample = sampleById(sampleId);
    return Array.from({ length: n }, (_, i) => {
      const seed = 11 + i * 97;
      const variant = COMPOSITION_VARIANTS[i % COMPOSITION_VARIANTS.length];
      return {
        id: `${sampleId}-${i + 1}`,
        prompt: sample.prompt,
        seed,
        variant,
        code: templates[sampleId],
        source: "sample",
        system: SYSTEM_PROMPT,
        user: userPrompt({ scene: sample.prompt, seed, variant, effectsText }),
        effects: effects || null,
      };
    });
  }

  if (!scene || !scene.trim()) {
    throw new Error("Describe a scene to paint");
  }

  if (!provider) {
    const error = new Error("Add a Grok, Anthropic, or OpenAI API key to invent new paintings.");
    error.status = 401;
    throw error;
  }

  const base = Math.floor(mulberry32(hashString(scene))() * 1e9);
  const jobs = Array.from({ length: n }, async (_, i) => {
    const seed = base + i * 7919;
    const variant = COMPOSITION_VARIANTS[i % COMPOSITION_VARIANTS.length];
    try {
      const code = await generateOne({ provider, scene: scene.trim(), seed, variant, effectsText });
      return {
        id: `${seed}`,
        prompt: scene.trim(),
        seed,
        variant,
        code,
        source: "model",
        system: SYSTEM_PROMPT,
        user: userPrompt({ scene: scene.trim(), seed, variant, effectsText }),
        effects: effects || null,
        error: null,
      };
    } catch (err) {
      return {
        id: `${seed}`,
        prompt: scene.trim(),
        seed,
        variant,
        code: "",
        source: "model",
        system: SYSTEM_PROMPT,
        user: userPrompt({ scene: scene.trim(), seed, variant, effectsText }),
        effects: effects || null,
        error: err.message,
      };
    }
  });

  return Promise.all(jobs);
}

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
