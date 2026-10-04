// SPIKE-01 read-only probe. Coordinator only. Prints field names, counts and flags, never keys or payload bodies.
// node --env-file=.env.local scripts/preflight/spike-01-read.mjs
const tavusKey = process.env.TAVUS_API_KEY;
const speechKey = process.env.ELEVENLABS_API_KEY;
if (!tavusKey || !speechKey) throw new Error("Provider environment is incomplete.");

async function tavus(path) {
  const response = await fetch(`https://tavusapi.com/v2/${path}`, { headers: { "x-api-key": tavusKey }, signal: AbortSignal.timeout(30_000) });
  console.log(`Tavus GET ${path.split("?")[0].split("/")[0]} HTTP ${response.status}`);
  return response.ok ? response.json() : null;
}
async function eleven(path) {
  const response = await fetch(`https://api.elevenlabs.io/${path}`, { headers: { "xi-api-key": speechKey }, signal: AbortSignal.timeout(15_000) });
  console.log(`ElevenLabs GET ${path.split("?")[0]} HTTP ${response.status}`);
  return response.ok ? response.json() : null;
}

const faces = await tavus("faces?face_type=system&verbose=true&limit=100&page=1");
const list = faces?.data ?? [];
console.log(`system faces on page 1: ${list.length}; total_count=${faces?.total_count ?? "n/a"}`);
console.log(`face fields: ${[...new Set(list.flatMap((f) => Object.keys(f)))].sort().join(", ")}`);
const ready = list.filter((f) => f.status === "completed");
console.log(`ready faces: ${ready.length}`);
const models = {};
for (const f of ready) models[f.model_name ?? "unknown"] = (models[f.model_name ?? "unknown"] ?? 0) + 1;
console.log(`face models: ${JSON.stringify(models)}`);
const pro = ["rb32069a3012", "rc9cff32ceba", "r3f4182ef554"];
for (const id of pro) {
  const f = list.find((x) => x.face_id === id);
  console.log(`featured pro ${id}: ${f ? `listed, status=${f.status}, name=${f.face_name}` : "not on page 1"}`);
}
const previewish = list.length ? Object.keys(list[0]).filter((k) => /thumb|preview|image|video|url/i.test(k)) : [];
console.log(`preview-like fields: ${previewish.join(", ") || "none"}`);
for (const k of previewish) console.log(`  ${k}: present on ${list.filter((f) => f[k]).length} faces`);
console.log("ready face names:", ready.map((f) => `${f.face_name}${f.is_pro || /pro/i.test(JSON.stringify(f.tags ?? "")) ? " [pro]" : ""}`).join(" | "));

const pal = await tavus(`pals/${encodeURIComponent(process.env.TAVUS_PAL_ID)}`);
if (pal) {
  console.log(`current PAL layers: ${Object.keys(pal.layers ?? {}).join(", ")}`);
  console.log(`current PAL llm: ${JSON.stringify(pal.layers?.llm ?? null)}`);
  const { api_key, external_voice_id, ...tts } = pal.layers?.tts ?? {};
  console.log(`current PAL tts (no ids/keys): ${JSON.stringify(tts)}; key-set=${Boolean(api_key)}`);
  console.log(`current PAL flow: ${JSON.stringify(pal.layers?.conversational_flow ?? null)}`);
  console.log(`current PAL perception: ${JSON.stringify(pal.layers?.perception ?? null)}`);
  console.log(`current PAL top-level fields: ${Object.keys(pal).sort().join(", ")}`);
}

const elModels = await eleven("v1/models");
if (elModels) console.log(`ElevenLabs models: ${elModels.map((m) => m.model_id).join(", ")}`);
const voices = await eleven("v2/voices?page_size=100&category=premade");
const premade = (voices?.voices ?? []).filter((v) => v.category === "premade");
console.log(`premade voices: ${premade.length}`);
console.log(premade.map((v) => `${v.name} (${v.labels?.gender ?? "?"}, ${v.labels?.age ?? "?"}, ${v.labels?.accent ?? "?"}, ${v.labels?.descriptive ?? v.labels?.description ?? "?"})`).join(" | "));
const current = premade.find((v) => v.voice_id === process.env.ELEVENLABS_VOICE_ID);
console.log(`current voice: ${current ? current.name : "not premade or not found"}`);
