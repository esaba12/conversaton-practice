// Coordinator administration only; capability hash goes to DB, raw secret stays local.
import { randomBytes, createHash } from "node:crypto";
import { readFile, writeFile, chmod, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
const secret = process.env.SESSION_SERVER_SECRET || randomBytes(32).toString("hex");
if (!/^[a-f0-9]{64}$/.test(secret)) throw new Error("Expected a 32-byte hex capability.");
const hash = createHash("sha256").update(secret).digest("hex");
let environment = await readFile(".env.local", "utf8");
const line = `SESSION_SERVER_SECRET=${secret}`;
environment = /^SESSION_SERVER_SECRET=.*$/m.test(environment) ? environment.replace(/^SESSION_SERVER_SECRET=.*$/m, line) : `${environment.trimEnd()}\n${line}\n`;
await writeFile(".env.local", environment, { mode: 0o600 }); await chmod(".env.local", 0o600);
const directory = await mkdtemp(join(tmpdir(), "practice-secret-"));
try {
  const file = join(directory, "provision.sql");
  await writeFile(file, `insert into practice_private.server_capability(singleton,secret_hash) values(true,decode('${hash}','hex')) on conflict(singleton) do update set secret_hash=excluded.secret_hash;`, { mode: 0o600 });
  const result = spawnSync("supabase", ["db", "query", "--linked", "--file", file], { encoding: "utf8", timeout: 60_000 });
  if (result.status !== 0) throw new Error("Capability provisioning failed; local secret was preserved. Inspect database access before retrying.");
  console.log("Server capability hash provisioned; raw value remains only in ignored local environment.");
} finally { await rm(directory, { recursive: true, force: true }); }
