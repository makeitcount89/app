import type { Criteria } from "./lib/types";

/**
 * YOUR REQUIREMENTS — edit this file, commit, and Vercel redeploys.
 *
 * "Hard" filters (locations, price, beds, baths, parking, property types,
 * land size, mustHave, exclude) decide whether a listing is shown at all.
 * "niceToHave" keywords only affect the ranking of what's left.
 */
export const criteria: Criteria = {
  // Search a radius around a point. Set near to undefined to use locations instead.
  near: { name: "Stirling SA", lat: -35.0045, lon: 138.7183, radiusKm: 10 },

  // Suburbs to search (used when near is not set). state is required; postCode makes the match exact.
  // e.g. { state: "SA", suburb: "Stirling", postCode: "5152", includeSurroundingSuburbs: true }
  locations: [],

  // Leave empty for any type, or pick from: House, Townhouse, ApartmentUnitFlat, Villa,
  // Duplex, SemiDetached, Terrace, VacantLand, AcreageSemiRural, NewHouseLand ...
  propertyTypes: [],

  minPrice: undefined,
  maxPrice: 1_500_000,

  minBedrooms: 4, // 4 or more
  minBathrooms: undefined,
  minCarspaces: undefined,
  minLandArea: 1500, // m²

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
