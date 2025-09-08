import type { PlaceDetails, PlaceLite } from "./types";


const FOURSQUARE_BASE_URL = "https://places-api.foursquare.com/"

function authHeaders() {
  return {
    "X-Places-Api-Version": "2025-06-17",
    Accept: "application/json",
    Authorization: `Bearer ${process.env.FSQ_API_KEY}`,
  };
}

export async function searchPlaces(params: Record<string, string>) {
    const url = new URL(FOURSQUARE_BASE_URL + "places/search");
    
    Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, String(v)))
    
    const res = await fetch(url.toString(), { headers: authHeaders() });
    
    if (!res.ok) throw new Error(`FSQ search error: ${res.status} ${res.statusText}`);

    return (await res.json()) as { results: PlaceLite[] };
}


export async function getPlaceDetails(fsqId: string, fields?: string) {
  const url = new URL(FOURSQUARE_BASE_URL + `places/${encodeURIComponent(fsqId)}`);
  // default fields if caller omits them
  url.searchParams.set(
    "fields",
    fields ??
      "rating,price,hours,website,tel,email,social_media,location,categories,geocodes,link"
  );

  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`FSQ details error: ${res.status} ${res.statusText} ${body}`);
  }
  return (await res.json()) as PlaceDetails;
}
