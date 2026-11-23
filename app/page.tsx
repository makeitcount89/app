import { criteria } from "../criteria";
import { getTopListings } from "../lib/listings";
import type { ScoredListing } from "../lib/types";

// Re-run the search at most every 6 hours (plus the daily cron in vercel.json).
export const revalidate = 21600;

const aud = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
const when = (iso: string) =>
  new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short", timeZone: "Australia/Sydney" }).format(new Date(iso));

function listedAgo(iso?: string) {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return days <= 0 ? "Listed today" : days === 1 ? "Listed yesterday" : `Listed ${days} days ago`;
}

function summary() {
  const parts = [
    criteria.source === "rea"
      ? criteria.areaName ?? criteria.locations.map((l) => l.suburb).join(", ")
      : criteria.near
      ? `Within ${criteria.near.radiusKm} km of ${criteria.near.name}`
      : criteria.locations.map((l) => l.suburb || l.area || l.region || l.state).join(", "),
    criteria.minPrice || criteria.maxPrice
      ? `${criteria.minPrice ? aud.format(criteria.minPrice) : "any"} – ${criteria.maxPrice ? aud.format(criteria.maxPrice) : "any"}`
      : null,
    criteria.minBedrooms ? `${criteria.minBedrooms}+ bed` : null,
    criteria.minBathrooms ? `${criteria.minBathrooms}+ bath` : null,
    criteria.minCarspaces ? `${criteria.minCarspaces}+ car` : null,
    criteria.minLandArea ? `${criteria.minLandArea.toLocaleString("en-AU")}+ m² land` : null,
    criteria.source === "domain" ? `listed in the last ${criteria.listedWithinDays} days` : "newest first",
  ];
  return parts.filter(Boolean).join(" · ");
}

function Card({ l, rank }: { l: ScoredListing; rank: number }) {
  const isNew = l.dateListed && Date.now() - new Date(l.dateListed).getTime() < 2 * 86_400_000;
  const stats = [
    l.bedrooms != null && `${l.bedrooms} bed`,
    l.bathrooms != null && `${l.bathrooms} bath`,
    l.carspaces != null && `${l.carspaces} car`,
    l.landArea && `${l.landArea.toLocaleString("en-AU")} m²`,
  ].filter(Boolean);
  return (
    <li className="card">
      <a href={l.url} target="_blank" rel="noreferrer" className="photo">
        {l.imageUrl ? <img src={l.imageUrl} alt="" loading="lazy" /> : <span className="nophoto">No photo</span>}
        <span className="rank">#{rank}</span>
        {isNew && <span className="new">New</span>}
      </a>
      <div className="body">
        <div className="price">{l.displayPrice}</div>
        <h2>
          <a href={l.url} target="_blank" rel="noreferrer">{l.address}</a>
        </h2>
        <div className="stats">
          {stats.join(" · ")}
          {l.propertyType && <span className="type">{l.propertyType}</span>}
        </div>
        {l.distanceKm != null && criteria.near && (
          <div className="distance">{l.distanceKm} km from {criteria.near.name}</div>
        )}
        {l.headline && <p className="headline">{l.headline}</p>}
        <div className="meta">
          <span>{listedAgo(l.dateListed)}</span>
          <span className="score" title="Match score">Score {l.score}</span>
        </div>
        {l.reasons.length > 0 && (
          <ul className="reasons">
            {l.reasons.map((r) => <li key={r}>{r}</li>)}
          </ul>
        )}
      </div>
    </li>
  );
}

export default async function Home() {
  const result = await getTopListings();

  return (
    <main>
      <header>
        <h1>Top {criteria.topN} listings for you</h1>
        <p className="criteria">{summary()}</p>
        <p className="checked">Last checked {when(result.checkedAt)} (Sydney time). Updates automatically.</p>
      </header>

      {!result.ok ? (
        <div className="notice error">
          <strong>Couldn’t search listings.</strong>
          <p>{result.error}</p>
        </div>
      ) : (
        <>
          {result.sample && <div className="notice">Showing made-up sample listings (USE_SAMPLE_DATA=1).</div>}
          {result.matches.length === 0 ? (
            <div className="notice">
              No listings match right now ({result.scanned} checked). Try widening your requirements in <code>criteria.ts</code>.
            </div>
          ) : (
            <>
              <ol className="grid">
                {result.matches.map((l, i) => <Card key={l.id} l={l} rank={i + 1} />)}
              </ol>
              <p className="foot">
                Ranked from {result.scanned} {result.scanned === 1 ? "listing" : "listings"} found.
                {!result.sample && (criteria.source === "rea" ? " Listing data from realestate.com.au." : " Listing data from Domain.")}
              </p>
            </>
          )}
        </>
      )}
    </main>
  );
}
