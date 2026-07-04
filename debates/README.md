# QueryForge Development Records

This directory keeps curated public development notes for QueryForge. It is not a raw prompt archive.

The original internal debate transcripts, generated prompts, and vendor-specific scratch notes are intentionally excluded from the public repository. They were useful during development, but they contain obsolete implementation paths and private operational context that should not be part of the release surface.

## Public Records

- [codex/local-desktop-pivot.md](codex/local-desktop-pivot.md): product decision to make the local desktop app the real product path while keeping Railway as a stable QR demo.
- [codex/database-layer.md](codex/database-layer.md): current Olist SQLite data layer and validation notes.
- [codex/product-roadmap.md](codex/product-roadmap.md): product architecture direction for the desktop analytics harness.
- [codex/final-release-audit.md](codex/final-release-audit.md): public release audit summary.

## Boundary

Public materials should describe QueryForge as a local-first governed analytics harness that can connect to an OpenAI-compatible external model provider. They should not expose real API keys, private deployment metadata, obsolete local paths, or raw prompt transcripts.
