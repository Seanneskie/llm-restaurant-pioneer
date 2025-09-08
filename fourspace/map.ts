import type { Command } from "../llm/schema.js";
import type { PlaceDetails, PlaceLite, PlaceHours } from "./types";


function priceToMinMax(price?: string | number): { min_price?: string; max_price?: string } {
  if (price == null) return {};
  if (typeof price === 'number') return { min_price: String(price), max_price: String(price) };

  // "1" or "1,2"
  const single = price.match(/^[1-4]$/);
  if (single) return { min_price: price, max_price: price };

  const range = price.match(/^([1-4]),([1-4])$/);
  if (range) {
    const a = Number(range[1]);
    const b = Number(range[2]);
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    return { min_price: String(lo), max_price: String(hi) };
  }
  return {};
}

function coerceOpenNow(hours?: PlaceHours): boolean | undefined {
  if (!hours) return undefined;
  if (Array.isArray(hours)) return hours[0]?.open_now;
  return hours.open_now;
}

function coerceHoursDisplay(hours?: PlaceHours): string | undefined {
  if (!hours) return undefined;
  if (Array.isArray(hours)) return hours[0]?.display;
  return hours.display;
}

export function toFsqParams(cmd: Command) {
  const p = cmd.parameters;

  const params: Record<string, string> = {
    query: p.query,
    fsq_category_ids: '4d4b7105d754a06374d81259',
    limit: String(Math.min(p.limit ?? 20, 50)),
  };

  if (p.near) {
    params.near = p.near;
  } else if (p.ll?.latitude != null && p.ll?.longitude != null) {
    params.ll = `${p.ll.latitude},${p.ll.longitude}`;
    if (p.radius_m) {
      params.radius = String(Math.min(p.radius_m, 500000));
    }
  }

  if (p.open_now) params.open_now = 'true';

  const mm = priceToMinMax(p.price as any);
  if (mm.min_price) params.min_price = mm.min_price;
  if (mm.max_price) params.max_price = mm.max_price;

  return params;
}

type AnyPlace = (PlaceLite | PlaceDetails) & {
  fsq_place_id?: string;
  latitude?: number;
  longitude?: number;
  tel?: string;
  email?: string;
  social_media?: { facebook_id?: string; twitter?: string };
  placemaker_url?: string;
};


export function normalizePlace(place: AnyPlace) {
  const id = (place as any).fsq_id ?? place.fsq_place_id;
  console.log("place", place)
  const main = (place as any).geocodes?.main;
  const latitude = main?.latitude ?? place.latitude;
  const longitude = main?.longitude ?? place.longitude;

  const categories = Array.from(
    new Set(place.categories?.map((c: any) => c?.name).filter(Boolean) ?? [])
  );

  const link = (place as any).link as string | undefined;
  const url =
    (place as any).website ??
    (link?.startsWith("/places/") ? `https://foursquare.com${link}` : link) ??
    place.placemaker_url;

  const openNow = coerceOpenNow((place as any).hours);
  const hoursDisplay = coerceHoursDisplay((place as any).hours);

  return {
    fsq_id: id,
    name: place.name,
    address: place.location?.formatted_address ?? "Address not available",
    latitude,
    longitude,
    cuisine: categories,
    rating: (place as any).rating ?? "No Rating",
    price_level: (place as any).price ?? "No Price Level",
    open_now: openNow ?? "False",
    hours: hoursDisplay ?? "Hours not available",
    fsq_link: link,
    url,
    tel: (place as any).tel,
    email: (place as any).email,
    distance_m: (place as any).distance,
  };
}