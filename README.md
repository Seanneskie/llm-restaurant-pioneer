# LLM Restaurant Finder

Project Description

This service turns free‑form restaurant requests into structured, validated queries against the Foursquare Places API and returns normalized JSON results. It exposes a single GET endpoint you can hit from a browser or curl. The system uses an LLM to convert user text into a strict JSON command (validated with Zod), maps that command to Foursquare parameters, fetches results (with optional details enrichment), and standardizes the output fields for a consistent client experience. The implementation uses Hono for HTTP routing and Google Gemini for the LLM step, but the LLM is swappable.


## Overview
- Server: Hono app exposing `GET /api/execute?message=...&code=...`.
- LLM parse: `@google/genai` converts user text into a strict command (validated by Zod).
- Places data: Foursquare Places v3 (`/places/search` and `/places/{id}`) with typed responses.
- Normalization: Maps Foursquare fields into a compact, consistent shape for the client.

Key files:
- `server/server.ts`: HTTP endpoints and error handling.
- `llm/parser.ts`: Gemini prompt + JSON schema + Zod validation.
- `llm/schema.ts`: Strong types for the command the LLM must output.
- `fourspace/client.ts`: Typed, headered calls to Foursquare Places v3.
- `fourspace/map.ts`: Query param mapping and result normalization.
- `utils/errors.ts`: Centralized error → HTTP JSON mapping.


## Task Overview
Build an LLM‑Driven Restaurant Finder API that:
- Converts a natural‑language message into a structured JSON command using an LLM.
- Uses that command to query the Foursquare Places API for restaurant data.
- Exposes a GET endpoint viewable in a browser; access requires a `code` parameter.

Example workflow:
- User input: "Find me a cheap sushi restaurant in downtown Los Angeles that's open now and has at least a 4‑star rating."
- LLM conversion (example matching this repo’s schema):
  ```json
  {
    "action": "search_restaurants",
    "parameters": {
      "query": "sushi",
      "near": "downtown Los Angeles",
      "price": "1",
      "open_now": true,
      "min_rating": 4
    }
  }
  ```
- Downstream call: The JSON command is mapped to Foursquare parameters (including price and open_now), then `/places/search` (and selective details) is called.
- Display: The GET endpoint returns normalized JSON (no UI).


## Quick Start
1. Copy env and set keys:
   - `cp .env.example .env` and fill `GEMINI_API_KEY`, `FSQ_API_KEY`, `API_CODE`.
2. Install deps:
   - `npm install`
3. Run in dev (uses `tsx`):
   - `npx tsx watch api/execute.ts` (or `npm run dev` if you have `tsx` installed)
4. Call the API:
   - `curl "http://localhost:3000/api/execute?code=YOUR_CODE&message=Find sushi near Soho open now"`


## Local Deployment
- Development
  - Copy `.env.example` to `.env` and fill values (see Environment).
  - Install: `npm install`
  - Run: `npx tsx watch api/execute.ts`
  - Test: open `http://localhost:3000/api/execute?code=<your_code>&message=Best%20pizza%20near%20Brooklyn%20open%20now`
- Production
  - Build: `npm run build`
  - Start: `npm start` (reads `.env`; uses `PORT` or `3000`).


## Environment
- `GEMINI_API_KEY`: Google Gemini API key for parsing.
- `FSQ_API_KEY`: Foursquare Places v3 API key (Bearer token).
- `API_CODE`: Simple shared secret for `GET /api/execute`.
- `NODE_ENV`: `development` or `production`.
- `PORT` (optional): Port for local server, defaults to `3000`.

Access Code Requirement

To match the requirement "the user must provide a `code` parameter `pioneerdevai`": set `API_CODE=pioneerdevai` in your `.env`, then call the API with `?code=pioneerdevai`.


## API
- `GET /api/execute?code=<secret>&message=<free text>`
  - Parses `message` into a command, converts to Places params, fetches search + details, filters/normalizes, returns JSON.


