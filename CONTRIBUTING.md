# Contributing

Thanks for helping improve API Spend Guard.

## Workflow

- Branch from `main` using GitHub Flow:
  - `feat/<name>`
  - `fix/<name>`
  - `docs/<name>`
- Use Conventional Commits:
  - `feat: ...`, `fix: ...`, `docs: ...`, `chore: ...`, `refactor: ...`

## Pull Requests

- Keep PRs focused and small.
- Include tests or verification notes.
- Update docs for behavior or setup changes.

## Local Safety Rules

- Never use production keys in local development.
- Use `.env.example` to create `.env.local`.
- For database work, prefer Supabase local CLI (`supabase start`, `supabase db push`).

## CI

PRs are validated by GitHub Actions (`lint`, `test`, `build` when available).
