import type { Criteria, Listing } from "./types";

const SEARCH_URL = "https://api.domain.com.au/v1/listings/residential/_search";
const PAGE_SIZE = 100;
const MAX_PAGES = 3;

/* Subset of the Domain residential search response that we use. */
type DomainListing = {
  id: number;
  listingSlug?: string;
  headline?: string;
  summaryDescription?: string;
  dateListed?: string;
  priceDetails?: { price?: number; priceFrom?: number; priceTo?: number; displayPrice?: string };
  media?: { category?: string; url?: string }[];
  propertyDetails?: {
    propertyType?: string;
    bedrooms?: number;
    bathrooms?: number;
    carspaces?: number;
    landArea?: number;
    suburb?: string;
    displayableAddress?: string;
    features?: string[];
    latitude?: number;
    longitude?: number;
  };
};
type DomainItem =
  | { type: "PropertyListing"; listing: DomainListing }
  | { type: "Project"; listings: DomainListing[] };

export function buildSearchBody(c: Criteria, page: number, now = new Date()) {
  const since = new Date(now.getTime() - c.listedWithinDays * 86_400_000);
  return {
    listingType: "Sale",
    propertyTypes: c.propertyTypes.length ? c.propertyTypes : undefined,
    minPrice: c.minPrice,
    maxPrice: c.maxPrice,
    minBedrooms: c.minBedrooms,
    minBathrooms: c.minBathrooms,
    minCarspaces: c.minCarspaces,
    minLandArea: c.minLandArea,
    listedSince: since.toISOString(),
    geoWindow: c.near
      ? { circle: { center: { lat: c.near.lat, lon: c.near.lon }, radiusInMeters: Math.round(c.near.radiusKm * 1000) } }
      : undefined,
    locations: !c.near && c.locations.length ? c.locations.map((l) => ({
      state: l.state,
      region: l.region ?? "",
      area: l.area ?? "",
      suburb: l.suburb ?? "",
      postCode: l.postCode ?? "",
      includeSurroundingSuburbs: l.includeSurroundingSuburbs ?? false,
    })) : undefined,
    sort: { sortKey: "DateListed", direction: "Descending" },
    pageSize: PAGE_SIZE,
    pageNumber: page,
  };
}

export function normalise(l: DomainListing): Listing {
  const p = l.propertyDetails ?? {};
  const pd = l.priceDetails ?? {};
  const price = pd.price ?? (pd.priceFrom && pd.priceTo ? (pd.priceFrom + pd.priceTo) / 2 : pd.priceFrom ?? pd.priceTo);
  return {
    id: l.id,
    url: l.listingSlug ? `https://www.domain.com.au/${l.listingSlug}` : `https://www.domain.com.au/${l.id}`,
    address: p.displayableAddress ?? p.suburb ?? "Address withheld",
    suburb: p.suburb ?? "",
    propertyType: p.propertyType ?? "",
    displayPrice: pd.displayPrice ?? "Contact agent",
    price,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    carspaces: p.carspaces,
    landArea: p.landArea,
    headline: l.headline ?? "",
    description: l.summaryDescription ?? "",
    features: p.features ?? [],
    imageUrl: l.media?.find((m) => m.category === "Image")?.url,
    dateListed: l.dateListed,
    lat: p.latitude,
    lon: p.longitude,
  };
}

export async function searchDomain(c: Criteria, apiKey: string): Promise<Listing[]> {
  const out = new Map<number, Listing>();
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await fetch(SEARCH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
      body: JSON.stringify(buildSearchBody(c, page)),
      next: { revalidate: 21600 },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Domain API ${res.status}: ${text.slice(0, 300)}`);
    }
    const items = (await res.json()) as DomainItem[];
    for (const item of items) {
      const listings = item.type === "Project" ? item.listings : [item.listing];
      for (const l of listings ?? []) if (l?.id) out.set(l.id, normalise(l));
    }
    if (items.length < PAGE_SIZE) break;
  }
  return [...out.values()];
}
