import { PrismaClient } from "@prisma/client";
import { DEFAULT_DOCTORS } from "../lib/clinic";

const prisma = new PrismaClient();

async function main() {
  for (const doctor of DEFAULT_DOCTORS) {
    await prisma.doctor.upsert({
      where: { name: doctor.name },
      update: { specialty: doctor.specialty },
      create: {
        name: doctor.name,
        specialty: doctor.specialty,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
