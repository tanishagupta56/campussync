import { PrismaClient, Role, AttendanceStatus, AnnouncementPriority, AnnouncementSource, EventCategory, DeadlineCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Seeding realistic attendance history & timetable for demo student...');

  // Find or create primary demo student Aarav Sharma
  let studentAarav = await prisma.user.findUnique({
    where: { email: 'aarav.sharma@campus.edu' },
    include: { studentProfile: true },
  });

  const salt = await bcrypt.genSalt(10);
  const studentPw = await bcrypt.hash('Student@123', salt);

  if (!studentAarav) {
    studentAarav = await prisma.user.create({
      data: {
        email: 'aarav.sharma@campus.edu',
        passwordHash: studentPw,
        fullName: 'Aarav Sharma',
        role: Role.STUDENT,
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
      include: { studentProfile: true },
    });
  }

  // Clear existing attendance records, timetable slots, subjects for clean recalculation
  await prisma.attendanceAlert.deleteMany({ where: { studentId: studentAarav.id } });
  await prisma.attendanceRecord.deleteMany({ where: { studentId: studentAarav.id } });
  await prisma.timetableSlot.deleteMany();
  await prisma.subject.deleteMany({ where: { branch: 'Computer Science & Engineering', semester: 3 } });

  // Create 4 core subjects for B.Tech CSE Semester 3
  const subDSA = await prisma.subject.create({
    data: {
      code: 'CS301',
      name: 'Data Structures & Algorithms',
      program: 'B.Tech',
      branch: 'Computer Science & Engineering',
      semester: 3,
      credits: 4,
      facultyName: 'Dr. S. Ramanujan',
    },
  });

  const subCOA = await prisma.subject.create({
    data: {
      code: 'CS302',
      name: 'Computer Organization & Architecture',
      program: 'B.Tech',
      branch: 'Computer Science & Engineering',
      semester: 3,
      credits: 3,
      facultyName: 'Prof. Ananya Sen',
    },
  });

  const subDBMS = await prisma.subject.create({
    data: {
      code: 'CS303',
      name: 'Database Management Systems',
      program: 'B.Tech',
      branch: 'Computer Science & Engineering',
      semester: 3,
      credits: 4,
      facultyName: 'Dr. Rajesh Kulkarni',
    },
  });

  const subDM = await prisma.subject.create({
    data: {
      code: 'MA301',
      name: 'Discrete Mathematics',
      program: 'B.Tech',
      branch: 'Computer Science & Engineering',
      semester: 3,
      credits: 3,
      facultyName: 'Dr. Meenakshi Sundaram',
    },
  });

  // Timetable slots Monday to Friday (1=Mon ... 5=Fri)
  await prisma.timetableSlot.createMany({
    data: [
      // Monday
      { subjectId: subDSA.id, dayOfWeek: 1, startTime: '09:00', endTime: '10:00', room: 'LH-101' },
      { subjectId: subCOA.id, dayOfWeek: 1, startTime: '10:15', endTime: '11:15', room: 'LH-101' },
      { subjectId: subDBMS.id, dayOfWeek: 1, startTime: '11:30', endTime: '12:30', room: 'CS-Lab 2' },
      // Tuesday
      { subjectId: subDM.id, dayOfWeek: 2, startTime: '09:00', endTime: '10:00', room: 'LH-102' },
      { subjectId: subDSA.id, dayOfWeek: 2, startTime: '10:15', endTime: '11:15', room: 'LH-101' },
      { subjectId: subCOA.id, dayOfWeek: 2, startTime: '11:30', endTime: '12:30', room: 'LH-101' },
      // Wednesday
      { subjectId: subCOA.id, dayOfWeek: 3, startTime: '09:00', endTime: '10:00', room: 'LH-101' },
      { subjectId: subDBMS.id, dayOfWeek: 3, startTime: '10:15', endTime: '11:15', room: 'CS-Lab 2' },
      { subjectId: subDM.id, dayOfWeek: 3, startTime: '11:30', endTime: '12:30', room: 'LH-102' },
      // Thursday
      { subjectId: subDSA.id, dayOfWeek: 4, startTime: '09:00', endTime: '10:00', room: 'LH-101' },
      { subjectId: subDBMS.id, dayOfWeek: 4, startTime: '10:15', endTime: '11:15', room: 'CS-Lab 2' },
      // Friday
      { subjectId: subCOA.id, dayOfWeek: 5, startTime: '09:00', endTime: '10:00', room: 'LH-101' },
      { subjectId: subDM.id, dayOfWeek: 5, startTime: '10:15', endTime: '11:15', room: 'LH-102' },
      { subjectId: subDSA.id, dayOfWeek: 5, startTime: '11:30', endTime: '12:30', room: 'LH-101' },
    ],
  });

  // Seed 3 weeks of attendance history (days -21 to -1)
  // CS301 (DSA): 12 classes total, 10 attended, 2 missed = 83.3% (Sits right above 80% threshold!)
  // If student misses 1 more, it drops to 10/13 = 76.9% (< 80%) immediately triggering the alert banner!
  const today = dayjs().startOf('day');

  // CS301 (DSA) - 10 Present, 2 Absent (83%)
  const dsaDays = [20, 18, 16, 15, 13, 11, 9, 8, 6, 4, 3, 1];
  for (let i = 0; i < dsaDays.length; i++) {
    const isAbsent = i === 1 || i === 7; // exactly 2 missed
    await prisma.attendanceRecord.create({
      data: {
        studentId: studentAarav.id,
        subjectId: subDSA.id,
        date: today.subtract(dsaDays[i], 'day').toDate(),
        status: isAbsent ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT,
      },
    });
  }

  // CS302 (COA) - 10 classes, 9 attended, 1 missed (90%)
  const coaDays = [19, 17, 15, 12, 10, 8, 5, 4, 2, 1];
  for (let i = 0; i < coaDays.length; i++) {
    const isAbsent = i === 4;
    await prisma.attendanceRecord.create({
      data: {
        studentId: studentAarav.id,
        subjectId: subCOA.id,
        date: today.subtract(coaDays[i], 'day').toDate(),
        status: isAbsent ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT,
      },
    });
  }

  // CS303 (DBMS) - 9 classes, 8 attended, 1 missed (88.9%)
  const dbmsDays = [19, 16, 14, 12, 9, 7, 5, 3, 2];
  for (let i = 0; i < dbmsDays.length; i++) {
    const isAbsent = i === 3;
    await prisma.attendanceRecord.create({
      data: {
        studentId: studentAarav.id,
        subjectId: subDBMS.id,
        date: today.subtract(dbmsDays[i], 'day').toDate(),
        status: isAbsent ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT,
      },
    });
  }

  // MA301 (DM) - 9 classes, 8 attended, 1 missed (88.9%)
  const dmDays = [20, 17, 14, 13, 10, 7, 6, 4, 2];
  for (let i = 0; i < dmDays.length; i++) {
    const isAbsent = i === 2;
    await prisma.attendanceRecord.create({
      data: {
        studentId: studentAarav.id,
        subjectId: subDM.id,
        date: today.subtract(dmDays[i], 'day').toDate(),
        status: isAbsent ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT,
      },
    });
  }

  console.log('[Seed] Attendance subjects, slots, and 3-week history seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
