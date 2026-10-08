import { jsonError, jsonOk } from "@/lib/api";
import { getDashboardData } from "@/lib/services/dashboard";


export async function GET() {
  try {
    const data = await getDashboardData();
    return jsonOk(data);
  } catch (error) {
    console.error("GET /api/dashboard", error);
    return jsonError("Unable to load dashboard data.", 500);
  }
}
