import { Router } from 'express';
import { PrismaClient, AttendanceStatus } from '@prisma/client';
import { requireAuth } from '../middlewares/auth.middleware';
import dayjs from 'dayjs';

const router = Router();
const prisma = new PrismaClient();

// Helper to calculate student summary & percentages on server
async function calculateStudentAttendanceSummary(studentId: string, branch: string, semester: number) {
  const subjects = await prisma.subject.findMany({
    where: { branch, semester },
    include: {
      attendanceRecords: {
        where: { studentId },
      },
    },
    orderBy: { code: 'asc' },
  });

  let totalClassesOverall = 0;
  let attendedClassesOverall = 0;

  const subjectStats = subjects.map((sub) => {
    const total = sub.attendanceRecords.length;
    const attended = sub.attendanceRecords.filter((r) => r.status === AttendanceStatus.PRESENT).length;
    const percentage = total > 0 ? Math.round((attended / total) * 100) : 100;

    totalClassesOverall += total;
    attendedClassesOverall += attended;

    // Calculate how many more classes can be missed to stay at or above 80% (0.8 * (total + X) <= attended)
    // or how many consecutive classes must be attended to reach 80%
    let canMissOrNeed = 0;
    let statusText = '';
    if (percentage >= 80) {
      // can miss: attended / (total + M) >= 0.8 => M <= (attended / 0.8) - total
      const canMiss = Math.floor(attended / 0.8 - total);
      canMissOrNeed = Math.max(0, canMiss);
      statusText = canMissOrNeed === 0 ? 'On the edge (cannot miss next class)' : `Can miss ${canMissOrNeed} more class${canMissOrNeed > 1 ? 'es' : ''}`;
    } else {
      // need to attend: (attended + N) / (total + N) >= 0.8 => attended + N >= 0.8*total + 0.8*N => 0.2*N >= 0.8*total - attended
      const need = Math.ceil((0.8 * total - attended) / 0.2);
      canMissOrNeed = Math.max(1, need);
      statusText = `Must attend next ${canMissOrNeed} class${canMissOrNeed > 1 ? 'es' : ''} to reach 80%`;
    }

    return {
      id: sub.id,
      code: sub.code,
      name: sub.name,
      credits: sub.credits,
      facultyName: sub.facultyName,
      attended,
      total,
      percentage,
      statusText,
      canMissCount: percentage >= 80 ? canMissOrNeed : 0,
      mustAttendCount: percentage < 80 ? canMissOrNeed : 0,
    };
  });

  const overallPercentage =
    totalClassesOverall > 0 ? Math.round((attendedClassesOverall / totalClassesOverall) * 100) : 100;

  return {
    overallPercentage,
    totalClassesOverall,
    attendedClassesOverall,
    subjects: subjectStats,
  };
}

// GET /api/attendance/summary
router.get('/attendance/summary', requireAuth, async (req, res, next) => {
  try {
    const student = await prisma.studentProfile.findUnique({ where: { userId: req.user!.id } });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const summary = await calculateStudentAttendanceSummary(req.user!.id, student.branch, student.semester);

    // Active attendance alert (below 80%)
    const activeAlerts = await prisma.attendanceAlert.findMany({
      where: {
        studentId: req.user!.id,
        dismissedAt: null,
      },
      include: { subject: { select: { name: true, code: true } } },
    });

    res.json({ success: true, data: { ...summary, alerts: activeAlerts } });
  } catch (err) {
    next(err);
  }
});

