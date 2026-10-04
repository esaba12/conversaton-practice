// Coordinator-only bounded provider configuration. Never logs provider payloads.
// node --env-file=.env.local scripts/preflight/provider-setup.mjs
import { readFile, writeFile, chmod } from "node:fs/promises";

const tavusKey = process.env.TAVUS_API_KEY;
const speechKey = process.env.ELEVENLABS_API_KEY;
if (!tavusKey || !speechKey) throw new Error("Provider environment is incomplete.");
async function request(path, method = "GET", body) {
  const response = await fetch(`https://tavusapi.com/v2/${path}`, {
    method, headers: { "x-api-key": tavusKey, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Tavus ${method} ${path.split("/")[0]} HTTP ${response.status}`);
  return response.status === 204 ? null : response.json();
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

let palId = process.env.TAVUS_PAL_ID;
let faceId = process.env.TAVUS_FACE_ID;
if (!palId) {
  const faces = await request("faces?face_type=system&verbose=true&limit=100&page=1");
  const face = faces.data?.find((item) => item.face_type === "system" && item.status === "completed" && (!item.finetune_status || item.finetune_status === "completed"));
  if (!face) throw new Error("No ready stock face available; no resource created.");
  faceId = face.face_id;
  const voicesResponse = await fetch("https://api.elevenlabs.io/v2/voices?page_size=100", { headers: { "xi-api-key": speechKey }, signal: AbortSignal.timeout(15_000) });
  if (!voicesResponse.ok) throw new Error(`ElevenLabs voice read HTTP ${voicesResponse.status}`);
  const voices = await voicesResponse.json();
  const voice = voices.voices?.find((item) => item.category === "premade");
  if (!voice) throw new Error("No stock ElevenLabs voice found; no resource created.");
  const pal = await request("pals", "POST", {
    pal_name: "Conversation rehearsal G1",
    pipeline_mode: "full", default_face_id: faceId,
    system_prompt: "You play a fictional counterpart in a short, everyday conversation rehearsal. Follow the public fictional role and context supplied for this call. Respond as that counterpart, not a coach or advice assistant. Use one to three sentences. Do not diagnose, score, predict real people, or claim to see the user. User camera is not shared. Every call starts fresh. Do not invent earlier shared conversations. If the user wants to stop, briefly acknowledge and let them end.",
    layers: {
      perception: { perception_model: "off" },
      conversational_flow: { turn_detection_model: "sparrow-2", turn_taking_patience: "high", pal_interruptibility: "high", idle_engagement: "off" },
      tts: { tts_engine: "elevenlabs", external_voice_id: voice.voice_id, tts_model_name: "eleven_flash_v2_5", api_key: speechKey },
    },
  });
  if (!pal.pal_id) throw new Error("PAL created but response identifier missing; inspect account before retrying.");
  palId = pal.pal_id;
  await save({ TAVUS_PAL_ID: palId, TAVUS_FACE_ID: faceId, ELEVENLABS_VOICE_ID: voice.voice_id });
  console.log("Created immutable roleplay PAL with stock face and explicit ElevenLabs TTS. Configuration stored only in ignored local environment.");
}
const observed = await request(`pals/${encodeURIComponent(palId)}`);
if (observed.layers?.tts?.tts_engine !== "elevenlabs") throw new Error("PAL speech engine verification failed.");
// Quality PAL (SPIKE-01, switched after the owner's A/B): Raven-1 audio tone only; no queries, tools or callbacks.
const perception = observed.layers?.perception ?? {};
const noQueries = ["visual_awareness_queries", "audio_awareness_queries", "screen_awareness_queries", "perception_analysis_queries", "ambient_awareness_queries"].every((k) => !perception[k]?.length);
const noTools = ["visual_tools", "audio_tools", "screen_tools", "perception_tools"].every((k) => !perception[k]?.length) && !observed.tool_ids?.length && !observed.layers?.llm?.tools?.length;
if (perception.perception_model !== "raven-1" || perception.emotion_recognition !== "full" || !noQueries || !noTools) throw new Error("PAL perception verification failed.");
console.log("PAL readback confirms ElevenLabs TTS and Raven-1 audio perception with no queries, tools or callbacks. No live audiovisual verification.");
const testCall = await request("conversations", "POST", {
  pal_id: palId, face_id: faceId, audio_only: false, require_auth: true, max_participants: 2,
  participant_tags: [], test_mode: true,
  conversational_context: "You are Alex, a fictional friendly roommate. The user wants to discuss dishes left in the shared kitchen. Stay in character; do not coach.",
  custom_greeting: "Hey! What's up?",
  properties: { max_call_duration: 180, participant_left_timeout: 10, participant_absent_timeout: 120, enable_recording: false, auto_start_recording: false, enable_closed_captions: false, languages: ["en"] },
});
if (!testCall.conversation_id) throw new Error("Test-mode creation returned no identifier.");
console.log(`Test-mode conversation accepted; status=${testCall.status === "ended" ? "ended" : "not-ended"}; token-present=${Boolean(testCall.meeting_token)}. This does not test TTS or video.`);
await request(`conversations/${encodeURIComponent(testCall.conversation_id)}?hard=true`, "DELETE");
console.log("Test-mode conversation hard deletion returned success. ElevenLabs cascading deletion is not established.");
