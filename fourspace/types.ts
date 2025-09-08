// ---- types ----
export type FsqCategory = { id: string | number; name: string };

export type PlaceHoursObject = {
  open_now?: boolean;
  display?: string;
  regular?: any;
};

export type PlaceHours = PlaceHoursObject | PlaceHoursObject[]; // some payloads return an object, some an array

export type PlaceLite = {
  fsq_place_id: string;
  name: string;
  location?: {
    formatted_address?: string;
  };
  categories?: FsqCategory[];     // ✅ use `categories` in responses
  distance?: number;
  link?: string;
};

export type PlaceDetails = PlaceLite & {
  rating?: number;
  price?: number;                 // 1..4
  hours?: PlaceHours;
  website?: string;
};
