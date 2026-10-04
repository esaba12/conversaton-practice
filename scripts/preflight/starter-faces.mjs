// C1 starter faces (03-CONTRACTS §2.9). Coordinator only. Never edits existing PALs; never logs keys.
// List:   node --env-file=.env.local scripts/preflight/starter-faces.mjs list
// Create: node --env-file=.env.local scripts/preflight/starter-faces.mjs create
// Ids are stored only in the ignored .env.local as TAVUS_STARTER_<PRESET>_FACE_ID / _PAL_ID and ELEVENLABS_STARTER_<PRESET>_VOICE_ID.
import { readFile, writeFile, chmod } from "node:fs/promises";

const tavusKey = process.env.TAVUS_API_KEY;
const speechKey = process.env.ELEVENLABS_API_KEY;
if (!tavusKey || !speechKey) throw new Error("Provider environment is incomplete.");

// Chosen October 4 by the coordinator from the phoenix-4.5 list and premade voices; the stand-in face and voice are excluded.
export const STARTERS = {
  manager: { face: "Victor - Office", voice: "Eric" },
  roommate: { face: "Lucas - Studio", voice: "Will" },
  professor: { face: "Daniel - Library", voice: "George" },
  decline: { face: "Priya - Office", voice: "Jessica" },
};
const TTS_MODEL = "eleven_v4_turbo";

async function tavus(path, method = "GET", body) {
  const response = await fetch(`https://tavusapi.com/v2/${path}`, {
    method, headers: { "x-api-key": tavusKey, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    console.log(`Tavus ${method} ${path.split("?")[0].split("/")[0]} HTTP ${response.status}`);
    return { ok: false, status: response.status };
  }
  return { ok: true, status: response.status, data: response.status === 204 ? null : await response.json() };
}
async function save(values) {
  let env = await readFile(".env.local", "utf8");
  for (const [key, value] of Object.entries(values)) {
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) throw new Error("Unexpected configuration identifier.");
    const pattern = new RegExp(`^${key}=.*$`, "m");
    env = pattern.test(env) ? env.replace(pattern, `${key}=${value}`) : `${env.trimEnd()}\n${key}=${value}\n`;
  }
  await writeFile(".env.local", env, { mode: 0o600 }); await chmod(".env.local", 0o600);
}

async function loadFaces() {
  const pages = await Promise.all([1, 2].map((page) => tavus(`faces?face_type=system&verbose=true&limit=100&page=${page}`)));
  return pages.flatMap((p) => p.data?.data ?? []).filter((f) => f.model_name === "phoenix-4.5" && f.status === "completed");
}
async function loadVoices() {
  const response = await fetch("https://api.elevenlabs.io/v2/voices?page_size=100&category=premade", { headers: { "xi-api-key": speechKey }, signal: AbortSignal.timeout(15_000) });
  return ((await response.json()).voices ?? []).filter((v) => v.category === "premade");
}

const mode = process.argv[2] ?? "list";
const faces = await loadFaces();
const voices = await loadVoices();
const reservedFace = process.env.TAVUS_STANDIN_FACE_ID;
const reservedVoice = process.env.ELEVENLABS_STANDIN_VOICE_ID;

if (mode === "list") {
  console.log("phoenix-4.5 faces:");
  for (const f of faces) console.log(`  ${f.face_name}${f.face_id === reservedFace ? " (stand-in, reserved)" : ""}${f.face_id === process.env.TAVUS_FACE_ID ? " (default)" : ""}${(f.tags ?? []).length ? ` [${f.tags.join(",")}]` : ""}`);
  console.log("premade voices:");
  for (const v of voices) console.log(`  ${v.name}${v.voice_id === reservedVoice ? " (stand-in, reserved)" : ""}${v.voice_id === process.env.ELEVENLABS_VOICE_ID ? " (default)" : ""} ${JSON.stringify(v.labels ?? {})}`);
  process.exit(0);
}
if (mode !== "create") throw new Error("Unknown mode.");

const BASE_PROMPT = "You play a fictional counterpart in a short, everyday conversation rehearsal. Follow the public fictional role and context supplied for this call. Respond as that counterpart, not a coach or advice assistant. Use one to three sentences. Do not diagnose, score, predict real people, or claim to see the user. User camera is not shared. Every call starts fresh. Do not invent earlier shared conversations. If the user wants to stop, briefly acknowledge and let them end.";
const DELIVERY = "Let your face and voice show how the character feels, within the role's tone. React to how the user sounds in character; never name or diagnose the user's emotions.";
const layers = (voiceId) => ({
  llm: { model: "tavus-gemma-4", speculative_inference: true },
  perception: { perception_model: "raven-1", emotion_recognition: "full" },
  conversational_flow: { turn_detection_model: "sparrow-2", turn_taking_patience: "high", pal_interruptibility: "high", idle_engagement: "patient" },
  tts: { tts_engine: "elevenlabs", external_voice_id: voiceId, tts_model_name: TTS_MODEL, api_key: speechKey },
});

const pick = {};
for (const [preset, choice] of Object.entries(STARTERS)) {
  const face = faces.find((f) => f.face_name === choice.face);
  const voice = voices.find((v) => v.name === choice.voice || v.name.startsWith(`${choice.voice} -`));
  if (!face || !voice) throw new Error(`${preset}: face or voice not available; nothing created.`);
  if (face.face_id === reservedFace || voice.voice_id === reservedVoice) throw new Error(`${preset}: reserved stand-in face or voice.`);
  pick[preset] = { face, voice };
}
if (new Set(Object.values(pick).map((p) => p.face.face_id)).size !== 4) throw new Error("Starter faces must be distinct.");

// Starters sharing a voice share a PAL.
const palByVoice = new Map();
for (const [preset, { face, voice }] of Object.entries(pick)) {
  const envPal = `TAVUS_STARTER_${preset.toUpperCase()}_PAL_ID`;
  let palId = process.env[envPal] || palByVoice.get(voice.voice_id);
  if (!palId) {
    const created = await tavus("pals", "POST", { pal_name: `Conversation rehearsal starter ${preset}`, pipeline_mode: "full", default_face_id: face.face_id, system_prompt: `${BASE_PROMPT} ${DELIVERY}`, layers: layers(voice.voice_id) });
    if (!created.ok || !created.data?.pal_id) throw new Error(`${preset}: PAL create failed.`);
    palId = created.data.pal_id;
  }
  palByVoice.set(voice.voice_id, palId);
  const readback = await tavus(`pals/${encodeURIComponent(palId)}`);
  const pal = readback.data ?? {};
  const p = pal.layers?.perception ?? {};
  const ok = pal.layers?.tts?.external_voice_id === voice.voice_id && pal.layers?.tts?.tts_model_name === TTS_MODEL && p.perception_model === "raven-1" && p.emotion_recognition === "full"
    && pal.layers?.conversational_flow?.idle_engagement === "patient" && !(pal.tool_ids?.length) && !(pal.layers?.llm?.tools?.length);
  if (!ok) throw new Error(`${preset}: PAL readback did not match.`);
  await save({ [envPal]: palId, [`TAVUS_STARTER_${preset.toUpperCase()}_FACE_ID`]: face.face_id, [`ELEVENLABS_STARTER_${preset.toUpperCase()}_VOICE_ID`]: voice.voice_id });
  console.log(`${preset}: face "${face.face_name}", voice "${voice.name}", PAL readback ok (ids stored in .env.local)`);
}
console.log("No live audiovisual verification.");
