// SPIKE-01: create the quality PAL and the stand-in PAL. Coordinator only. Never edits the existing PAL.
// Never logs keys or payload bodies. Ids are stored only in the ignored .env.local.
// node --env-file=.env.local scripts/preflight/spike-01-pals.mjs
import { readFile, writeFile, chmod } from "node:fs/promises";

const tavusKey = process.env.TAVUS_API_KEY;
const speechKey = process.env.ELEVENLABS_API_KEY;
if (!tavusKey || !speechKey || !process.env.TAVUS_PAL_ID) throw new Error("Provider environment is incomplete.");

const QUALITY_FACE = "rc9cff32ceba"; // "Anna - Casual", featured Pro, phoenix-4.5 (public docs id)
const STANDIN_FACE_NAME = "Jamie"; // phoenix-4.5, recommended; reserved for the stand-in, never a person preset
const STANDIN_VOICE_NAME = "River"; // premade, gender-neutral, relaxed
const TTS_CANDIDATES = ["eleven_v4_turbo", "eleven_v3_conversational"];

async function tavus(path, method = "GET", body) {
  const response = await fetch(`https://tavusapi.com/v2/${path}`, {
    method, headers: { "x-api-key": tavusKey, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30_000),
  });
  const label = `Tavus ${method} ${path.split("?")[0].split("/")[0]}`;
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const message = (() => { try { const j = JSON.parse(text); return String(j.message ?? j.error ?? "").slice(0, 160); } catch { return ""; } })();
    console.log(`${label} HTTP ${response.status}${message ? ` (${message})` : ""}`);
    return { ok: false, status: response.status };
  }
  console.log(`${label} HTTP ${response.status}`);
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

const BASE_PROMPT = "You play a fictional counterpart in a short, everyday conversation rehearsal. Follow the public fictional role and context supplied for this call. Respond as that counterpart, not a coach or advice assistant. Use one to three sentences. Do not diagnose, score, predict real people, or claim to see the user. User camera is not shared. Every call starts fresh. Do not invent earlier shared conversations. If the user wants to stop, briefly acknowledge and let them end.";
const DELIVERY = "Let your face and voice show how the character feels, within the role's tone. React to how the user sounds in character; never name or diagnose the user's emotions.";
const STANDIN_PROMPT = "You play a fictional stand-in for the user in a short conversation rehearsal, so they can see the conversation once before trying it themselves. The user plays the other person. Follow the context supplied for this call. Stay in the scene: never coach, never comment on how the user is playing, never claim to be the real user, and never give advice. Use one to three warm, civil sentences. Do not over-apologize or add new demands. User camera is not shared. Every call starts fresh. If the user wants to stop, briefly acknowledge and let them end.";

function layers(voiceId, ttsModel) {
  return {
    llm: { model: "tavus-gemma-4", speculative_inference: true },
    perception: { perception_model: "raven-1", emotion_recognition: "full" },
    conversational_flow: { turn_detection_model: "sparrow-2", turn_taking_patience: "high", pal_interruptibility: "high", idle_engagement: "patient" },
    tts: { tts_engine: "elevenlabs", external_voice_id: voiceId, tts_model_name: ttsModel, api_key: speechKey },
  };
}

function verify(pal, { voiceId, faceId }) {
  const p = pal.layers?.perception ?? {};
  const checks = {
    tts_engine: pal.layers?.tts?.tts_engine === "elevenlabs",
    tts_model: TTS_CANDIDATES.includes(pal.layers?.tts?.tts_model_name),
    voice: pal.layers?.tts?.external_voice_id === voiceId,
    face: pal.default_face_id === faceId,
    // New PALs omit default-valued LLM fields; a PATCH to tavus-gemma-4 returned 304 Not Modified (SPIKE-01).
    llm: (pal.layers?.llm?.model ?? "tavus-gemma-4") === "tavus-gemma-4" && !pal.layers?.llm?.base_url,
    raven: p.perception_model === "raven-1",
    emotion_full: p.emotion_recognition === "full",
    no_queries: ["visual_awareness_queries", "audio_awareness_queries", "screen_awareness_queries", "perception_analysis_queries", "ambient_awareness_queries"].every((k) => !(p[k]?.length)),
    no_tools: ["visual_tools", "audio_tools", "screen_tools", "perception_tools"].every((k) => !(p[k]?.length)) && !(pal.layers?.llm?.tools?.length) && !(pal.tool_ids?.length),
    sparrow2: pal.layers?.conversational_flow?.turn_detection_model === "sparrow-2",
    patient: pal.layers?.conversational_flow?.idle_engagement === "patient",
    no_memory_or_kb: !(pal.document_ids?.length) && !(pal.skills?.length ?? 0),
  };
  console.log(`readback: ${Object.entries(checks).map(([k, v]) => `${k}=${v ? "ok" : "FAIL"}`).join(" ")}; tts_model=${pal.layers?.tts?.tts_model_name}`);
  if (!Object.values(checks).every(Boolean)) throw new Error("PAL readback did not match.");
}

