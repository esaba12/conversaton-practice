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
    const fixture = JSON.parse(text).fixture === "reserved" ? "reserved" : "friendly";
    const context = fixture === "friendly"
      ? "You are Alex, a fictional friendly roommate who deflects a chore discussion with one light joke, then listens. Dishes have been left in the shared kitchen. Respond casually in one or two sentences as the roommate, never as a coach."
      : "You are Jamie, a fictional reserved roommate. Be concise, direct and serious, without jokes. You want specific agreements about shared kitchen chores. Respond in one brief sentence as the roommate, never as a coach.";
    try {
      const created = await provider("conversations", "POST", { pal_id: pal, face_id: face, audio_only: false, require_auth: true, max_participants: 2, participant_tags: [], conversational_context: context, custom_greeting: fixture === "friendly" ? "Hey! What's up?" : "Hi. What did you want to discuss?", properties: { max_call_duration: 180, participant_left_timeout: 10, participant_absent_timeout: 120, enable_recording: false, auto_start_recording: false, enable_closed_captions: false, languages: ["en"] } });
      const data = await created.json();
      if (typeof data.conversation_id === "string") activeId = data.conversation_id;
      const room = new URL(data.conversation_url);
      if (!activeId || !data.meeting_token || room.protocol !== "https:" || !room.hostname.endsWith(".daily.co") || room.search || room.username || room.password) throw new Error("Invalid private-room response");
      if (cancelled) { await cleanup(); return send(response, 409, { error: "Start cancelled; remote cleanup requested." }); }
      return send(response, 200, { url: data.conversation_url, token: data.meeting_token });
    } catch { await cleanup(); return send(response, 503, { error: "Provider start failed. Remote state may need checking; do not repeatedly retry." }); }
    finally { starting = false; }
  } catch { starting = false; send(response, 400, { error: "Preflight request could not be completed." }); }
});
server.listen(port, "127.0.0.1", () => console.log(`Isolated live-provider preflight: ${origin}. Calls start only on explicit button click.`));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, async () => { await cleanup(); server.close(); process.exit(0); });