## Challenges & Solutions
- Deprecated Foursquare endpoints
  - Problem: Older Foursquare APIs and parameters are deprecated/changed.
  - Solution: Moved to Places v3 with explicit versioning and headers.
    - Base: `https://places-api.foursquare.com/`
    - Endpoints: `/places/search`, `/places/{fsq_id}`
    - Headers: `Authorization: Bearer <FSQ_API_KEY>`, `Accept: application/json`, `X-Places-Api-Version: 2025-06-17`.
    - Code: `fourspace/client.ts` builds URLs via `URL`/`URLSearchParams` and sets required headers.
  - Outcome: Stable requests, predictable responses, easier typing.

- Unable to use GPT for code generation
  - Problem: Restrictions prevented using GPT for command extraction.
  - Solution: Switched to Google Gemini (`@google/genai`) with a response JSON schema and Zod validation.
    - Code: `llm/parser.ts` defines a JSON schema for the LLM, enforces `responseMimeType: application/json`, then parses and validates with `llm/schema.ts`.
  - Outcome: Deterministic, typed command objects without GPT dependencies.

- URL headers and common URL errors
  - Problem: Auth/accept headers missing or malformed URLs caused 401/415/400.
  - Solution: Centralized header builder and safe URL construction.
    - Headers: `authHeaders()` in `fourspace/client.ts` returns the exact header set required by Places v3.
    - URLs: `new URL()` + `url.searchParams.set(...)` ensure proper encoding; IDs are `encodeURIComponent`’ed.
  - Outcome: Fewer request failures and easier debugging when upstream returns errors.

- Typing and validation (Foursquare expects specific types)
  - Problem: Inputs like `price`, `open_now`, and coordinates arrive as strings or informal text that the API rejects.
  - Solution: Zod schemas and preprocessors coerce/normalize into the exact types Places expects.
    - `llm/schema.ts`: `z.coerce.number()` for lat/lon and limits; `normalizePrice()` maps `$`, ranges, and words to `"1".."4"`.
    - `fourspace/map.ts`: Converts command into Foursquare params and caps limits/radius; `priceToMinMax()` expands `price` to `min_price`/`max_price`.
  - Outcome: Clean, validated requests; fewer 400 errors from the provider.


## Common Pitfalls (and how this repo avoids them)
- Missing headers: Always send `Authorization`, `Accept: application/json`, and `X-Places-Api-Version`.
- Malformed query strings: Use `URL`/`URLSearchParams`; never hand‑concat strings.
- Unencoded IDs: Wrap IDs with `encodeURIComponent` when building path segments.
- Wrong types: Coerce booleans/numbers (`z.coerce.*`) and normalize enums before calling upstream.
- Inconsistent response shapes: Normalize with `fourspace/map.ts` (e.g., hours can be object or array).


## Error Handling
- All route errors funnel through `app.onError` in `server/server.ts` and serialize via `utils/errors.ts`.
- Upstream failures include HTTP status, text body where available, to aid debugging.


## Limitations
- LLM variability: Even with schema guidance, models can occasionally output invalid or incomplete JSON; Zod validation guards this but may reject some inputs.
- Upstream data gaps: Ratings, price levels, or hours may be missing; normalization fills with placeholders.
- Open‑now semantics: Foursquare hours can vary by venue/timezone; `open_now` is best‑effort and may not reflect latest changes or special hours.
- Rate limits and quotas: The Foursquare API enforces quotas; heavy usage or details enrichment across many results may hit limits.
- Latency: Enrichment calls fetch details for top results; larger limits increase response time.
- No caching/persistence: Responses are live per request; consider adding caching for production.
- Basic auth model: A shared `code` query param is not suitable for multi‑user or public deployment; use proper auth for production.
- Model/provider choice: This repo uses Gemini; swapping to another provider (e.g., OpenAI) is straightforward but requires adapting the client and schema enforcement.


## License
MIT (see `LICENSE` if present).

