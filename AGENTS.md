# Repository Guidelines

## Project Layout

- `ai/` contains the Flask AI API and model training scripts.
  - `complete_api.py` is the Flask API entry point.
  - `train_*.py` and `the_traineew.py` are training scripts.
  - `models/` stores generated model artifacts and training outputs.
- `backend/` contains the NestJS API.
  - `src/modules/` is organized by feature module.
  - `src/common/` contains shared enums, guards, decorators, and JWT support.
  - `test/` contains e2e test configuration and specs.
- `mobile/` is reserved for the Flutter client; it is currently empty in this workspace.

## Common Commands

Run backend commands from `backend/`:

```bash
npm install
npm run start:dev
npm run build
npm run lint
npm run test
npm run test:e2e
```

Run AI commands from `ai/`:

```bash
pip install -r requirements.txt
python complete_api.py
```

If `ai/requirements.txt` is absent, inspect the imports in the target Python script before installing dependencies.

## Development Notes

- The backend is a NestJS app using Mongoose, JWT auth, class validation, and feature modules.
- The backend API is expected to run under the global `/api` prefix.
- The AI API is expected to run separately on port `5000`; the backend runs on port `3000`.
- MongoDB configuration is read from `.env`, especially `MONGODB_URI`.
- Keep generated model files, uploads, and large binary artifacts out of unrelated changes.
- Several files currently contain mojibake in comments or docs. Preserve behavior first; only clean encoding when the task explicitly asks for documentation/comment cleanup.

## Coding Style

- Follow existing NestJS module patterns: controller, service, DTOs, schemas/entities, and module wiring.
- Prefer typed DTOs with `class-validator` decorators for request inputs.
- Keep shared enums in `backend/src/common/enums/`.
- Use Mongoose schemas under feature-local `schemas/` directories when adding persisted backend models.
- Keep Python training/API changes local to the relevant AI script unless the API contract changes.

## Testing Guidance

- For backend changes, run `npm run build` and the most focused Jest test command available.
- Run `npm run lint` when touching TypeScript formatting, imports, or shared backend code.
- For AI changes, prefer a lightweight import/syntax check first; full model training is expensive and should only be run when explicitly needed.

## Git Safety

- The working tree may contain user edits. Do not revert or overwrite unrelated changes.
- Before editing a file, check whether it already has uncommitted changes and work with them.
- Avoid committing generated model outputs, uploads, dependency folders, or build artifacts unless the user explicitly requests it.
