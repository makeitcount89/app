import { revalidatePath } from "next/cache";

/**
 * Called daily by Vercel Cron (see vercel.json) so the page re-runs the search
 * even if nobody has visited it. Vercel sends `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  revalidatePath("/");
  return Response.json({ revalidated: true, at: new Date().toISOString() });
}
