# GH-01: Close GitHub issue #6

Who: any agent with `gh` write access, or the human in the GitHub UI. Priority: low. Five minutes.

## Problem

[Issue #6](https://github.com/esaba12/conversaton-practice/issues/6) ("PREP-02: Public product website deployed for credits application") is the only open issue. Its one unchecked item, "Commit source and deployment notes to the repository", is done. `website/` and `docs/tasks/PREP-02-public-website.md` are on `main`, added in `4dc34a1`.

## Steps

1. Confirm: `git ls-files website docs/tasks/PREP-02-public-website.md` lists the files on `main`.
2. Comment on #6: source and the task record are on `main` (commit `4dc34a1`); the static preview at https://conversation-practice-site.vercel.app stays separate from the authenticated app. Then close it as completed:
   `gh issue close 6 --repo esaba12/conversaton-practice --comment "<that text>"`
3. No file changes and no PR are needed.

## Acceptance

- [ ] #6 is closed with a comment that names the commit.
- [ ] The comment does not describe the static preview as the practice app.
