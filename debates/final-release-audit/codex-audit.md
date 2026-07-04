# QueryForge Final Audit

Date: 2026-07-05

## Result

Final deliverables are aligned to the current QueryForge version:

- Product positioning: Track C / Business on AI, governed self-service business analytics.
- Dataset: Kaggle Olist Brazilian E-Commerce Public Dataset.
- Live demo: `https://queryforge-production-8d6f.up.railway.app/`.
- Deployment: Railway deployment `46b38724-7236-4bda-9361-601e517508cd` is `SUCCESS` and online.

## Railway Verification

Verified after `railway up`.

- Homepage title: `QueryForge — 受治理的自助式商业分析层`.
- Old homepage title/positioning copy is absent.
- `/api/query` Olist checks:
  - regions: `Sudeste`, `Sul`, `Nordeste`, `Centro-Oeste`, `Norte`
  - orders: `99,441`
  - revenue: `16008872.12`
- `/api/query` semicolon SELECT check now succeeds:
  - input: `select name from regions order by id;`
  - output includes all five Olist regions.

## QR And Mobile

- `assets/qr-railway.png` decodes to `https://queryforge-production-8d6f.up.railway.app/`.
- Embedded PPT QR image also decodes to the same URL.
- Mobile screenshot was rendered at 390 x 844 CSS viewport, 2x output.
- First screen shows:
  - new product subtitle
  - Olist KPI rail
  - `问数 / 看板` toggle
  - natural-language query entry and preset questions
- No old homepage text appeared in the rendered mobile HTML.

## PPT

File: `assets/QueryForge-Pitch.pptx`

- 10 slides.
- Final slide includes visible QR code and Railway URL.
- Last slide was rendered to PNG via LibreOffice/PDF conversion; QR is visible and not overlapping text.
- OOXML text extraction found no hits for old region/channel wording, old model/provider names, old data-generation wording, teammate wording mistakes, or old score estimate wording.

## Speaker Notes

File: `assets/speaker-notes.docx`

- Uses dual-speaker split:
  - `Mavis｜商业叙述`
  - `Eric｜开发阐述`
  - `Mavis｜收束`
- Business section uses researched BI language: managed self-service BI, governed data, speed to insight, semantic layer, single version of truth.
- Render QA completed with LibreOffice: 3 pages rendered to PNG and reviewed.
- Text extraction found no old-region, model, or obsolete data-source residue.

## Residue Scan

Public/current scope scanned:

- `README.md`
- `src/`
- `scripts/`
- `assets/` text-bearing artifacts and Office text extraction
- `docs/`
- `desktop/`
- `package.json`, `package-lock.json`
- `debates/README.md`, `debates/task-*.md`
- `criteria/scoring-criteria.md`
- `criteria/scoring-criteria.html`

Search categories included old Chinese region/channel wording, concrete model/provider names, old synthetic-data wording, incorrect teammate wording, old track labels, old score-estimate wording, old homepage titles, and duplicated region labels.

Remaining expected hit:

- `criteria/scoring-criteria.html` contains an imported scoring-reference header for the original event rubric. This is kept as source/reference material, not QueryForge final positioning. QueryForge-facing strategy in the same file has been updated to Track C / Business on AI.

Historical archives:

- `debates/quinte/round*` retains old discussion logs and migration history intentionally. Those files are process evidence, not final deliverables.
- `criteria/hackathon-rules.*` retains the full original event rules, including all track definitions.

## Database

Local SQLite database verification:

- `regions`: `Sudeste,Sul,Nordeste,Centro-Oeste,Norte`
- `orders`: `99,441`
- `revenue`: `16008872.12`
- channels:
  - `Cartão de Crédito`: `75,391`
  - `Boleto`: `19,784`
  - `Voucher`: `2,739`
  - `Cartão de Débito`: `1,527`
- `VACUUM` was run to remove obsolete SQLite page residue.

## Security And Build

- `npm audit --json`: 0 vulnerabilities.
- `npm run lint`: passed. Note: Next warns `next lint` is deprecated for Next 16.
- `npm run build`: passed on Next `15.5.20`.
- Runtime SQL route now normalizes trailing semicolons before injecting default `LIMIT`.
- Dependencies cleaned; unused old provider/data-generation packages removed.

## Skill Check

GitHub curated skill list was checked. Relevant skills found and installed:

- `playwright`
- `screenshot`

Codex restart is required before those newly installed skills appear in the available skill list.
