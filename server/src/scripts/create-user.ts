import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 4) {
    console.error('Usage: npm run create-user -- <role> <email> <password> <name>');
    console.error('Available roles: FACULTY | ADMINISTRATOR | CLUB_CORE');
    process.exit(1);
  }

  const [rawRole, email, password, ...nameParts] = args;
  const fullName = nameParts.join(' ').trim();
  const roleUpper = rawRole.toUpperCase();

  if (!['FACULTY', 'ADMINISTRATOR', 'CLUB_CORE'].includes(roleUpper)) {
    console.error('Error: Role must be one of FACULTY, ADMINISTRATOR, CLUB_CORE');
    process.exit(1);
  }

  if (!fullName) {
    console.error('Error: Full name is required.');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Error: Password must be at least 8 characters long.');
    process.exit(1);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const role = roleUpper as Role;

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    console.error(`Error: User with email "${normalizedEmail}" already exists.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      fullName,
      passwordHash,
      role,
      isEmailVerified: true,
    },
  });

  console.log(`User created successfully: ${user.email} (${user.role})`);
}

main()
  .catch((err) => {
    console.error('Error creating user:', err.message || err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
