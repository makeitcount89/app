import type { Criteria, Listing } from "./types";

/**
 * realestate.com.au via its private website GraphQL endpoint.
 * Ported from github.com/jamesramsay/realestate-com-au-api (2020). Unofficial:
 * it can break whenever REA changes its site, and REA's terms don't allow it.
 */
const URL = "https://lexa.realestate.com.au/graphql";
const PAGE_SIZE = 100;
const MAX_PAGES = 2;

const QUERY = `query searchByQuery($query:SearchQueryJson!$testListings:Boolean!$nullifyOptionals:Boolean!)@debug(testListings:$testListings nullifyOptionals:$nullifyOptionals){buySearch(query:$query){results{totalResultsCount pagination{moreResultsAvailable} exact{items{listing{...L}}} surrounding{items{listing{...L}}}}}} fragment L on ResidentialListing{id _links{canonical{href}} address{display{shortAddress fullAddress} suburb state postcode} propertyType{id display} title description price{display} generalFeatures{bedrooms{value} bathrooms{value} parkingSpaces{value}} propertySizes{land{displayValue sizeUnit{displayValue}}} media{mainImage{templatedUrl}}}`;

// Domain-style property type names (used in criteria.ts) → REA filter values.
const TYPE_MAP: Record<string, string> = {
  House: "house",
  Townhouse: "townhouse",
  ApartmentUnitFlat: "unit apartment",
  Villa: "villa",
  VacantLand: "land",
  AcreageSemiRural: "acreage",
};

type ReaListing = {
  id?: string;
  _links?: { canonical?: { href?: string } };
  address?: { display?: { shortAddress?: string; fullAddress?: string }; suburb?: string };
  propertyType?: { id?: string; display?: string };
  title?: string;
  description?: string;
  price?: { display?: string };
  generalFeatures?: { bedrooms?: { value?: number }; bathrooms?: { value?: number }; parkingSpaces?: { value?: number } };
  propertySizes?: { land?: { displayValue?: string; sizeUnit?: { displayValue?: string } } };
  media?: { mainImage?: { templatedUrl?: string } };
};

type ReaResponse = {
  errors?: { message: string }[];
  data?: {
    buySearch?: {
      results?: {
        totalResultsCount?: number;
        pagination?: { moreResultsAvailable?: boolean };
        exact?: { items?: { listing?: ReaListing }[] } | null;
        surrounding?: { items?: { listing?: ReaListing }[] } | null;
      };
    };
  };
};

/** "$1,250,000", "Offers over $1.2m", "$950k - $1.05m" → a number (midpoint for ranges). */
export function parsePrice(text?: string): number | undefined {
  if (!text) return undefined;
  const nums = [...text.toLowerCase().matchAll(/\$\s*([\d,.]+)\s*(k|m)?/g)].map(([, n, unit]) => {
    const v = parseFloat(n.replace(/,/g, ""));
    return unit === "m" ? v * 1e6 : unit === "k" ? v * 1e3 : v;
  }).filter((v) => v >= 10_000); // ignore things like "$50 deposit"
  if (!nums.length) return undefined;
  return Math.round(nums.slice(0, 2).reduce((a, b) => a + b, 0) / Math.min(nums.length, 2));
}

/** "1,500" + "m²" / "2.5" + "ha" / "5" + "acres" → m². */
export function parseLand(value?: string, unit?: string): number | undefined {
  if (!value) return undefined;
  const v = parseFloat(value.replace(/,/g, ""));
  if (!isFinite(v)) return undefined;
  const u = (unit ?? "").toLowerCase();
  if (u.startsWith("ha")) return Math.round(v * 10_000);
  if (u.startsWith("ac")) return Math.round(v * 4046.86);
  return Math.round(v);
}

export function normaliseRea(l: ReaListing): Listing {
  const land = l.propertySizes?.land;
  const img = l.media?.mainImage?.templatedUrl;
  return {
    id: Number(l.id) || 0,
    url: l._links?.canonical?.href ?? `https://www.realestate.com.au/${l.id}`,
    address: l.address?.display?.fullAddress ?? l.address?.display?.shortAddress ?? l.address?.suburb ?? "Address withheld",
    suburb: l.address?.suburb ?? "",
    propertyType: l.propertyType?.display ?? l.propertyType?.id ?? "",
    displayPrice: l.price?.display ?? "Contact agent",
    price: parsePrice(l.price?.display),
    bedrooms: l.generalFeatures?.bedrooms?.value,
    bathrooms: l.generalFeatures?.bathrooms?.value,
    carspaces: l.generalFeatures?.parkingSpaces?.value,
    landArea: parseLand(land?.displayValue, land?.sizeUnit?.displayValue),
    headline: l.title ?? "",
    description: (l.description ?? "").replace(/<[^>]+>/g, " "),
    features: [],
    imageUrl: img?.replace("{size}", "800x600"),
  };
}

export function buildReaQuery(c: Criteria, page: number) {
  const filters: Record<string, unknown> = {
    surroundingSuburbs: false,
    excludeNoSalePrice: false,
    "ex-under-contract": true,
    furnished: false,
    petsAllowed: false,
  };
  if (c.minPrice || c.maxPrice) {
    filters.priceRange = {
      ...(c.minPrice ? { minimum: String(c.minPrice) } : {}),
      ...(c.maxPrice ? { maximum: String(c.maxPrice) } : {}),
    };
  }
  if (c.minBedrooms) filters.bedroomsRange = { minimum: String(c.minBedrooms) };
  if (c.minBathrooms) filters.minimumBathroom = String(c.minBathrooms);
  if (c.minCarspaces) filters.minimumCars = String(c.minCarspaces);
  if (c.minLandArea) filters.landSize = { minimum: String(c.minLandArea) };
  const types = c.propertyTypes.map((t) => TYPE_MAP[t]).filter(Boolean);
  if (types.length) filters.propertyTypes = types;

  return {
    channel: "buy",
    page,
    pageSize: PAGE_SIZE,
    sortType: "new-desc",
    localities: c.locations.map((l) => ({
      searchLocation: [l.suburb, [l.state, l.postCode].filter(Boolean).join(" ")].filter(Boolean).join(", "),
    })),
    filters,
  };
}

export async function searchRea(c: Criteria): Promise<Listing[]> {
  if (!c.locations.length) throw new Error("REA search needs at least one suburb in criteria.locations.");
  const out = new Map<string, Listing>();
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await fetch(URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://www.realestate.com.au",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
      },
      body: JSON.stringify({
        operationName: "searchByQuery",
        variables: { query: JSON.stringify(buildReaQuery(c, page)), testListings: false, nullifyOptionals: false },
        query: QUERY,
      }),
      next: { revalidate: 21600 },
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`realestate.com.au ${res.status}: ${text.slice(0, 200)}`);
    let data: ReaResponse;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`realestate.com.au returned a non-JSON response (likely blocked): ${text.slice(0, 120)}`);
    }
    if (data.errors?.length) throw new Error(`realestate.com.au: ${data.errors.map((e) => e.message).join("; ").slice(0, 300)}`);
    const results = data.data?.buySearch?.results;
    const items = [...(results?.exact?.items ?? []), ...(results?.surrounding?.items ?? [])];
    for (const { listing } of items) if (listing?.id) out.set(listing.id, normaliseRea(listing));
    if (!results?.pagination?.moreResultsAvailable || items.length === 0) break;
  }
  return [...out.values()];
}
