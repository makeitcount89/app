import type { Criteria, Listing, ScoredListing } from "./types";

const DAY = 86_400_000;

/** Great-circle distance in km. */
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

function withDistance(l: Listing, c: Criteria): Listing {
  if (!c.near || l.lat == null || l.lon == null) return l;
  return { ...l, distanceKm: Math.round(distanceKm(c.near.lat, c.near.lon, l.lat, l.lon) * 10) / 10 };
}

function text(l: Listing) {
  return [l.headline, l.description, ...l.features].join(" ").toLowerCase();
}

/** Applies the hard filters the Domain API can't do (keyword includes/excludes). */
export function passesFilters(l: Listing, c: Criteria): boolean {
  const t = text(l);
  if (c.mustHave.some((k) => !t.includes(k.toLowerCase()))) return false;
  if (c.exclude.some((k) => t.includes(k.toLowerCase()))) return false;
  // Double-check the radius (and land size) in case the API returns extras.
  if (c.near && l.distanceKm != null && l.distanceKm > c.near.radiusKm) return false;
  if (c.minLandArea && l.landArea != null && l.landArea < c.minLandArea) return false;
  return true;
}

export function scoreListing(l: Listing, c: Criteria, now = new Date()): ScoredListing {
  const t = text(l);
  let score = 0;
  const reasons: string[] = [];

  for (const { keyword, weight } of c.niceToHave) {
    if (t.includes(keyword.toLowerCase())) {
      score += weight;
      reasons.push(`Mentions “${keyword}”`);
    }
  }

  if (c.minBedrooms && l.bedrooms && l.bedrooms > c.minBedrooms) {
    const extra = Math.min(l.bedrooms - c.minBedrooms, 2);
    score += extra;
    reasons.push(`${l.bedrooms} bedrooms`);
  }

  if (c.maxPrice && l.price && l.price <= c.maxPrice) {
    // Up to +3 the further under budget it is (relative to the min–max range).
    const floor = c.minPrice ?? 0;
    const headroom = (c.maxPrice - l.price) / Math.max(c.maxPrice - floor, 1);
    const pts = Math.round(Math.min(Math.max(headroom, 0), 1) * 3 * 10) / 10;
    if (pts > 0) {
      score += pts;
      reasons.push("Under budget");
    }
  }

  if (l.dateListed) {
    const age = now.getTime() - new Date(l.dateListed).getTime();
    if (age <= 3 * DAY) {
      score += 2;
      reasons.push("Listed in the last 3 days");
    } else if (age <= 7 * DAY) {
      score += 1;
      reasons.push("Listed this week");
    }
  }

  return { ...l, score: Math.round(score * 10) / 10, reasons };
}

export function topMatches(listings: Listing[], c: Criteria, now = new Date()): ScoredListing[] {
  return listings
    .map((l) => withDistance(l, c))
    .filter((l) => passesFilters(l, c))
    .map((l) => scoreListing(l, c, now))
    .sort((a, b) => b.score - a.score || (b.dateListed ?? "").localeCompare(a.dateListed ?? ""))
    .slice(0, c.topN);
}
