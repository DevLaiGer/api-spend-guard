# Repository Maintenance (COSS)

This document defines the lean maintenance strategy for running API Spend Guard as commercial open-source software.

## 1) Branching Strategy: GitHub Flow

- `main` is production and must stay deployable.
- All work ships through short-lived branches from `main`.
- Branch naming:
  - `feat/<name>` for features
  - `fix/<name>` for bug fixes
  - `docs/<name>` for documentation

This aligns with Vercel preview deployments and keeps release flow simple.

## 2) Commit Standard: Conventional Commits

Use Conventional Commits for all merges:

- `feat: add Discord webhook routing`
- `fix: handle 429 retry with backoff`
- `chore: upgrade next dependency`
- `refactor: simplify sync run lifecycle`
- `docs: update setup instructions`

Why:

- easier review at a glance
- better release notes and changelog automation later
- clear signal of change type for maintainers

## 3) PR and Issue Hygiene

Use templates in `.github/` to enforce minimum quality:

- `ISSUE_TEMPLATE.md` captures bug details and repro info
- `PULL_REQUEST_TEMPLATE.md` enforces local testing and docs updates

This reduces back-and-forth with contributors and shortens review cycle time.

## 4) Automation Policy

CI runs on pull requests:

- install dependencies (when available)
- run lint (when script exists)
- run tests (when script exists)
- run build (when script exists)

Dependency automation:

- Dependabot checks weekly for npm and GitHub Actions updates.

## 5) Branch Protection Policy (Manual GitHub Setting)

Configure branch protection for `main`:

- require pull request before merge
- require at least one approving review
- require status checks to pass before merge
- disallow force-push to `main`

## 6) Release Policy (SemVer)

Use Semantic Versioning for tagged releases:

- patch: `v1.0.1` for bug fixes
- minor: `v1.1.0` for backward-compatible features
- major: `v2.0.0` for breaking changes

Publish release notes in GitHub Releases with user-facing impact summary.

## 7) Practical Rule for This Sprint

Optimize for speed without sacrificing production safety:

- avoid heavy workflows (no GitFlow, no long-lived release branches)
- keep `main` stable
- automate repetitive checks
- keep contributor path simple and documented