async function testModeRoundTrip(palId, faceId, label) {
  const created = await tavus("conversations", "POST", {
    pal_id: palId, face_id: faceId, audio_only: false, require_auth: true, max_participants: 2, participant_tags: [], test_mode: true,
    conversational_context: "You are Jordan, a fictional manager. The user wants to talk about workload. Stay in character.",
    custom_greeting: "Hey, you wanted to chat?",
    properties: { max_call_duration: 180, participant_left_timeout: 10, participant_absent_timeout: 120, enable_recording: false, auto_start_recording: false, enable_closed_captions: false, languages: ["en"] },
  });
  if (!created.ok || !created.data?.conversation_id) throw new Error(`${label}: test-mode create failed.`);
  console.log(`${label}: test-mode create status=${created.data.status}; token-present=${Boolean(created.data.meeting_token)}`);
  const deleted = await tavus(`conversations/${encodeURIComponent(created.data.conversation_id)}?hard=true`, "DELETE");
  if (!deleted.ok) throw new Error(`${label}: hard delete failed.`);
  console.log(`${label}: hard delete ok`);
}

async function createPal(name, prompt, faceId, voiceId) {
  for (const model of TTS_CANDIDATES) {
    const created = await tavus("pals", "POST", { pal_name: `${name} (${model})`, pipeline_mode: "full", default_face_id: faceId, system_prompt: prompt, layers: layers(voiceId, model) });
    console.log(`${name}: tts_model_name=${model} -> ${created.ok ? "accepted" : `rejected HTTP ${created.status}`}`);
    if (created.ok && created.data?.pal_id) return created.data.pal_id;
  }
  throw new Error(`${name}: no candidate TTS model accepted; nothing switched.`);
}

const facesA = await tavus("faces?face_type=system&verbose=true&limit=100&page=1");
const facesB = await tavus("faces?face_type=system&verbose=true&limit=100&page=2");
const faces = [...(facesA.data?.data ?? []), ...(facesB.data?.data ?? [])];
const qualityFace = faces.find((f) => f.face_id === QUALITY_FACE && f.status === "completed");
const standinFace = faces.find((f) => f.face_name === STANDIN_FACE_NAME && f.model_name === "phoenix-4.5" && f.status === "completed");
if (!qualityFace || !standinFace) throw new Error("Chosen faces are not available; nothing created.");
const voicesResponse = await fetch("https://api.elevenlabs.io/v2/voices?page_size=100&category=premade", { headers: { "xi-api-key": speechKey }, signal: AbortSignal.timeout(15_000) });
const voices = (await voicesResponse.json()).voices ?? [];
const standinVoice = voices.find((v) => v.category === "premade" && v.name.startsWith(STANDIN_VOICE_NAME));
const qualityVoiceId = process.env.ELEVENLABS_VOICE_ID;
if (!standinVoice || !qualityVoiceId || standinVoice.voice_id === qualityVoiceId) throw new Error("Voice selection failed; nothing created.");

let qualityPal = process.env.TAVUS_QUALITY_PAL_ID;
if (!qualityPal) {
  qualityPal = await createPal("Conversation rehearsal quality Q1", `${BASE_PROMPT} ${DELIVERY}`, qualityFace.face_id, qualityVoiceId);
  await save({ TAVUS_QUALITY_PAL_ID: qualityPal, TAVUS_QUALITY_FACE_ID: qualityFace.face_id });
  console.log("quality PAL stored in .env.local as TAVUS_QUALITY_PAL_ID (not active).");
}
let standinPal = process.env.TAVUS_STANDIN_PAL_ID;
if (!standinPal) {
  standinPal = await createPal("Conversation rehearsal stand-in W10", STANDIN_PROMPT, standinFace.face_id, standinVoice.voice_id);
  await save({ TAVUS_STANDIN_PAL_ID: standinPal, TAVUS_STANDIN_FACE_ID: standinFace.face_id, ELEVENLABS_STANDIN_VOICE_ID: standinVoice.voice_id });
  console.log("stand-in PAL stored in .env.local as TAVUS_STANDIN_PAL_ID.");
}

const q = await tavus(`pals/${encodeURIComponent(qualityPal)}`);
verify(q.data, { voiceId: qualityVoiceId, faceId: qualityFace.face_id });
const s = await tavus(`pals/${encodeURIComponent(standinPal)}`);
verify(s.data, { voiceId: standinVoice.voice_id, faceId: standinFace.face_id });
await testModeRoundTrip(qualityPal, qualityFace.face_id, "quality");
await testModeRoundTrip(standinPal, standinFace.face_id, "stand-in");
const old = await tavus(`pals/${encodeURIComponent(process.env.TAVUS_PAL_ID)}`);
console.log(`existing PAL unchanged: perception=${old.data?.layers?.perception?.perception_model}, tts_model=${old.data?.layers?.tts?.tts_model_name}, updated_at=${old.data?.updated_at}`);
console.log(`faces: quality="${qualityFace.face_name}" ${qualityFace.model_name}; stand-in="${standinFace.face_name}" ${standinFace.model_name}; stand-in voice="${standinVoice.name}"`);
console.log("TAVUS_PAL_ID not switched. No live audiovisual verification.");
