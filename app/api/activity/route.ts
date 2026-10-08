import { jsonError, jsonOk } from "@/lib/api";
import { listRecentActivity } from "@/lib/services/activity";


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? "20") || 20;
    const items = await listRecentActivity(limit);
    return jsonOk({ items });
  } catch (error) {
    console.error("GET /api/activity", error);
    return jsonError("Unable to load activity.", 500);
  }
}
