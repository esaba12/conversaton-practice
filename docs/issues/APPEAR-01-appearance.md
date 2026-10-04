# APPEAR-01: Stock face and premade voice per saved person

GitHub issue: [#37](https://github.com/esaba12/conversaton-practice/issues/37)

Who: coordinator plus up to one UI worker. **Do not start before the submission is sent** and the human schedules it. It is third in the docs/10 cut order.
Full contract: [docs/tasks/APPEAR-01-appearance.md](../tasks/APPEAR-01-appearance.md). Decision: docs/00 (October 3, 17:23 EDT).

## Summary

Today every call uses one configured face (`TAVUS_FACE_ID`), one voice (`ELEVENLABS_VOICE_ID`), and one PAL (`TAVUS_PAL_ID`). The goal is that a saved person can pick from a short server-owned catalog, and their next practice uses that stock face and premade voice.

## Work split once scheduled

1. **Coordinator, first:**
   - Check current Tavus docs on whether the replica (face) can vary per conversation on one PAL.
   - Create one PAL per distinct premade voice with identical roleplay settings, then read each back.
   - Freeze `appearancePreset` (a server-owned id list; unknown ids rejected) in `lib/schemas/people.ts` and write the migration adding the column, defaulting to today's pair.
   - Write the server map from preset id to replica and PAL ids, read from configuration and never sent to the browser.
2. **Coordinator or worker:**
   - `lib/media/tavus.ts` selects the mapped ids for a saved-person start. Reviewed-role and example starts keep the default.
   - `lib/data/person-context.ts` loads the preset.
3. **UI worker:**
   - Add a picker to `components/presentation/people-editor.tsx` with human labels ("warm, lower voice"), never provider ids.
   - Add no upload control and no cloning control.

## Acceptance (from the task record)

- [ ] A saved-person start uses the stored preset. Other starts keep the default.
- [ ] User B cannot set or read A's preset (two-user script check).
- [ ] Unit tests cover the id mapping and that the start body is still person id + version only.
- [ ] One live call with a non-default preset is a human check.
- [ ] docs/00, 02, 06, and 26 are updated.
