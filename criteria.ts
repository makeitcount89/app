import type { Criteria } from "./lib/types";

/**
 * YOUR REQUIREMENTS — edit this file, commit, and Vercel redeploys.
 *
 * "Hard" filters (locations, price, beds, baths, parking, property types,
 * land size, mustHave, exclude) decide whether a listing is shown at all.
 * "niceToHave" keywords only affect the ranking of what's left.
 */
export const criteria: Criteria = {
  // Where listings come from:
  //   "rea"    – realestate.com.au (unofficial, no key needed; searches the suburbs in `locations`)
  //   "domain" – Domain API (needs DOMAIN_API_KEY with Agents & Listings access; uses `near` radius)
  source: "domain",
  areaName: "Within ~10 km of Stirling SA",

  // Radius search (Domain only). Set near to undefined to use locations instead.
  near: { name: "Stirling SA", lat: -35.0045, lon: 138.7183, radiusKm: 10 },

  // Suburbs to search (REA always uses these; Domain uses them when near is not set).
  // Roughly everything within 10 km of Stirling SA.
  locations: [
    ["Stirling", "5152"], ["Crafers", "5152"], ["Crafers West", "5152"], ["Cleland", "5152"],
    ["Aldgate", "5154"], ["Bridgewater", "5155"], ["Heathfield", "5153"], ["Bradbury", "5153"],
    ["Longwood", "5153"], ["Mylor", "5153"], ["Ironbank", "5153"], ["Scott Creek", "5153"],
    ["Biggs Flat", "5153"], ["Upper Sturt", "5156"], ["Piccadilly", "5151"], ["Uraidla", "5142"],
    ["Summertown", "5141"], ["Carey Gully", "5144"], ["Basket Range", "5138"], ["Greenhill", "5140"],
    ["Eagle On The Hill", "5150"], ["Leawood Gardens", "5150"], ["Mount Osmond", "5064"],
    ["Belair", "5052"], ["Verdun", "5245"], ["Cherry Gardens", "5157"], ["Coromandel East", "5157"],
  ].map(([suburb, postCode]) => ({ state: "SA", suburb, postCode })),

  // Leave empty for any type, or pick from: House, Townhouse, ApartmentUnitFlat, Villa,
  // Duplex, SemiDetached, Terrace, VacantLand, AcreageSemiRural, NewHouseLand ...
  propertyTypes: [],

  minPrice: undefined,
  maxPrice: 1_500_000,

  minBedrooms: 4, // 4 or more
  minBathrooms: undefined,
  minCarspaces: undefined,
  minLandArea: 1500, // m²

  // Only consider listings added in the last N days (Domain only; REA sorts newest first).
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
