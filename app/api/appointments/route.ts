import { jsonError, jsonOk } from "@/lib/api";
import { listAppointments } from "@/lib/services/appointments";


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const data = await listAppointments(searchParams);
    return jsonOk(data);
  } catch (error) {
    console.error("GET /api/appointments", error);
    return jsonError("Unable to load appointments.", 500);
  }
}
