import { PrismaClient } from '../prisma/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { envConfig } from '../src/config/envConfig.js';

const connectionString = `${envConfig.DATABASE_URL}`;
const adapter = new PrismaPg({
  connectionString: connectionString,
});
const prisma = new PrismaClient({ adapter });


async function seed() {
  console.log('🌱 Seeding roles...');

  const roles = ['CUSTOMER', 'ADMIN', 'AGENCY_MANAGER', 'DRIVER'];

  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log('✅ Roles seeded:', roles.join(', '));
  await prisma.$disconnect();
}

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });