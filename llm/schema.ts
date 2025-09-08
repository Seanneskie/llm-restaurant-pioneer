import { z } from "zod";

const LocationSchema = z.object({
  latitude: z.coerce.number().gte(-90).lte(90),
  longitude: z.coerce.number().gte(-180).lte(180),
});

function normalizePrice(input: unknown): "1" | "2" | "3" | "4" | undefined {
  if (input == null) return undefined;
  const s = String(input).trim().toLowerCase();

  // already good
  if (/^[1-4]$/.test(s)) return s as any;

  // numbers like 1..4
  if (/^[1-4]$/.test(String(Number(s)))) return String(Number(s)) as any;

  // csv or ranges → pick the first / lowest
  const mCsv = s.match(/^[1-4](?:,[1-4])*/);
  if (mCsv) return mCsv[0].split(",")[0] as any;
  const mRange = s.match(/^([1-4])\s*-\s*([1-4])$/);
  if (mRange) return mRange[1] as any;

  // $… → length
  if (/^\$+$/.test(s)) return String(s.length) as any;

  // words
  if (/(cheap|budget|inexpensive|low)/.test(s)) return "1";
  if (/(mid|moderate)/.test(s)) return "2";
  if (/(expensive|premium)/.test(s)) return "3";
  if (/(luxury)/.test(s)) return "4";

  return undefined;
}

export const CommandSchema = z.object({
  action: z.literal("search_restaurants"),
  parameters: z.object({
    query: z.string().min(1, "Query cannot be empty"),
    near: z.string().trim().optional(),
    ll: LocationSchema.optional(),
    radius_m: z.coerce.number().int().min(1).max(40000).optional(),
    open_now: z.coerce.boolean().optional(),
    price: z
      .preprocess((v) => normalizePrice(v), z.enum(["1", "2", "3", "4"]))
      .optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
    min_rating: z.coerce.number().min(0).max(5).optional(),
  }),
});

export type Command = z.infer<typeof CommandSchema>;
