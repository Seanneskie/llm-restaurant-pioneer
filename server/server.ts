import { Hono} from "hono";
import { parseToCommand } from "../llm/parser.js";
import { toFsqParams, normalizePlace } from "../fourspace/map.js";
import { searchPlaces, getPlaceDetails } from "../fourspace/client.js";
import { HttpError, toHttpJson } from "../utils/errors.js";
import { logInfo } from "../utils/log.js";
import { loadEnv } from "../utils/env.js";

const ENRICH_LIMIT = 12;

const app = new Hono();

// JSON-only error handling
app.onError((err, c) => {
  const { status, body } = toHttpJson(err);
  return c.json(body, status);
});

// JSON-only 404
app.notFound((c) => c.json({ error: "NotFound", message: "Route not found" }, 404));

app.get("/", (c) =>
  c.json({ ok: true, hint: "api/execute?message...&code=code" })
);

app.get("/api/execute", async (c) => {
  // Validate env on each request to fail fast with a clear error
  const { API_CODE } = loadEnv();
  const code = c.req.query("code");
  const message = c.req.query("message");

  if (code !== API_CODE) {
    throw new HttpError(401, "Unauthorized: invalid code");
  }

  if (!message) throw new HttpError(400, "Bad Request: message is required");

  const start = Date.now();
  logInfo({ path: "/api/execute", stage: "start", have_message: Boolean(message) });
  const cmd = await parseToCommand(message);
  const fsqParams = toFsqParams(cmd);
  const search = await searchPlaces(fsqParams);

  const top = (search.results ?? []).slice(0, ENRICH_LIMIT);
  const detailed = await Promise.all(
    top.map(async (place) => {
      const id = (place as any).fsq_id ?? (place as any).fsq_place_id;
      if (!id) return place;
      try {
        return await getPlaceDetails(id); // now has default rich fields
      } catch {
        return place; // fall back to search doc
      }
    })
  );
  const ratingMin = cmd.parameters.min_rating ?? null;
  const wantOpen = cmd.parameters.open_now ?? null;

  let results = detailed.map(normalizePlace);
  if (ratingMin != null) {
    results = results.filter(
      (r) => typeof r.rating === "number" && r.rating >= ratingMin
    );
  }


  const took_ms = Date.now() - start;
  logInfo({
    path: "/api/execute",
    took_ms,
    query: cmd.parameters.query,
    results: results.length,
  });

  return c.json({
    query: cmd,
    fsqParams: fsqParams,
    results,
    meta: { count: results.length, enriched: detailed.length, took_ms },
  });
});




export default app;
