# AGENTS.md

## Release workflow

- Never push `master` directly. Releases go through a version branch:
  1. Create a version branch (e.g. `v1.4.1`) and commit the changes there.
  2. Bump the version with `npm version <x.y.z> --no-git-tag-version` (runs `version-bump.mjs`, which updates `manifest.json` and `versions.json`; also commit `package-lock.json`).
  3. Push the branch and merge it into `master` via a pull request — do not merge locally and push `master`.
  4. Publish the GitHub release from the merged result (`gh release create <x.y.z> main.js manifest.json styles.css` after `npm run build`).

## Build and test

- `npm run build` — type-check (`tsc -noEmit -skipLibCheck`) and bundle with esbuild.
- `npm test` — vitest suite in `src/*.test.ts`.
- `main.js` is a gitignored build artifact; it is only attached to GitHub releases.
