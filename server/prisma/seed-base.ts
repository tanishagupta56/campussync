import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed:Base] Running idempotent baseline setup (Users, Subjects, Timetable)...');
  const salt = await bcrypt.genSalt(10);
  const studentPw = await bcrypt.hash('Student@123', salt);
  const adminPw = await bcrypt.hash('Admin@123', salt);
  const facultyPw = await bcrypt.hash('Faculty@123', salt);

  // Idempotent Student: Aarav Sharma
  await prisma.user.upsert({
    where: { email: 'aarav.sharma@campus.edu' },
    update: { fullName: 'Aarav Sharma' },
    create: {
      email: 'aarav.sharma@campus.edu',
      passwordHash: studentPw,
      fullName: 'Aarav Sharma',
      role: Role.STUDENT,
      phone: '+91 98765 43210',
      studentProfile: {
        create: {
          collegeId: '2025CSE0104',
          program: 'B.Tech',
          branch: 'Computer Science & Engineering',
          semester: 3,
          yearOfStudy: 2,
        },
      },
      attendanceSettings: { create: { alertThreshold: 80.0 } },
    },
  });

  // Idempotent Admin
  await prisma.user.upsert({
    where: { email: 'admin@campus.edu' },
    update: { fullName: 'Campus Administrator' },
    create: {
      email: 'admin@campus.edu',
      passwordHash: adminPw,
      fullName: 'Campus Administrator',
      role: Role.ADMINISTRATOR,
      phone: '+91 98765 43230',
    },
  });

  // Idempotent Faculty
  await prisma.user.upsert({
    where: { email: 'dr.ramanujan@campus.edu' },
    update: { fullName: 'Dr. S. Ramanujan' },
    create: {
      email: 'dr.ramanujan@campus.edu',
      passwordHash: facultyPw,
      fullName: 'Dr. S. Ramanujan',
      role: Role.FACULTY,
    },
  });

  // Idempotent Library
  await prisma.library.upsert({
    where: { id: 'campus-main-library' },
    update: {},
    create: {
      id: 'campus-main-library',
      name: 'Central University Library',
      capacity: 200,
      occupied: 68,
      lastUpdated: new Date(),
    },
  });

  // Idempotent Subjects
  const subjects = [
    { code: 'CS301', name: 'Data Structures & Algorithms', credits: 4, facultyName: 'Dr. S. Ramanujan' },
    { code: 'CS302', name: 'Computer Organization & Architecture', credits: 3, facultyName: 'Prof. Ananya Sen' },
    { code: 'CS303', name: 'Database Management Systems', credits: 4, facultyName: 'Dr. Rajesh Kulkarni' },
    { code: 'MA301', name: 'Discrete Mathematics', credits: 3, facultyName: 'Dr. Meenakshi Sundaram' },
  ];

  for (const s of subjects) {
    const sub = await prisma.subject.upsert({
      where: { code: s.code },
      update: { name: s.name, facultyName: s.facultyName },
      create: {
        code: s.code,
        name: s.name,
        program: 'B.Tech',
        branch: 'Computer Science & Engineering',
        semester: 3,
        credits: s.credits,
        facultyName: s.facultyName,
      },
    });

    // Seed slots if missing
    const count = await prisma.timetableSlot.count({ where: { subjectId: sub.id } });
    if (count === 0) {
      await prisma.timetableSlot.createMany({
        data: [
          { subjectId: sub.id, dayOfWeek: 1, startTime: '09:00', endTime: '10:00', room: 'LH-101' },
          { subjectId: sub.id, dayOfWeek: 3, startTime: '10:15', endTime: '11:15', room: 'LH-101' },
          { subjectId: sub.id, dayOfWeek: 5, startTime: '11:30', endTime: '12:30', room: 'LH-101' },
        ],
      });
    }
  }

  console.log('[Seed:Base] Idempotent baseline seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
