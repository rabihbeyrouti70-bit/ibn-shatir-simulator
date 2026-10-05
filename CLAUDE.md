# CLAUDE.md

## Language and style

- Always reply to the user in Arabic, in simple language. The user is not a programmer.
- The user's budget is limited: keep replies short.

## Delegating to Jules

Automated or clearly specified work is handed to Jules (Google's coding agent) by creating a GitHub issue with the label `jules`. Jules picks it up by itself and opens a PR.

### Creating the issue

The issue body is the complete spec. Include:

- **Files**: exact paths to change.
- **Task**: what must change and why.
- **Tests**: which tests to add or update (`npm test` runs `node --test tests/*.test.js`).
- **Closing instructions**: "Run the checks, open a PR to `main`, do not merge."

### When the PR arrives

1. Review the diff and the CI checks.
2. Write review notes as a **comment on the PR** (Jules reads it and fixes).
3. Subscribe to the PR to follow it.
4. Tell the user **not to merge** until the review is finished.
5. If it was merged with errors anyway, fix them in a follow-up PR.
