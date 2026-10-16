import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed:Clubs] Running idempotent seed for 5 student clubs and lead assignment...');

  const salt = await bcrypt.genSalt(10);
  const clubLeadPw = await bcrypt.hash('Club@123', salt);

  // 1. Ensure Robotics Club Lead User exists
  const roboticsLead = await prisma.user.upsert({
    where: { email: 'robotics.lead@campus.edu' },
    update: { role: Role.CLUB_CORE },
    create: {
      email: 'robotics.lead@campus.edu',
      passwordHash: clubLeadPw,
      fullName: 'Aaditya Nair',
      role: Role.CLUB_CORE,
      phone: '+91 98765 99001',
    },
  });

  // 2. Seed 5 Realistic University Clubs
  const clubsData = [
    {
      name: 'Robotics & Automation Society (RAS)',
      slug: 'robotics-society',
      category: 'Technical',
      description: 'Campus hub for autonomous rovers, drone design, computer vision, and national robotics leagues.',
      contactEmail: 'robotics.lead@campus.edu',
      websiteUrl: 'https://ras.campus.edu',
      leadUserId: roboticsLead.id,
    },
    {
      name: 'ACM Student Chapter',
      slug: 'acm-student-chapter',
      category: 'Technical',
      description: 'Computing society hosting competitive coding contests, system design workshops, and annual hackathons.',
      contactEmail: 'acm@campus.edu',
      websiteUrl: 'https://acm.campus.edu',
      leadUserId: null,
    },
    {
      name: 'Literary & Debating Society',
      slug: 'literary-debating',
      category: 'Cultural',
      description: 'Parliamentary debating, creative writing circles, model UN conferences, and national elocution meets.',
      contactEmail: 'litdeb@campus.edu',
      websiteUrl: 'https://litdeb.campus.edu',
      leadUserId: null,
    },
    {
      name: 'Aeromodelling & Rocketry Club',
      slug: 'aeromodelling-rocketry',
      category: 'Engineering',
      description: 'RC plane fabrication, sounding rocket propellant experiments, and aerospace payload competitions.',
      contactEmail: 'aero@campus.edu',
      websiteUrl: 'https://aero.campus.edu',
      leadUserId: null,
    },
    {
      name: 'Music & Fine Arts Society (Symphony)',
      slug: 'fine-arts-society',
      category: 'Cultural',
      description: 'Western and Indian classical music, campus acoustic jams, fine arts exhibitions, and annual cultural fest.',
      contactEmail: 'symphony@campus.edu',
      websiteUrl: 'https://symphony.campus.edu',
      leadUserId: null,
    },
  ];

  for (const c of clubsData) {
    const club = await prisma.club.upsert({
      where: { slug: c.slug },
      update: {
        description: c.description,
        contactEmail: c.contactEmail,
        websiteUrl: c.websiteUrl,
      },
      create: {
        name: c.name,
        slug: c.slug,
        category: c.category,
        description: c.description,
        contactEmail: c.contactEmail,
        websiteUrl: c.websiteUrl,
      },
    });

    if (c.leadUserId) {
      await prisma.clubMembership.upsert({
        where: {
          clubId_userId: {
            clubId: club.id,
            userId: c.leadUserId,
          },
        },
        update: { role: 'LEAD' },
        create: {
          clubId: club.id,
          userId: c.leadUserId,
          role: 'LEAD',
        },
      });
    }
  }

  console.log('[Seed:Clubs] 5 clubs seeded idempotently.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
