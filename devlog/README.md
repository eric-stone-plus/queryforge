# QueryForge Development Log

This directory keeps curated public development notes for QueryForge. It is not a raw prompt archive and does not include private prompts, API keys, deployment secrets, or vendor-specific scratch notes.

## Current Product Direction

QueryForge is a local-first ecommerce analytics toolkit for small ecommerce operators. The first finished tool is an order and business analytics workbench. The current desktop demo is packaged for macOS because the development machine is a Mac; the product direction can support prebuilt macOS and Windows binaries. The Railway URL is a public QR/mobile demo using the Olist case and stable cached answers.

The product is the first finished tool in a broader ecommerce operator toolkit:

- natural-language business questions
- read-only SQL generation and validation
- local database execution
- chart and explanation generation
- saved metrics and token usage tracking
- user-owned model provider credentials

## Public Records

- [codex/local-desktop-pivot.md](codex/local-desktop-pivot.md): product decision to make the local desktop app the real product path while keeping Railway as a stable QR demo.
- [codex/database-layer.md](codex/database-layer.md): current Olist SQLite data layer and validation notes.
- [codex/product-roadmap.md](codex/product-roadmap.md): product architecture direction for the desktop analytics harness.
- [codex/final-release-audit.md](codex/final-release-audit.md): public release audit summary.
- [devlog-20260704.html](devlog-20260704.html): curated development log and product pivot narrative.

## Roadmap Notes

- Complete local app flow: model service selection, BYOK credential entry, connection testing, token budget, natural-language Q&A.
- Keep public Railway demo as a polished mobile/QR experience, with cached Olist answers and no visitor key collection.
- Add import paths for owner-controlled ecommerce data: CSV, Excel, SQLite, and common platform exports.
- Move API key storage from local config JSON to the operating system credential store before commercial desktop distribution.
- Keep commercial positioning focused on small ecommerce operators, Canton Fair sellers, platform sellers, foreign-trade SOHO, and small trading companies.
- Treat legal/IP language as a boundary statement: QueryForge connects user-owned data to user-owned model accounts; users remain responsible for provider terms, third-party platform restrictions, personal data, and IP rights.

## Boundary

Public materials should describe QueryForge as a local-first ecommerce analytics workbench that can connect to user-selected model providers. They should not expose real API keys, private deployment metadata, obsolete local paths, or raw prompt transcripts.
