import { PrismaClient, Role, AttendanceStatus } from '@prisma/client';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[EnrollStudents] Scanning for students needing enrollment and subject setup...');

  const students = await prisma.user.findMany({
    where: { role: Role.STUDENT },
    include: { studentProfile: true },
  });

  console.log(`[EnrollStudents] Found ${students.length} student account(s).`);

  let enrolledCount = 0;

  for (const student of students) {
    let profile = student.studentProfile;

    // 1. Ensure StudentProfile exists
    if (!profile) {
      const branch = student.registrationBranch || 'Computer Science & Engineering';
      const semester = student.registrationSemester || 3;
      const year = new Date().getFullYear();
      const branchAbbr = branch.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 3) || 'CSE';
      const collegeId = `${year}${branchAbbr}${Math.floor(1000 + Math.random() * 9000)}`;

      const subjectEntry = await prisma.subject.findFirst({
        where: { branch, semester },
      });
      const program = subjectEntry?.program || 'B.Tech';

      profile = await prisma.studentProfile.create({
        data: {
          userId: student.id,
          collegeId,
          program,
          branch,
          semester,
          yearOfStudy: Math.min(4, Math.max(1, Math.ceil(semester / 2))),
        },
      });
      console.log(`[EnrollStudents] Created missing StudentProfile for ${student.email}.`);
    }

    // 2. Ensure Enrollment record exists
    await prisma.enrollment.upsert({
      where: { studentEmail: student.email },
      create: {
        studentEmail: student.email,
        program: profile.program,
        branch: profile.branch,
        semester: profile.semester,
      },
      update: {
        program: profile.program,
        branch: profile.branch,
        semester: profile.semester,
      },
    });

    // 3. Ensure AttendanceSettings exists
    await prisma.attendanceSettings.upsert({
      where: { studentId: student.id },
      create: {
        studentId: student.id,
        alertThreshold: 80.0,
      },
      update: {},
    });

    // 4. Find matching subjects for their branch and semester
    const subjects = await prisma.subject.findMany({
      where: { branch: profile.branch, semester: profile.semester },
    });

    // 5. Seed baseline attendance records if missing
    const today = dayjs().startOf('day');
    const pastDays = [20, 18, 16, 14, 12, 10, 8, 6, 4, 2];
    let createdRecords = 0;

    for (const sub of subjects) {
      const existing = await prisma.attendanceRecord.count({
        where: { studentId: student.id, subjectId: sub.id },
      });
      if (existing === 0) {
        for (let i = 0; i < pastDays.length; i++) {
          const isAbsent = i === 1 || i === 7;
          await prisma.attendanceRecord.create({
            data: {
              studentId: student.id,
              subjectId: sub.id,
              date: today.subtract(pastDays[i], 'day').toDate(),
              status: isAbsent ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT,
            },
          });
          createdRecords++;
        }
      }
    }

    enrolledCount++;
    console.log(
      `[EnrollStudents] Verified enrollment for ${student.fullName} (${student.email}) in ${subjects.length} subjects (${profile.branch}, Sem ${profile.semester}). Added ${createdRecords} baseline attendance records.`
    );
  }

  console.log(`[EnrollStudents] Successfully enrolled and verified ${enrolledCount} student(s).`);
}

main()
  .catch((err) => {
    console.error('[EnrollStudents] Error:', err.message || err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
