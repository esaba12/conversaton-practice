// W8 demo seed. Coordinator-only, against a fictional demo account.
//
//   node --env-file=.env.local scripts/demo/seed.mjs            reset, then seed (Jordan + two shared facts)
//   node --env-file=.env.local scripts/demo/seed.mjs --checkin  also plan the talk for today so the check-in shows
//   node --env-file=.env.local scripts/demo/seed.mjs --reset    remove the account's people, facts and plans
//   SUPABASE_SERVICE_ROLE_KEY=… node --env-file=.env.local scripts/demo/seed.mjs --create
//                                                               create or label the demo account (service key inline only)
//
// Needs DEMO_EMAIL and DEMO_PASSWORD in local env. Every write runs as the signed-in demo user through
// the owner-checked RPCs, and the script refuses any account whose metadata is not labelled demo.
import { createClient } from "@supabase/supabase-js";

const FACTS = ["I've been on the team for two years", "I'm leading the API work"];
const JORDAN = {
  p_name: "Jordan",
  p_relationship: "Your manager",
  p_traits: {},
  p_style: "Busy and fair. Protective of the team. Talks in short, practical sentences.",
  p_public_context: "You've taken on more than you can do well and want to ask Jordan to move one project off your plate. Jordan is planning a launch and is short on people.",
  p_opening: "Hey, you wanted to chat? I've got about ten minutes before planning.",
  p_constraints: ["Keep it about this week's work.", "Do not bring up performance reviews."],
  p_challenge: "mild_pushback",
  p_pace: "conversational",
  p_background: null,
};

const args = new Set(process.argv.slice(2));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const email = process.env.DEMO_EMAIL;
const password = process.env.DEMO_PASSWORD;
if (!url || !publishable || !email || !password) fail("Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, DEMO_EMAIL and DEMO_PASSWORD in local env.");

function fail(message) { console.error(message); process.exit(1); }
const unwrap = ({ data, error }, step) => { if (error) fail(`${step} failed: ${error.code ?? ""} ${error.message}`); return data; };
const client = () => createClient(url, publishable, { auth: { persistSession: false, autoRefreshToken: false } });

async function create() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) fail("--create needs SUPABASE_SERVICE_ROLE_KEY passed inline for this one command.");
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const users = unwrap(await admin.auth.admin.listUsers({ perPage: 1000 }), "list users").users;
  const existing = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (existing) {
    unwrap(await admin.auth.admin.updateUserById(existing.id, { password, user_metadata: { ...existing.user_metadata, demo: true } }), "label user");
    console.log("Demo account labelled.");
  } else {
    unwrap(await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { demo: true } }), "create user");
    console.log("Demo account created.");
  }
}

async function signIn() {
  const db = client();
  const { user } = unwrap(await db.auth.signInWithPassword({ email, password }), "sign in");
  if (user.user_metadata?.demo !== true) fail("Refusing: this account is not labelled demo. Run --create for the demo account first.");
  return db;
}

async function counts(db) {
  const read = async (table) => {
    const result = await db.from(table).select("id", { count: "exact", head: true });
    if (result.error) fail(`count ${table} failed: ${result.error.message}`);
    return result.count ?? 0;
  };
  return { people: await read("people"), facts: await read("about_me_facts"), plans: await read("planned_conversations") };
}

async function reset(db) {
  const ids = async (table) => unwrap(await db.from(table).select("id"), `read ${table}`).map((row) => row.id);
  for (const id of await ids("planned_conversations")) unwrap(await db.rpc("planned_delete", { p_id: id }), "delete plan");
  for (const id of await ids("people")) unwrap(await db.rpc("person_delete", { p_id: id }), "delete person");
  for (const id of await ids("about_me_facts")) unwrap(await db.rpc("about_me_delete", { p_id: id }), "delete fact");
  const after = await counts(db);
  if (after.people || after.facts || after.plans) fail(`Reset left rows behind: ${JSON.stringify(after)}`);
  console.log("Reset: 0 people, 0 facts, 0 plans.");
}

async function seed(db) {
  const facts = [];
  for (const text of FACTS) facts.push(unwrap(await db.rpc("about_me_create", { p_text: text }), "add fact"));
  let jordan = unwrap(await db.rpc("person_create", JORDAN), "add Jordan");
  jordan = unwrap(await db.rpc("person_set_shared_facts", { p_id: jordan.id, p_expected_version: jordan.version, p_fact_ids: facts.map((f) => f.id) }), "share facts");
  const preset = await db.rpc("person_set_preset", { p_id: jordan.id, p_expected_version: jordan.version, p_preset: "manager" });
  if (preset.error) console.warn(`Jordan keeps the default face (${preset.error.message}).`);
  if (args.has("--checkin")) {
    const today = new Date().toLocaleDateString("en-CA");
    unwrap(await db.rpc("planned_set", { p_person_id: jordan.id, p_planned_on: today, p_label: "Ask Jordan to move one project", p_fear: null, p_likelihood_before: null }), "plan today");
  }
  const after = await counts(db);
  console.log(`Seeded: ${after.people} person, ${after.facts} facts shared with Jordan, ${after.plans} plan${after.plans === 1 ? "" : "s"}.`);
}

if (args.has("--create")) await create();
else {
  const db = await signIn();
  await reset(db);
  if (!args.has("--reset")) await seed(db);
  await db.auth.signOut();
}
