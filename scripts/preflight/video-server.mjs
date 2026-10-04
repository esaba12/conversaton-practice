// Isolated loopback-only feasibility harness. Not an authenticated app or G1 pass.
import http from "node:http";
import { readFile } from "node:fs/promises";
import { randomBytes, timingSafeEqual } from "node:crypto";
const port = 3010;
const origin = `http://127.0.0.1:${port}`;
const nonce = randomBytes(32).toString("hex");
const key = process.env.TAVUS_API_KEY, pal = process.env.TAVUS_PAL_ID, face = process.env.TAVUS_FACE_ID;
if (!key || !pal || !face) throw new Error("Run provider configuration first.");
let activeId = null, starting = false, cancelled = false;
// SPIKE-01 A/B fixtures. All fictional. "jordan-old" uses the current PAL; "jordan-quality" the candidate quality PAL.
const jordan = "You are Jordan, a fictional manager. Style: busy and fair, protective of the team, talks in short practical sentences. Situation: the user has taken on more than they can do well and wants to ask you to move one project off their plate; you are planning a launch and are short on people. Constraints: keep it about this week's work; do not bring up performance reviews. Challenge: mild pushback. You want to keep the launch on track. You hold back because you are worried the team falls behind. You soften when the user says what to drop. Keep your want and reason consistent across the call. Change your stance only when what the user does matches that; then soften gradually. If the user goes quiet for a while, check in once briefly in character, then wait. Let your face and voice show how the character feels, within the role's tone. React to how the user sounds in character; never name or diagnose the user's emotions. Respond in one to three sentences as Jordan, never as a coach.";
const jordanGreeting = "Hey, you wanted to chat? I've got about ten minutes before planning.";
const standIn = `You are a fictional stand-in playing the user in a short practice, so they can see the conversation once before trying it. The user is playing Jordan. Say the user's line below close to word for word early in the conversation. When Jordan pushes back, acknowledge their concern once and repeat the request. Stay warm, civil and brief (one to three sentences). Do not over-apologize, add new demands, coach, comment on how the user is playing, or claim to be the real user. ${JSON.stringify({ counterpartName: "Jordan", counterpartRole: "Your manager", situation: "The user has taken on more than they can do well and wants to move one project off their plate. Jordan is planning a launch and is short on people.", yourLine: "I need to move the Atlas report to next sprint so I can do the API work well.", whenItGetsHard: "If they say the team needs me, I'll say I get that, and I still need to drop one thing." })}`;
const variants = {
  friendly: { pal, face, context: "You are Alex, a fictional friendly roommate who deflects a chore discussion with one light joke, then listens. Dishes have been left in the shared kitchen. Respond casually in one or two sentences as the roommate, never as a coach.", greeting: "Hey! What's up?" },
  reserved: { pal, face, context: "You are Jamie, a fictional reserved roommate. Be concise, direct and serious, without jokes. You want specific agreements about shared kitchen chores. Respond in one brief sentence as the roommate, never as a coach.", greeting: "Hi. What did you want to discuss?" },
  "jordan-old": { pal, face, context: jordan, greeting: jordanGreeting },
  "jordan-quality": { pal: process.env.TAVUS_QUALITY_PAL_ID, face: process.env.TAVUS_QUALITY_FACE_ID, context: jordan, greeting: jordanGreeting },
  "jordan-tag-probe": { pal: process.env.TAVUS_QUALITY_PAL_ID, face: process.env.TAVUS_QUALITY_FACE_ID, context: `${jordan} In your first reply only, begin one sentence with the audio tag [sighs].`, greeting: jordanGreeting },
  "stand-in": { pal: process.env.TAVUS_STANDIN_PAL_ID, face: process.env.TAVUS_STANDIN_FACE_ID, context: standIn, greeting: "Hey, Jordan, do you have a minute?" },
};
async function provider(path, method, body) {
  const response = await fetch(`https://tavusapi.com/v2/${path}`, { method, headers: { "x-api-key": key, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(25_000) });
  if (!response.ok) throw new Error(`Provider HTTP ${response.status}`);
  return response;
}
async function cleanup() {
  cancelled = true;
  const id = activeId;
  if (!id) return { stopped: !starting, deleted: !starting };
  let stopped = false, deleted = false;
  try { await provider(`conversations/${encodeURIComponent(id)}/end`, "POST"); const response = await provider(`conversations/${encodeURIComponent(id)}`, "GET"); stopped = (await response.json()).status === "ended"; } catch { /* Return truthful pending state. */ }
  if (stopped) { try { await provider(`conversations/${encodeURIComponent(id)}?hard=true`, "DELETE"); deleted = true; } catch { /* Retain ID for retry. */ } }
  if (deleted) activeId = null;
  return { stopped, deleted };
}
function send(response, status, value) { response.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" }); response.end(JSON.stringify(value)); }
function authorized(request) {
  const value = (request.headers.cookie ?? "").split(";").map(x => x.trim()).find(x => x.startsWith("preflight="))?.slice(10);
  return request.headers.origin === origin && value?.length === nonce.length && timingSafeEqual(Buffer.from(value), Buffer.from(nonce));
}
const server = http.createServer(async (request, response) => {
  response.setHeader("Cache-Control", "no-store"); response.setHeader("Referrer-Policy", "no-referrer"); response.setHeader("X-Frame-Options", "DENY");
  if (request.headers.host !== `127.0.0.1:${port}`) return send(response, 403, { error: "Loopback host required." });
  try {
    if (request.method === "GET" && request.url === "/") {
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Set-Cookie": `preflight=${nonce}; HttpOnly; SameSite=Strict; Path=/` });
      return response.end(await readFile(new URL("./video.html", import.meta.url)));
    }
    if (request.method === "GET" && request.url === "/daily.js") { response.writeHead(200, { "Content-Type": "text/javascript" }); return response.end(await readFile(new URL("../../node_modules/@daily-co/daily-js/dist/daily.js", import.meta.url))); }
    if (request.method !== "POST" || !authorized(request)) return send(response, 403, { error: "Use the local preflight page." });
    if (request.url === "/end") return send(response, 200, await cleanup());
    if (request.url !== "/start") return send(response, 404, { error: "Not found." });
    if (starting || activeId) return send(response, 409, { error: "End the previous preflight first." });
    starting = true; cancelled = false;
    let text = "";
    for await (const chunk of request) { text += chunk; if (text.length > 1000) throw new Error("Body limit"); }
    const fixture = JSON.parse(text).fixture;
    const variant = variants[fixture] ?? variants.friendly;
    if (!variant.pal || !variant.face) throw new Error("Variant not configured");
    try {
      const created = await provider("conversations", "POST", { pal_id: variant.pal, face_id: variant.face, audio_only: false, require_auth: true, max_participants: 2, participant_tags: [], conversational_context: variant.context, custom_greeting: variant.greeting, properties: { max_call_duration: 180, participant_left_timeout: 10, participant_absent_timeout: 120, enable_recording: false, auto_start_recording: false, enable_closed_captions: false, languages: ["en"] } });
      const data = await created.json();
      if (typeof data.conversation_id === "string") activeId = data.conversation_id;
      const room = new URL(data.conversation_url);
      if (!activeId || !data.meeting_token || room.protocol !== "https:" || !room.hostname.endsWith(".daily.co") || room.search || room.username || room.password) throw new Error("Invalid private-room response");
      if (cancelled) { await cleanup(); return send(response, 409, { error: "Start cancelled; remote cleanup requested." }); }
      // The loopback page needs the conversation id only to address Tavus interaction app-messages (SPIKE-01 timing probes).
      return send(response, 200, { url: data.conversation_url, token: data.meeting_token, conversationId: activeId });
    } catch { await cleanup(); return send(response, 503, { error: "Provider start failed. Remote state may need checking; do not repeatedly retry." }); }
    finally { starting = false; }
  } catch { starting = false; send(response, 400, { error: "Preflight request could not be completed." }); }
});
server.listen(port, "127.0.0.1", () => console.log(`Isolated live-provider preflight: ${origin}. Calls start only on explicit button click.`));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, async () => { await cleanup(); server.close(); process.exit(0); });
