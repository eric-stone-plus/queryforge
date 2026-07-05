# QueryForge Product Roadmap

## Position

QueryForge is a local-first commercial analytics harness. It is not another model and not a hosted BI clone. The product value is the controlled runtime around an external model provider:

- local credentials
- local or customer-controlled data connection
- governed schema and metric context
- SQL validation and read-only execution
- result-grounded business explanation
- token plan and usage accounting
- auditable query artifacts

Railway remains a stable phone/QR demo surface. The desktop app is the real product path.

## Near-Term Product Shape

1. **Desktop analytics IDE**
   - Start a local service from the macOS app.
   - Bundle the Olist demo database for offline inspection.
   - Let users configure their own OpenAI-compatible provider locally.
   - Keep API keys out of the public repo and out of hosted demo storage.

2. **Harness controls**
   - Enforce single-statement `SELECT`.
   - Apply default `LIMIT`.
   - Block wildcard projections and sensitive demo columns.
   - Execute through read-only SQLite credentials.
   - Send only bounded query results into answer synthesis.

3. **Token plan**
   - Store monthly token budget locally.
   - Estimate or record model token usage per request.
   - Show remaining budget and usage percentage in the app.
   - Make ROI visible as saved analyst time versus controlled model spend.

4. **Reusable metrics**
   - Keep saved metrics as repeatable assets.
   - Use certified metric definitions before raw table guessing.
   - Move toward a semantic catalog when adding real business data sources.

## Production Direction

A production version should split responsibilities into clear layers:

- workspace and role management
- semantic catalog and metric definitions
- agent orchestration
- SQL policy and safety engine
- query execution adapter
- result analysis layer
- audit and evaluation logs

The model is not the security boundary. Policy, permissions, query execution, and audit are the security boundary.

## Demo Strategy

The public hosted demo should be predictable and safe:

- Olist public data only
- stable preset questions
- cached answers for phone scanning
- no visitor API-key storage
- no reliance on live external-model behavior

The local desktop demo should show the complete product:

- real external model API calls
- local API-token configuration
- token budget tracking
- governed SQL generation
- result-grounded follow-up analysis
