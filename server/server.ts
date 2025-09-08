import { Hono} from "hono";
import { parseToCommand } from "../llm/parser.js";
import { toFsqParams, normalizePlace } from "../fourspace/map.js";
import { searchPlaces, getPlaceDetails } from "../fourspace/client.js";
import { HttpError } from "../utils/errors";
import { logInfo } from "../utils/log";
import "dotenv/config";

const ENRICH_LIMIT = 12;

const app = new Hono();

app.get("/", (c) =>
  c.json({ ok: true, hint: "api/execute?message...&code=pioneerdevai" })
);

app.get("/api/execute", async (c) => {
  const code = c.req.query("code");
  const message = c.req.query("message");

  if (code !== process.env.API_CODE) {
    throw new HttpError(401, "Unauthorized: invalid code");
  }

  if (!message) throw new HttpError(400, "Bad Request: message is required");

  const start = Date.now();
  const cmd = await parseToCommand(message);
  const fsqParams = toFsqParams(cmd);
  const search = await searchPlaces(fsqParams);

  const top = (search.results ?? []).slice(0, ENRICH_LIMIT);
  console.log(search.results);
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
