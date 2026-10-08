import { jsonError, jsonOk } from "@/lib/api";
import { listCalls } from "@/lib/services/calls";


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const data = await listCalls(searchParams);
    return jsonOk(data);
  } catch (error) {
    console.error("GET /api/calls", error);
    return jsonError("Unable to load calls.", 500);
  }
}
