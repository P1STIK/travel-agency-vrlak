import 'dotenv/config';
import { PrismaClient, StaffRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const name = process.env.ADMIN_USERNAME;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!email || !name || !passwordHash) {
    throw new Error('Missing ADMIN_EMAIL, ADMIN_USERNAME or ADMIN_PASSWORD_HASH env var');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.staffUser.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    console.log(`StaffUser with email ${normalizedEmail} already exists, skipping`);
    return;
  }

  await prisma.staffUser.create({
    data: {
      email: normalizedEmail,
      name,
      passwordHash,
      role: StaffRole.ADMIN,
    },
  });

  console.log(`Created StaffUser ${normalizedEmail}`);
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
