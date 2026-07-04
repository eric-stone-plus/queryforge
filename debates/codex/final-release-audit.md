# QueryForge Public Release Audit

Date: 2026-07-05

## Result

The public release surface now follows the current product direction:

- Product: local-first desktop analytics harness/workbench.
- Hosted demo: Railway phone/QR demo with public Olist data and stable cached answers.
- Dataset: Kaggle Olist Brazilian E-Commerce Public Dataset.
- Privacy boundary: no real API keys, no local settings file, and no private deployment metadata in tracked files.

## Desktop Build

The macOS desktop app was built locally:

- `QueryForge.app`
- `desktop/dist/QueryForge-macOS-x86_64.zip`

The bundled service was smoke-tested directly:

- `/api/health` returned `status: ok`.
- `/api/query` returned `99,441` orders.
- `/api/query` blocked the synthetic `email` column.
- `/api/chat` returned cached Olist demo output when no local model provider was configured.

## Hosted Demo Boundary

Railway remains useful for a phone scan or quick judge inspection. It should be treated as a public demo surface:

- no visitor API-key storage
- no hosted write access to model settings
- no private data source
- no dependence on live provider behavior for the scripted demo path

## Privacy Checks

Release scanning focused on:

- real API keys and key-like strings
- `.env` and local settings files
- private deployment identifiers
- obsolete local paths
- vendor-specific scratch notes
- old synthetic-data region names
- raw prompt/task archives

The raw internal debate archive was removed from the public tree. Curated development records remain under `debates/codex/`.

## Remaining Expected Public References

- `.env.example` contains placeholder variable names only.
- README links to the Railway demo URL because QR/mobile inspection is an intended public demo path.
- `assets/speaker-notes.docx` and `assets/QueryForge-Pitch.pptx` are final presentation artifacts, not internal prompts.
