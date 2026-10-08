import { jsonError, jsonOk } from "@/lib/api";
import { getCallById } from "@/lib/services/calls";


export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const call = await getCallById(id);
    if (!call) return jsonError("Call not found.", 404);
    return jsonOk(call);
  } catch (error) {
    console.error("GET /api/calls/:id", error);
    return jsonError("Unable to load call details.", 500);
  }
}
