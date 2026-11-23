# Property Finder

Searches realestate.com.au (or Domain.com.au) for new **for-sale** listings that match your requirements and shows the top 5, ranked by how well they fit. Built with Next.js and deployed on Vercel.

## Data sources

Set `source` in `criteria.ts`:

- **`"rea"` (default):** realestate.com.au, using the private GraphQL endpoint its website calls (ported from [jamesramsay/realestate-com-au-api](https://github.com/jamesramsay/realestate-com-au-api)). It needs no key, but it's unofficial and against REA's terms, and it can break or be blocked at any time. It searches the suburbs in `locations` and has no listing dates, so results are sorted newest first instead of filtered by `listedWithinDays`.
- **`"domain"`:** the official Domain API. It needs `DOMAIN_API_KEY` from a project with the **Agents & Listings** package, which Domain grants on request. It supports the `near` radius search and listing dates.

## How it works

- `criteria.ts` holds your requirements:
  - **Hard filters** decide which listings are shown at all: suburbs, price, beds, baths, parking, property types, land size, `mustHave` keywords and `exclude` keywords.
  - **`niceToHave` keywords** only affect the ranking. Each one has a weight.
- The page searches the Domain API for listings added in the last `listedWithinDays` days. It then scores them and shows the best `topN`. Each card lists the reasons it scored well.
- **Automatic refresh:** the page re-searches at most every 6 hours (ISR), and a Vercel Cron job (`vercel.json`, daily at 20:00 UTC, which is early morning in Sydney) forces a refresh even if nobody visits.

Scoring: +weight for each nice-to-have keyword found in the headline, description or features; +1 for each bedroom over your minimum (max +2); up to +3 for being under budget (only when the agent publishes a price); +2 if listed in the last 3 days, +1 if listed this week.

## Setup

1. Get a Domain API key at <https://developer.domain.com.au>. Create a project, add the **Agents & Listings** API package, and create an API key.
2. Edit `criteria.ts` with your suburbs, budget and must-haves.
3. Import the repo in Vercel and add these environment variables:
   - `DOMAIN_API_KEY`: your Domain key
   - `CRON_SECRET`: any long random string. Vercel uses it to authenticate the daily refresh.
4. Deploy.

## Local development

```bash
npm install
cp .env.example .env.local    # add DOMAIN_API_KEY, or set USE_SAMPLE_DATA=1
npm run dev
npm test
```
