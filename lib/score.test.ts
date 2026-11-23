import { test } from "node:test";
import assert from "node:assert/strict";
import { topMatches, scoreListing, passesFilters } from "./score.ts";
import { buildSearchBody, normalise } from "./domain.ts";
import { sampleListings } from "./sample.ts";
import type { Criteria } from "./types.ts";

const now = new Date("2026-11-23T00:00:00Z");
const c: Criteria = {
  source: "domain",
  locations: [{ state: "NSW", suburb: "Sampleville" }],
  propertyTypes: ["House"],
  minPrice: 900_000,
  maxPrice: 1_600_000,
  minBedrooms: 3,
  listedWithinDays: 30,
  mustHave: [],
  exclude: ["under offer"],
  niceToHave: [{ keyword: "north", weight: 3 }, { keyword: "renovated", weight: 2 }],
  topN: 5,
};

test("excluded keywords are filtered out", () => {
  const top = topMatches(sampleListings(now), c, now);
  assert.equal(top.length, 5);
  assert.ok(!top.some((l) => l.id === 6));
});

test("mustHave requires every keyword", () => {
  const [l] = sampleListings(now);
  assert.ok(passesFilters(l, { ...c, mustHave: ["garden", "study"] }));
  assert.ok(!passesFilters(l, { ...c, mustHave: ["garden", "pool"] }));
});

test("best match ranks first with reasons", () => {
  const top = topMatches(sampleListings(now), c, now);
  assert.equal(top[0].id, 1);
  assert.ok(top[0].reasons.includes("Mentions “north”"));
  assert.ok(top[0].reasons.includes("Listed in the last 3 days"));
});

test("price headroom scores more for cheaper listings", () => {
  const [a] = sampleListings(now);
  const cheap = scoreListing({ ...a, price: 1_000_000, headline: "", description: "", dateListed: undefined, bedrooms: 3 }, c, now);
  const dear = scoreListing({ ...a, price: 1_550_000, headline: "", description: "", dateListed: undefined, bedrooms: 3 }, c, now);
  assert.ok(cheap.score > dear.score);
});

test("search body targets sale listings since the window", () => {
  const body = buildSearchBody(c, 2, now);
  assert.equal(body.listingType, "Sale");
  assert.equal(body.pageNumber, 2);
  assert.equal(body.listedSince, "2026-10-24T00:00:00.000Z");
  assert.equal(body.locations[0].suburb, "Sampleville");
});

test("normalise maps Domain fields", () => {
  const l = normalise({
    id: 42,
    listingSlug: "1-test-st-sampleville-nsw-2000-42",
    priceDetails: { priceFrom: 1_000_000, priceTo: 1_100_000, displayPrice: "$1m - $1.1m" },
    media: [{ category: "Image", url: "https://img/x.jpg" }],
    propertyDetails: { displayableAddress: "1 Test St, Sampleville", bedrooms: 3, features: ["Study"] },
  });
  assert.equal(l.url, "https://www.domain.com.au/1-test-st-sampleville-nsw-2000-42");
  assert.equal(l.price, 1_050_000);
  assert.equal(l.imageUrl, "https://img/x.jpg");
});

test("radius filter drops listings outside the circle", () => {
  const near = { name: "Stirling SA", lat: -35.0045, lon: 138.7183, radiusKm: 10 };
  const [a] = sampleListings(now);
  const inside = { ...a, id: 100, lat: -35.03, lon: 138.72 }; // ~3 km
  const outside = { ...a, id: 101, lat: -34.9285, lon: 138.6007 }; // Adelaide CBD, ~13 km
  const top = topMatches([inside, outside], { ...c, near }, now);
  assert.deepEqual(top.map((l) => l.id), [100]);
  assert.ok(top[0].distanceKm! < 4);
  const body = buildSearchBody({ ...c, near, locations: [] }, 1, now);
  assert.equal(body.geoWindow?.circle.radiusInMeters, 10000);
  assert.equal(body.locations, undefined);
});

test("land size filter", () => {
  const [a] = sampleListings(now);
  assert.ok(!passesFilters({ ...a, landArea: 900 }, { ...c, minLandArea: 1500 }));
  assert.ok(passesFilters({ ...a, landArea: 2000 }, { ...c, minLandArea: 1500 }));
});

import { parsePrice, parseLand, normaliseRea, buildReaQuery } from "./rea.ts";

test("REA price and land parsing", () => {
  assert.equal(parsePrice("$1,250,000"), 1_250_000);
  assert.equal(parsePrice("Offers over $1.2m"), 1_200_000);
  assert.equal(parsePrice("$950k - $1.05m"), 1_000_000);
  assert.equal(parsePrice("Auction"), undefined);
  assert.equal(parseLand("1,500", "m²"), 1500);
  assert.equal(parseLand("2.5", "ha"), 25_000);
  assert.equal(parseLand("1", "acres"), 4047);
});

test("REA listing normalises and query carries filters", () => {
  const l = normaliseRea({
    id: "1234", _links: { canonical: { href: "https://www.realestate.com.au/property-house-sa-stirling-1234" } },
    address: { display: { fullAddress: "1 Main St, Stirling, SA 5152" }, suburb: "Stirling" },
    price: { display: "$1,400,000" }, generalFeatures: { bedrooms: { value: 4 } },
    propertySizes: { land: { displayValue: "2,000", sizeUnit: { displayValue: "m²" } } },
    media: { mainImage: { templatedUrl: "https://i2.au.reastatic.net/{size}/abc/main.jpg" } },
  });
  assert.equal(l.landArea, 2000);
  assert.equal(l.price, 1_400_000);
  assert.equal(l.imageUrl, "https://i2.au.reastatic.net/800x600/abc/main.jpg");
  const q = buildReaQuery({ ...c, source: "rea", minLandArea: 1500, locations: [{ state: "SA", suburb: "Stirling", postCode: "5152" }] }, 1);
  assert.equal(q.localities[0].searchLocation, "Stirling, SA 5152");
  assert.deepEqual(q.filters.landSize, { minimum: "1500" });
  assert.deepEqual(q.filters.priceRange, { minimum: "900000", maximum: "1600000" });
});
