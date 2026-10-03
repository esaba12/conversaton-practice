# Design and AWS direction

Updated October 3, 2026. Product decisions below are confirmed; named AWS services are the recommended implementation path, not provisioned resources.

## Confirmed decisions

- Warm and minimal, with crisp modern styling.
- Sign-in is the basis of the entire product. Users authenticate before designing personas/conversations, generating setups, or practicing. No guest workspace.
- The user has AWS credits and cannot add another Supabase database. Use AWS for the database; prefer AWS hosting where practical.
- Live ElevenLabs roleplay and server-only OpenAI setup/reflection remain the selected model/provider approach. AWS credits do not themselves authorize replacing either provider.

## Design proposal

The signed-in home should open with “What conversation would you like to practice?” and a prominent situation input. Place three short preset links underneath. Keep saved personas and preferences in quiet secondary navigation. The account control remains visible.

| Element | Proposed treatment |
| --- | --- |
| Page | Warm ivory `#F7F5F0` |
| Surface | Near-white `#FFFEFB` |
| Primary text | Ink `#232A28` |
| Secondary text | Warm gray `#626963` |
| Primary action | Deep sage `#345A49` with near-white text |
| Borders | Soft neutral `#DDDCD5`; stronger focus outline |
| Typography | Clear sans-serif; medium-weight headings and readable body text |
| Shapes | 12-16px corners, thin borders, restrained shadows |
| Spacing | Consistent 8px rhythm, generous space between decisions |

These are proposed tokens, not a rendered or accessibility-tested interface. Verify contrast, focus, keyboard use, and mobile layout during implementation. Use a slightly compact heading scale and plain labels to keep the design crisp. Avoid pervasive pill shapes and ornamental gradients.

Flow: sign in → describe situation → review/edit fictional counterpart → live practice → optional reflection/memory approval → finish. Persona review puts “What the character knows” and “Private preparation” in separate clearly labeled sections. Practice emphasizes the goal, listening/speaking status, mute, and a persistent End button. Keep captions optional and collapsed.

## Recommended AWS path

| Layer | Recommendation | Reason |
| --- | --- | --- |
| Identity | Amazon Cognito user pool | Managed account sign-in and validated tokens |
| Database | Aurora PostgreSQL Serverless v2 with RDS Data API | Relational schema and transactions with HTTPS access from server code |
| Hosting | AWS Amplify Hosting, subject to Next.js compatibility check | Managed Next.js deployment and an SSR IAM compute role |
| Secrets | AWS Secrets Manager and narrowly scoped runtime IAM role | Server-side provider/database credentials |
| Voice | ElevenLabs Agents | Existing core product choice |
| Setup/reflection | Existing OpenAI structured-output adapter | Existing core product choice |

AWS describes [Cognito user pools](https://docs.aws.amazon.com/cognito/latest/developerguide/what-is-amazon-cognito.html) as an identity service that can issue application JWTs. Use a maintained OIDC integration and server sessions; exact library and account login methods remain to be chosen before implementation. No custom password storage.

The [RDS Data API](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/data-api.html) offers SQL over HTTPS without maintaining database connections and uses database credentials in Secrets Manager. It supports [transactions](https://docs.aws.amazon.com/rdsdataservice/latest/APIReference/API_BeginTransaction.html). Combining it with Amplify's [SSR compute IAM role](https://docs.aws.amazon.com/amplify/latest/userguide/amplify-SSR-compute-role.html) is our proposed integration, not a verified deployment. Verify engine/region availability, privileges, migrations, transaction behavior, and owner isolation before accepting it.

The smaller compute size of a conventional RDS PostgreSQL instance is another option. Choose it only with a concrete hosting/networking path: a private database needs private connectivity. For example, [App Runner VPC egress](https://docs.aws.amazon.com/apprunner/latest/dg/network-vpc.html) requires an internet egress route to reach external providers. This adds infrastructure work compared with the proposed HTTPS database adapter.

## Hosting compatibility and cost

AWS's current [Amplify support page](https://docs.aws.amazon.com/amplify/latest/userguide/ssr-amplify-support.html) lists Next.js 12-15 and excludes Next.js streaming. Do not scaffold an unverified newer version and promise native Amplify support. Choose the current patched supported version, or a different verified AWS deployment path, before scaffold. Next DevTools MCP is deferred if Next.js 15 is selected, because its runtime features require 16+.

Voice audio travels directly between browser and ElevenLabs; the hosting layer issues session credentials and handles bounded JSON setup/reflection requests. It does not proxy continuous audio.

[Aurora auto-pause](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2-auto-pause.html) can reduce idle compute on supported versions, but resume adds latency and does not remove storage/other charges. Keep the demo database ready during judging. No price estimate or credit eligibility has been verified for this account. AWS credits apply only to designated [eligible services](https://aws.amazon.com/awscredits/); do not assume they pay direct ElevenLabs/OpenAI invoices.

## Database boundary

Retain the existing profiles, personas, scenarios, sessions, reflections, memory_proposals, and deletion_jobs schema. Add a small users mapping from validated auth issuer/subject to an internal UUID. The browser never selects the owner_id and never connects directly to Postgres.

Every application read/write checks ownership; PostgreSQL RLS adds defense in depth with a restricted runtime role. Owner context is transaction-local, including for Data API requests. Test this with two real signed-in identities; login alone does not prove isolation. Approval checks ownership and expected version, then updates target/proposal atomically. Unapproved proposals and synthetic character claims never become facts.

Account records and minimal authorization/cleanup metadata exist even when practice saving is disabled. Raw audio/transcripts are not stored by the app by default. Private notes stay transient unless explicitly saved. Deletion retains only the metadata required to finish truthful provider cleanup.

## Next implementation step

Finish tooling activation, verify AWS application access/region and ElevenLabs access, then implement one authenticated G1 voice slice. Authentication is a prerequisite to all user workspace flows. G1 includes minimal durable identity/session/cleanup records for ownership and concurrency. G2 adds actual generated setup. G3 adds saved domain tables and transactional memory. Follow [the parallel task workflow](19-AGENT-WORKFLOW.md): shared foundation first, then isolated auth/session, voice, and UI tasks, then combined verification. No infrastructure has been created, and no browser/audio/database integration has been tested yet.
