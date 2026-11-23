import { criteria } from "../criteria";
import { searchDomain } from "./domain";
import { searchRea } from "./rea";
import { sampleListings } from "./sample";
import { topMatches } from "./score";
import type { ScoredListing } from "./types";

export type Result =
  | { ok: true; matches: ScoredListing[]; scanned: number; sample: boolean; checkedAt: string }
  | { ok: false; error: string; checkedAt: string };

export async function getTopListings(): Promise<Result> {
  const checkedAt = new Date().toISOString();
  const sample = process.env.USE_SAMPLE_DATA === "1";
  const apiKey = process.env.DOMAIN_API_KEY;

  if (!sample && criteria.source === "domain" && !apiKey) {
    return { ok: false, checkedAt, error: "DOMAIN_API_KEY is not set. Add it in Vercel → Settings → Environment Variables (or .env.local), or set USE_SAMPLE_DATA=1 to preview." };
  }

  try {
    const all = sample
      ? sampleListings()
      : criteria.source === "rea"
        ? await searchRea(criteria)
        : await searchDomain(criteria, apiKey!);
    return { ok: true, matches: topMatches(all, criteria), scanned: all.length, sample, checkedAt };
  } catch (e) {
    return { ok: false, checkedAt, error: e instanceof Error ? e.message : String(e) };
  }
}
