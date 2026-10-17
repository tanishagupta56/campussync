import { Router } from 'express';
import { PrismaClient, AttendanceStatus } from '@prisma/client';
import { requireAuth } from '../middlewares/auth.middleware';
import dayjs from 'dayjs';

const router = Router();
const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Attendance rules (can be changed on Render without editing code):
//   CLASSES_PER_SUBJECT  total classes planned per subject in a semester (default 35)
//   ATTENDANCE_TARGET    minimum attendance percentage required (default 75)
// ---------------------------------------------------------------------------
const PLANNED_CLASSES = Number(process.env.CLASSES_PER_SUBJECT) || 35;
const TARGET_PERCENT = Number(process.env.ATTENDANCE_TARGET) || 75;

type AttendanceStatusLabel = 'SAFE' | 'ON_TRACK' | 'AT_RISK' | 'UNREACHABLE';

const classes = (n: number) => `${n} class${n === 1 ? '' : 'es'}`;

// Pure calculation for one subject.
// "held" = classes marked so far (attended + missed). Percentage is based on
// classes held so far, NOT on the full semester, so 10 of 10 shows as 100%.
export function computeSubjectAttendance(attended: number, held: number) {
  const plannedTotal = Math.max(PLANNED_CLASSES, held);
  // Integer maths first to avoid floating-point rounding (75 * 35 / 100 = 26.25 -> 27)
  const requiredToPass = Math.ceil((TARGET_PERCENT * plannedTotal) / 100);
  const remaining = plannedTotal - held;
  const needMore = Math.max(0, requiredToPass - attended);
  const reachable = needMore <= remaining;
  const canStillMiss = reachable ? remaining - needMore : 0;
  const percentage = held > 0 ? Math.round((attended / held) * 100) : 100;

  let status: AttendanceStatusLabel;
  let statusText: string;
  if (needMore === 0) {
    status = 'SAFE';
    statusText = `Target reached: ${attended} of ${requiredToPass} required classes attended`;
  } else if (!reachable) {
    status = 'UNREACHABLE';
    statusText = `${TARGET_PERCENT}% no longer reachable: ${needMore} needed but only ${classes(remaining)} left`;
  } else if (percentage >= TARGET_PERCENT) {
    status = 'ON_TRACK';
    statusText = `Attend ${needMore} of the remaining ${classes(remaining)} · can miss ${canStillMiss} more`;
  } else {
    status = 'AT_RISK';
    statusText = `Attend ${needMore} of the remaining ${classes(remaining)} to reach ${TARGET_PERCENT}% · can miss ${canStillMiss} more`;
  }

  return {
    percentage,
    plannedTotal,
    requiredToPass,
    remaining,
    needMore,
    canStillMiss,
    reachable,
    status,
    statusText,
  };
}

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

    totalClassesOverall += total;
    attendedClassesOverall += attended;

    const calc = computeSubjectAttendance(attended, total);

    return {
      id: sub.id,
      code: sub.code,
      name: sub.name,
      credits: sub.credits,
      facultyName: sub.facultyName,
      attended,
      total,
      percentage: calc.percentage,
      statusText: calc.statusText,
      canMissCount: calc.canStillMiss,
      mustAttendCount: calc.needMore,
      plannedTotal: calc.plannedTotal,
      requiredToPass: calc.requiredToPass,
      remaining: calc.remaining,
      reachable: calc.reachable,
      status: calc.status,
    };
  });

  const overallPercentage =
    totalClassesOverall > 0 ? Math.round((attendedClassesOverall / totalClassesOverall) * 100) : 100;

  return {
    overallPercentage,
    totalClassesOverall,
    attendedClassesOverall,
    targetPercentage: TARGET_PERCENT,
    plannedPerSubject: PLANNED_CLASSES,
    subjects: subjectStats,
  };
}

// GET /api/attendance/summary
router.get('/attendance/summary', requireAuth, async (req, res, next) => {
  try {
    const student = await prisma.studentProfile.findUnique({ where: { userId: req.user!.id } });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const summary = await calculateStudentAttendanceSummary(req.user!.id, student.branch, student.semester);

    // Active attendance alerts (subjects at risk or no longer reachable)
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
    let dayOfWeek: number = targetDate.day();
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

    // Re-calculate this subject to check whether it is now at risk
    const subjectRecords = await prisma.attendanceRecord.findMany({
      where: { studentId: req.user!.id, subjectId },
    });
    const total = subjectRecords.length;
    const attended = subjectRecords.filter((r) => r.status === AttendanceStatus.PRESENT).length;
    const calc = computeSubjectAttendance(attended, total);
    const isRisky = calc.status === 'AT_RISK' || calc.status === 'UNREACHABLE';

    let triggeredAlert = false;
    let alertMessage = '';

    // Trigger alert ONLY once per crossing into "at risk"
    if (isRisky) {
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
            threshold: TARGET_PERCENT,
            percentageAtAlert: calc.percentage,
            sentAt: new Date(),
          },
        });
        triggeredAlert = true;
        alertMessage = calc.reachable
          ? `Warning: ${subject?.name || 'Subject'} is below ${TARGET_PERCENT}% (${calc.percentage}%). Attend ${calc.needMore} of the remaining ${classes(calc.remaining)}.`
          : `Warning: ${TARGET_PERCENT}% is no longer reachable in ${subject?.name || 'Subject'}.`;
      }
    } else {
      // Student is back on track: resolve prior alerts so a future drop can re-alert
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
