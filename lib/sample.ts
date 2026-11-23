import type { Listing } from "./types";

/** Made-up listings for previewing the UI without an API key (USE_SAMPLE_DATA=1). */
export function sampleListings(now = new Date()): Listing[] {
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000).toISOString();
  const base = { suburb: "Sampleville", features: [] as string[], imageUrl: undefined };
  return [
    { ...base, id: 1, url: "#", address: "12 Example St, Sampleville", propertyType: "House", displayPrice: "$1,350,000", price: 1_350_000, bedrooms: 4, bathrooms: 2, carspaces: 1, landArea: 380, headline: "Renovated family home with north-facing garden", description: "Light-filled, renovated, ducted air conditioning and a separate study.", dateListed: daysAgo(1) },
    { ...base, id: 2, url: "#", address: "4/88 Demo Rd, Sampleville", propertyType: "Townhouse", displayPrice: "Guide $1.1m", price: 1_100_000, bedrooms: 3, bathrooms: 2, carspaces: 1, headline: "Low-maintenance townhouse", description: "Courtyard garden, close to the station.", dateListed: daysAgo(5) },
    { ...base, id: 3, url: "#", address: "7 Placeholder Ave, Sampleville", propertyType: "SemiDetached", displayPrice: "Auction", bedrooms: 3, bathrooms: 1, carspaces: 0, landArea: 210, headline: "Original semi, renovate or move in", description: "North rear aspect, side access.", dateListed: daysAgo(2) },
    { ...base, id: 4, url: "#", address: "31 Mock Lane, Sampleville", propertyType: "Terrace", displayPrice: "$1,550,000", price: 1_550_000, bedrooms: 3, bathrooms: 2, carspaces: 0, headline: "Victorian terrace", description: "Period features, study nook, air conditioning.", dateListed: daysAgo(12) },
    { ...base, id: 5, url: "#", address: "2 Test Pde, Sampleville", propertyType: "House", displayPrice: "Contact agent", bedrooms: 5, bathrooms: 3, carspaces: 2, landArea: 560, headline: "Big block, big house", description: "Pool, renovated kitchen.", dateListed: daysAgo(20) },
    { ...base, id: 6, url: "#", address: "9 Fixture St, Sampleville", propertyType: "House", displayPrice: "$1,200,000", price: 1_200_000, bedrooms: 3, bathrooms: 1, carspaces: 1, headline: "Under offer", description: "Under offer — inspections cancelled.", dateListed: daysAgo(3) },
  ];
}
