# Codex Product Decision Memo: Local Desktop Pivot

## Decision

QueryForge should be positioned as a local desktop analytics harness/workbench, not as a hosted BI product. The online Railway deployment remains useful, but only as a phone/QR demo surface for review, pitching, and asynchronous inspection.

## Honest Product Boundary

- Railway stays as a convenience demo using the Olist demo case, stable preset questions, and cached answers.
- The real product path is the local desktop app.
- Users bring their own structured data, API token, token plan, and OpenAI-compatible external model provider.
- Public copy should not name a specific model vendor. The correct framing is "external model provider" or "OpenAI-compatible provider."

## Why This Pivot Matters

The product value is not the model call itself. QueryForge is the harness around the model:

- schema exposure is controlled
- generated SQL is validated before execution
- database access is read-only
- query size is bounded with LIMIT behavior
- reports are grounded in executed SQL results
- credentials remain local
- token spending has an explicit plan
- schema, SQL, result, token, and report artifacts form an audit boundary

## Demo Strategy

Railway should remain stable and boring. Its job is to make the product inspectable from a phone or QR code without relying on live external-model behavior during a pitch. Olist is appropriate here because it is public, reproducible, and rich enough to show regional, category, payment, and repeat-purchase analysis.

## ROI Story

The business case is:

- reduced analyst time spent on repetitive SQL, charting, and explanation loops
- controlled token spend through preset metrics, caching, LIMIT behavior, and a user-owned token plan
- reusable governed metrics that make analysis repeatable instead of one-off

## Documentation Implication

README and devlog copy should keep the demo boundary explicit: hosted demo for convenience, desktop app for real usage. They should avoid vendor-specific public model names while making it clear that real OpenAI-compatible API calls happen from the local app under local credentials and audit controls.
