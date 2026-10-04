# Public product preview

Live: https://conversation-practice-site.vercel.app

A small static landing page requested for the AWS credits application. It describes SpeakEasy, the voice rehearsal product, and clearly labels it in development. No account, microphone, model, or database integration is exposed.

The future app follows Next.js/TypeScript, required sign-in, ElevenLabs, and Supabase Auth/PostgreSQL. The user subsequently abandoned AWS credits as a build dependency. This standalone marketing page remains useful and does not pass G1.

## Deployment

Vercel project: `conversation-practice-site`, scope `ethans-projects-656fcd50`.
Deploy only this directory from the repository root:

```bash
npx vercel deploy website --yes --prod --scope ethans-projects-656fcd50 --project conversation-practice-site
```

No install/build step or runtime dependencies. The HTML, stylesheet, and favicon are self-contained. `vercel.json` applies static-only security headers, including disabled microphone access; do not copy that policy onto the future voice app. Local `.vercel` metadata is ignored. Automatic Git deployment has not been configured.

## Verification on October 3, 2026

- Production deployment returned `READY`, deployment `dpl_4xBmpVg8N4yQKNXHJnvU5hVceVbe`.
- Unauthenticated HTTPS request to the public alias returned 200.
- Downloaded HTML/CSS/favicon exactly matched local source; expected CSP header was present.
- HTML anchor/heading checks and JSON deployment configuration checks passed.
- Configured browser discovery returned no browsers. Local preview server was blocked by sandbox port-binding restrictions; no rendered visual/browser inspection is claimed.

App auth/database/audio integration remains unimplemented. This page's existence does not establish AWS credit eligibility.
