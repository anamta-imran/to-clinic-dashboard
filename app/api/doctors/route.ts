import { jsonError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/db";


export async function GET() {
  try {
    const doctors = await prisma.doctor.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, specialty: true },
    });
    return jsonOk({ items: doctors });
  } catch (error) {
    console.error("GET /api/doctors", error);
    return jsonError("Unable to load doctors.", 500);
  }
}
