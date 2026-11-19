import 'dotenv/config'; 
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import * as argon2 from 'argon2';


async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Check your .env file.');
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  const adminEmail = 'admin@library.local';
  const adminPassword = 'admin1234';

  const existing = await prisma.staff.findUnique({
    where: { email: adminEmail },
  });

  if (existing) {
    console.log(`✓ Admin ${adminEmail} already exists`);
    await prisma.$disconnect();
    return;
  }

  const passwordHash = await argon2.hash(adminPassword, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  await prisma.staff.create({
    data: {
      name: 'Administrator',
      email: adminEmail,
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log(`✓ Admin created: ${adminEmail} / ${adminPassword}`);
  console.log('⚠️  Change password after first login!');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});