// GET /api/attendance/today (Classes for today or specific date within 7 days)
router.get('/attendance/today', requireAuth, async (req, res, next) => {
  try {
    const student = await prisma.studentProfile.findUnique({ where: { userId: req.user!.id } });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const targetDateStr = (req.query.date as string) || dayjs().format('YYYY-MM-DD');
    const targetDate = dayjs(targetDateStr).startOf('day');
    const today = dayjs().startOf('day');

    // Reject future dates
    if (targetDate.isAfter(today)) {
      return res.status(400).json({ error: 'Cannot query attendance for future dates' });
    }

    // Enforce 7-day limit
    if (today.diff(targetDate, 'day') > 7) {
      return res.status(400).json({ error: 'Attendance is editable only for the past 7 days' });
    }

    // Day of week: 1 = Monday ... 7 = Sunday
    let dayOfWeek = targetDate.day();
    if (dayOfWeek === 0) dayOfWeek = 7;

    const slots = await prisma.timetableSlot.findMany({
      where: {
        dayOfWeek,
        subject: {
          branch: student.branch,
          semester: student.semester,
        },
      },
      include: {
        subject: true,
      },
      orderBy: { startTime: 'asc' },
    });

    // Check existing records for student on targetDate
    const existingRecords = await prisma.attendanceRecord.findMany({
      where: {
        studentId: req.user!.id,
        date: targetDate.toDate(),
      },
    });

    const recordMap = new Map(existingRecords.map((r) => [r.subjectId, r.status]));

    const classesWithStatus = slots.map((slot) => ({
      slotId: slot.id,
      subjectId: slot.subjectId,
      code: slot.subject.code,
      name: slot.subject.name,
      room: slot.room,
      startTime: slot.startTime,
      endTime: slot.endTime,
      facultyName: slot.subject.facultyName,
      status: recordMap.get(slot.subjectId) || null, // 'PRESENT' | 'ABSENT' | null
    }));

    res.json({
      success: true,
      data: {
        date: targetDate.format('YYYY-MM-DD'),
        dayName: targetDate.format('dddd'),
        classes: classesWithStatus,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/attendance (Mark or correct attendance: user ID from session)
router.put('/attendance', requireAuth, async (req, res, next) => {
  try {
    const student = await prisma.studentProfile.findUnique({ where: { userId: req.user!.id } });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const { subjectId, date: dateStr, status } = req.body;
    if (!subjectId || !dateStr || !['PRESENT', 'ABSENT'].includes(status)) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    const markDate = dayjs(dateStr).startOf('day');
    const today = dayjs().startOf('day');

    // Future date rejection
    if (markDate.isAfter(today)) {
      return res.status(400).json({ error: 'Future dates are rejected by the server.' });
    }

    // Past 7-day rule
    if (today.diff(markDate, 'day') > 7) {
      return res.status(400).json({ error: 'Attendance can only be marked or updated for the past 7 days.' });
    }

    // Upsert record: unique per student + subject + date
    const record = await prisma.attendanceRecord.upsert({
      where: {
        studentId_subjectId_date: {
          studentId: req.user!.id,
          subjectId,
          date: markDate.toDate(),
        },
      },
      update: {
        status: status as AttendanceStatus,
        markedAt: new Date(),
      },
      create: {
        studentId: req.user!.id,
        subjectId,
        date: markDate.toDate(),
        status: status as AttendanceStatus,
      },
    });

    // Re-calculate subject attendance to check 80% threshold crossing
    const subjectRecords = await prisma.attendanceRecord.findMany({
      where: { studentId: req.user!.id, subjectId },
    });
    const total = subjectRecords.length;
    const attended = subjectRecords.filter((r) => r.status === AttendanceStatus.PRESENT).length;
    const percentage = total > 0 ? (attended / total) * 100 : 100;

    let triggeredAlert = false;
    let alertMessage = '';

    // Trigger alert ONLY once per crossing below threshold
    if (percentage < 80.0) {
      const existingAlert = await prisma.attendanceAlert.findFirst({
        where: {
          studentId: req.user!.id,
          subjectId,
          resolvedAt: null,
        },
      });

      if (!existingAlert) {
        const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
        await prisma.attendanceAlert.create({
          data: {
            studentId: req.user!.id,
            subjectId,
            threshold: 80.0,
            percentageAtAlert: Math.round(percentage),
            sentAt: new Date(),
          },
        });
        triggeredAlert = true;
        alertMessage = `Warning: Attendance in ${subject?.name || 'Subject'} dropped below 80% (${Math.round(percentage)}%)`;
      }
    } else {
      // Student recovered above 80%, resolve prior alerts so future drop can re-alert
      await prisma.attendanceAlert.updateMany({
        where: {
          studentId: req.user!.id,
          subjectId,
          resolvedAt: null,
        },
        data: { resolvedAt: new Date() },
      });
    }

    const summary = await calculateStudentAttendanceSummary(req.user!.id, student.branch, student.semester);

    res.json({
      success: true,
      data: {
        record,
        summary,
        triggeredAlert,
        alertMessage,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/attendance/alerts/:id/dismiss (dismiss banner on Today page)
router.patch('/attendance/alerts/:id/dismiss', requireAuth, async (req, res, next) => {
  try {
    await prisma.attendanceAlert.updateMany({
      where: { id: req.params.id, studentId: req.user!.id },
      data: { dismissedAt: new Date() },
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
