import { PrismaClient, AnnouncementSource, AnnouncementPriority, EventCategory, DeadlineCategory } from '@prisma/client';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed:Demo] Seeding sample notices, events, and lost items idempotently...');

  const admin = await prisma.user.findUnique({ where: { email: 'admin@campus.edu' } });
  if (!admin) throw new Error('Run seed:base first');

  // Idempotent sample announcement
  const existingAnn = await prisma.announcement.findFirst({
    where: { title: 'Mid-Semester Examination Schedule Declared' },
  });
  if (!existingAnn) {
    await prisma.announcement.create({
      data: {
        title: 'Mid-Semester Examination Schedule Declared',
        content: 'The mid-semester examinations for all B.Tech branches will commence next Monday. Bring college ID.',
        authorId: admin.id,
        authorRole: 'ADMINISTRATOR',
        sourceCategory: AnnouncementSource.ADMINISTRATION,
        isVerifiedByAdmin: true,
        priority: AnnouncementPriority.HIGH,
      },
    });
  }

  // Idempotent sample event
  const existingEv = await prisma.event.findFirst({
    where: { title: 'TechX 2026 Innovation Conclave' },
  });
  if (!existingEv) {
    await prisma.event.create({
      data: {
        title: 'TechX 2026 Innovation Conclave',
        description: 'Keynotes from alumni in AI and startup pitching in main auditorium.',
        category: EventCategory.CAMPUS,
        location: 'Main Auditorium',
        startTime: dayjs().add(2, 'day').hour(10).minute(0).toDate(),
        endTime: dayjs().add(2, 'day').hour(17).minute(0).toDate(),
        organizerId: admin.id,
        isPublic: true,
      },
    });
  }

  // Idempotent sample deadline
  const existingDl = await prisma.deadline.findFirst({
    where: { title: 'CS301 Assignment 2 Submission' },
  });
  if (!existingDl) {
    await prisma.deadline.create({
      data: {
        title: 'CS301 Assignment 2 Submission',
        description: 'Graph Traversal implementation and analysis report on GitHub Classroom.',
        dueDate: dayjs().add(1, 'day').hour(23).minute(59).toDate(),
        category: DeadlineCategory.ASSIGNMENT,
        source: 'Dept of CSE',
      },
    });
  }

  console.log('[Seed:Demo] Idempotent sample demo content seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
