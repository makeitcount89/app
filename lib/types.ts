export type Location = {
  state: string;
  suburb?: string;
  postCode?: string;
  region?: string;
  area?: string;
  includeSurroundingSuburbs?: boolean;
};

export type Criteria = {
  locations: Location[];
  propertyTypes: string[];
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  minBathrooms?: number;
  minCarspaces?: number;
  minLandArea?: number;
  listedWithinDays: number;
  mustHave: string[];
  exclude: string[];
  niceToHave: { keyword: string; weight: number }[];
  topN: number;
};

/** Normalised listing, independent of the Domain response shape. */
export type Listing = {
  id: number;
  url: string;
  address: string;
  suburb: string;
  propertyType: string;
  displayPrice: string;
  price?: number; // best numeric estimate, if the agent published one
  bedrooms?: number;
  bathrooms?: number;
  carspaces?: number;
  landArea?: number;
  headline: string;
  description: string;
  features: string[];
  imageUrl?: string;
  dateListed?: string; // ISO
};

export type ScoredListing = Listing & { score: number; reasons: string[] };
