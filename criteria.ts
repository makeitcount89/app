import type { Criteria } from "./lib/types";

/**
 * YOUR REQUIREMENTS — edit this file, commit, and Vercel redeploys.
 *
 * "Hard" filters (locations, price, beds, baths, parking, property types,
 * land size, mustHave, exclude) decide whether a listing is shown at all.
 * "niceToHave" keywords only affect the ranking of what's left.
 */
export const criteria: Criteria = {
  // Suburbs to search. state is required; postCode makes the match exact.
  locations: [
    { state: "NSW", suburb: "Marrickville", postCode: "2204", includeSurroundingSuburbs: true },
  ],

  // Any of: House, Townhouse, ApartmentUnitFlat, Villa, Duplex, SemiDetached,
  // Terrace, VacantLand, AcreageSemiRural, NewHouseLand, Studio, Penthouse ...
  propertyTypes: ["House", "Townhouse", "SemiDetached", "Terrace"],

  minPrice: 900_000,
  maxPrice: 1_600_000,

  minBedrooms: 3,
  minBathrooms: 1,
  minCarspaces: 0,
  minLandArea: undefined, // m²

  // Only consider listings added in the last N days ("new" listings).
  listedWithinDays: 30,

  // Listing text must mention ALL of these (case-insensitive). Leave empty for none.
  mustHave: [],

  // Hide listings whose text mentions ANY of these.
  exclude: ["under offer", "off the plan"],

  // Boost listings mentioning these. Higher weight = more important.
  niceToHave: [
    { keyword: "north", weight: 3 },
    { keyword: "renovated", weight: 2 },
    { keyword: "garden", weight: 2 },
    { keyword: "air conditioning", weight: 1 },
    { keyword: "study", weight: 1 },
  ],

  // How many listings to show.
  topN: 5,
};
