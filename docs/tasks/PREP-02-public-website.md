# PREP-02: Publish a quick public product website

Status: review — publicly deployed; source commit pending
Updated: October 3, 2026, America/Detroit
Assigned writer/coordinator: `/root`
Read-only preflight: `/root/site_deploy_check`
Gate: user-requested credits-application preparation; no G1 gate pass
GitHub issue: [#6](https://github.com/esaba12/conversaton-practice/issues/6)

## Scope and ownership

- User explicitly requested a skeleton website and a quick public link for AWS credits.
- Owned: `website/`, `.gitignore`, relevant README/STATUS handoff.
- Starting revision: `ec919a5`, main tracking origin/main. Website source was deployed from the working tree.
- This is a public product preview with no workspace or provider integration. The application stack/authentication requirements remain unchanged.

## Result and evidence

- Live URL: https://conversation-practice-site.vercel.app
- Command: `npx vercel deploy website --yes --prod --scope ethans-projects-656fcd50 --project conversation-practice-site`.
- Outcome: live/pass for public static hosting; Vercel returned READY for `dpl_4xBmpVg8N4yQKNXHJnvU5hVceVbe`.
- Public unauthenticated curl requests for `/`, `/styles.css`, and `/favicon.svg` succeeded; homepage HTTP 200, downloaded files byte-identical to source, CSP header present.
- Static/pass: one H1, valid internal anchors/assets, JSON configuration, and visible development/concept-preview labels. No scripts, forms, or audio capture.
- Browser inspection: blocked; configured runtime returned no browsers. Local HTTP server port binding was denied. No visual/browser test pass is claimed.
- Initial deploy found no project; created the new Vercel project, then deployed successfully. No existing application was overwritten.

## Handoff

Public site is ready to share. Source/README/STATUS changes await commit from an environment permitted to write Git metadata. Deployment instructions are in [website README](../../website/README.md). Future implementation resumes at G1-00 / GitHub issue #1 after preflight, not at a passed live-voice gate. Do not claim credit approval or live application functionality from this static page.
