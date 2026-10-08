import { prisma } from "@/lib/db";
import { mapActivity } from "@/lib/mappers";

export async function listRecentActivity(limit = 20) {
  const rows = await prisma.activity.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 50),
  });
  return rows.map(mapActivity);
}
