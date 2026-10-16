import { Router } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import dayjs from 'dayjs';
import { config } from '../config/env';

const router = Router();
const prisma = new PrismaClient();

// GET /api/config (public)
router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: {
      devShowOtp: config.devShowOtp,
    },
  });
});

// GET /api/meta/programs (public)
router.get('/meta/programs', async (req, res, next) => {
  try {
    const subjects = await prisma.subject.findMany({
      select: { program: true, branch: true, semester: true },
      distinct: ['program', 'branch', 'semester'],
      orderBy: [{ branch: 'asc' }, { semester: 'asc' }],
    });

    const branchMap = new Map<string, { program: string; branch: string; semesters: number[] }>();
    for (const sub of subjects) {
      if (!branchMap.has(sub.branch)) {
        branchMap.set(sub.branch, { program: sub.program, branch: sub.branch, semesters: [] });
      }
      const item = branchMap.get(sub.branch)!;
      if (!item.semesters.includes(sub.semester)) {
        item.semesters.push(sub.semester);
      }
    }

    const programs = Array.from(branchMap.values()).map(b => ({
      ...b,
      semesters: b.semesters.sort((a, b) => a - b),
    }));

    res.json({
      success: true,
      data: {
        programs,
        combinations: subjects,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/announcements
router.get('/announcements', requireAuth, async (req, res, next) => {
  try {
    const { search, source, department } = req.query;
    const where: any = {};
    if (search && typeof search === 'string') {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (source && typeof source === 'string') where.sourceCategory = source;

    if (department && typeof department === 'string') {
      where.OR = [
        { targetDepartment: null },
        { targetDepartment: { contains: department, mode: 'insensitive' } },
      ];
    } else if (req.user?.role === Role.STUDENT) {
      // Show those targeted to everyone, plus those matching the student's branch/semester
      const student = await prisma.studentProfile.findUnique({
        where: { userId: req.user.id },
      });
      if (student) {
        const branchVariants = [student.branch];
        if (student.branch.toLowerCase().includes('computer')) {
          branchVariants.push('CSE', 'Computer Science');
        } else if (student.branch.toLowerCase().includes('mechanical')) {
          branchVariants.push('ME', 'Mechanical');
        } else if (student.branch.toLowerCase().includes('electrical')) {
          branchVariants.push('EE', 'Electrical');
        } else if (student.branch.toLowerCase().includes('civil')) {
          branchVariants.push('CE', 'Civil');
        }

        where.AND = where.AND || [];
        where.AND.push({
          OR: [
            { targetDepartment: null },
            { targetDepartment: '' },
            ...branchVariants.map((v) => ({ targetDepartment: { contains: v, mode: 'insensitive' as const } })),
          ],
        });

        if (student.semester !== null && student.semester !== undefined) {
          where.AND.push({
            OR: [
              { targetSemester: null },
              { targetSemester: student.semester },
            ],
          });
        }
      }
    }

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: { author: { select: { id: true, fullName: true, role: true } } },
    });
    res.json({ success: true, data: announcements });
  } catch (err) {
    next(err);
  }
});

// POST /api/announcements
router.post('/announcements', requireAuth, requireRole(Role.ADMINISTRATOR, Role.FACULTY, Role.CLUB_CORE), async (req, res, next) => {
  try {
    const { title, content, priority, targetDepartment } = req.body;
    const isVerifiedByAdmin = req.user?.role === Role.ADMINISTRATOR;
    const sourceCategory = req.user?.role === Role.ADMINISTRATOR ? 'ADMINISTRATION' : req.user?.role === Role.FACULTY ? 'FACULTY' : 'CLUB';

    const item = await prisma.announcement.create({
      data: {
        title,
        content,
        priority: priority || 'NORMAL',
        targetDepartment: targetDepartment || null,
        sourceCategory,
        isVerifiedByAdmin,
        authorId: req.user!.id,
        authorRole: req.user!.role,
      },
    });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/announcements/:id
router.delete('/announcements/:id', requireAuth, requireRole(Role.ADMINISTRATOR), async (req, res, next) => {
  try {
    await prisma.announcement.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Announcement deleted.' });
  } catch (err) {
    next(err);
  }
});

// GET /api/events
router.get('/events', requireAuth, async (req, res, next) => {
  try {
    const { category } = req.query;
    const where: any = { isPublic: true };
    if (category && typeof category === 'string' && category !== 'ALL') where.category = category;

    const events: any[] = await prisma.event.findMany({
      where,
      orderBy: { startTime: 'asc' },
      include: {
        club: { select: { name: true, category: true } },
        organizer: { select: { fullName: true, role: true } },
      },
    });

    // For students: include scheduled academic lectures linked to enrolled subjects
    if (req.user?.role === Role.STUDENT && (!category || category === 'ALL' || category === 'ACADEMIC')) {
      const student = await prisma.studentProfile.findUnique({
        where: { userId: req.user.id },
      });
      if (student) {
        const slots = await prisma.timetableSlot.findMany({
          where: {
            subject: {
              branch: student.branch,
              semester: student.semester,
            },
          },
          include: { subject: true },
        });

        const startOfWeek = dayjs().startOf('week'); // Sunday
        for (const slot of slots) {
          const slotDate = startOfWeek.add(slot.dayOfWeek, 'day');
          const [startHour, startMin] = slot.startTime.split(':').map(Number);
          const [endHour, endMin] = slot.endTime.split(':').map(Number);

          const startDateTime = slotDate.hour(startHour).minute(startMin).second(0).toDate();
          const endDateTime = slotDate.hour(endHour).minute(endMin).second(0).toDate();

          events.push({
            id: `timetable-${slot.id}-${slotDate.format('YYYYMMDD')}`,
            title: `${slot.subject.code}: ${slot.subject.name}`,
            description: `Scheduled academic lecture session for ${slot.subject.name}. Room: ${slot.room}${slot.subject.facultyName ? ` • Faculty: ${slot.subject.facultyName}` : ''}`,
            category: 'ACADEMIC',
            location: slot.room,
            startTime: startDateTime,
            endTime: endDateTime,
            organizerId: req.user.id,
            clubId: null,
            isPublic: true,
            createdAt: startDateTime,
            updatedAt: startDateTime,
            organizer: { fullName: slot.subject.facultyName || 'Academic Faculty', role: 'FACULTY' },
          });
        }

        events.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      }
    }

    res.json({ success: true, data: events });
  } catch (err) {
    next(err);
  }
});

// POST /api/events
router.post('/events', requireAuth, requireRole(Role.ADMINISTRATOR, Role.FACULTY, Role.CLUB_CORE), async (req, res, next) => {
  try {
    const { title, description, category, location, startTime, endTime } = req.body;
    const event = await prisma.event.create({
      data: {
        title,
        description: description || '',
        category: category || 'CAMPUS',
        location: location || 'Campus',
        startTime: new Date(startTime),
        endTime: new Date(endTime || startTime),
        organizerId: req.user!.id,
        isPublic: true,
      },
    });
    res.json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
});

// GET /api/deadlines
router.get('/deadlines', requireAuth, async (req, res, next) => {
  try {
    const { category } = req.query;
    const where: any = {};
    if (category && typeof category === 'string' && category !== 'ALL') where.category = category;

    if (req.user?.role === Role.STUDENT) {
      const student = await prisma.studentProfile.findUnique({
        where: { userId: req.user.id },
      });
      if (student) {
        const enrolledSubjects = await prisma.subject.findMany({
          where: { branch: student.branch, semester: student.semester },
          select: { code: true, name: true },
        });
        const subjectCodes = enrolledSubjects.map((s) => s.code);

        const branchVariants = [student.branch];
        if (student.branch.toLowerCase().includes('computer')) {
          branchVariants.push('CSE', 'Computer Science');
        } else if (student.branch.toLowerCase().includes('mechanical')) {
          branchVariants.push('ME', 'Mechanical');
        } else if (student.branch.toLowerCase().includes('electrical')) {
          branchVariants.push('EE', 'Electrical');
        }

        const deadlineFilters: any[] = [
          // General / all-campus deadlines
          { department: null, semester: null },
          // Branch / semester targeted deadlines
          {
            OR: branchVariants.map((v) => ({ department: { contains: v, mode: 'insensitive' as const } })),
            ...(student.semester ? { OR: [{ semester: null }, { semester: student.semester }] } : {}),
          },
        ];

        // Deadlines linked to enrolled subject codes
        for (const code of subjectCodes) {
          deadlineFilters.push({ title: { contains: code, mode: 'insensitive' as const } });
          deadlineFilters.push({ description: { contains: code, mode: 'insensitive' as const } });
        }

        where.AND = where.AND || [];
        where.AND.push({ OR: deadlineFilters });
      }
    }

    const deadlines = await prisma.deadline.findMany({
      where,
      orderBy: { dueDate: 'asc' },
    });
    res.json({ success: true, data: deadlines });
  } catch (err) {
    next(err);
  }
});

// POST /api/deadlines
router.post('/deadlines', requireAuth, requireRole(Role.ADMINISTRATOR, Role.FACULTY), async (req, res, next) => {
  try {
    const { title, description, dueDate, category, source } = req.body;
    const deadline = await prisma.deadline.create({
      data: {
        title,
        description: description || '',
        dueDate: new Date(dueDate),
        category: category || 'ACADEMIC',
        source: source || 'Administration',
      },
    });
    res.json({ success: true, data: deadline });
  } catch (err) {
    next(err);
  }
});

// GET /api/library
router.get('/library', requireAuth, async (req, res, next) => {
  try {
    let library = await prisma.library.findFirst();
    if (!library) {
      library = await prisma.library.create({
        data: { id: 'campus-main-library', name: 'Central University Library', capacity: 200, occupied: 68, lastUpdated: new Date() },
      });
    }
    const available = Math.max(0, library.capacity - library.occupied);
    const occupancyPercentage = library.capacity > 0 ? Math.round((library.occupied / library.capacity) * 100) : 0;
    res.json({ success: true, data: { ...library, available, occupancyPercentage } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/library
router.patch('/library', requireAuth, requireRole(Role.ADMINISTRATOR), async (req, res, next) => {
  try {
    const { delta, capacity: newCapacity } = req.body;
    let library = await prisma.library.findFirst();
    if (!library) {
      library = await prisma.library.create({
        data: { id: 'campus-main-library', name: 'Central University Library', capacity: 200, occupied: 68, lastUpdated: new Date() },
      });
    }

    const targetCap = typeof newCapacity === 'number' && newCapacity > 0 ? newCapacity : library.capacity;
    let newOccupied = library.occupied;
    if (typeof delta === 'number') {
      newOccupied = Math.min(targetCap, Math.max(0, library.occupied + delta));
    }

    const updated = await prisma.library.update({
      where: { id: library.id },
      data: {
        occupied: newOccupied,
        capacity: targetCap,
        lastUpdated: new Date(),
        updatedById: req.user!.id,
      },
    });

    const available = Math.max(0, updated.capacity - updated.occupied);
    const occupancyPercentage = Math.round((updated.occupied / updated.capacity) * 100);
    res.json({ success: true, data: { ...updated, available, occupancyPercentage } });
  } catch (err) {
    next(err);
  }
});

// ==================== LOST & FOUND ====================
// GET /api/lost-found (active items, not resolved, <= 30 days old calculated)
router.get('/lost-found', requireAuth, async (req, res, next) => {
  try {
    const thirtyDaysAgo = dayjs().subtract(30, 'day').toDate();
    const items = await prisma.lostItem.findMany({
      where: {
        isResolved: false,
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
});

// POST /api/lost-found
router.post('/lost-found', requireAuth, async (req, res, next) => {
  try {
    const { title, description, locationLost, dateLost, timeLost, contactEmail, contactPhone, imageUrl } = req.body;
    const item = await prisma.lostItem.create({
      data: {
        title,
        description,
        locationLost,
        dateLost: new Date(dateLost),
        timeLost: timeLost || null,
        contactEmail: contactEmail || req.user!.email,
        contactPhone: contactPhone || null,
        imageUrl: imageUrl || null,
        userId: req.user!.id,
        isResolved: false,
      },
    });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/lost-found/:id/found (only owner or admin can mark found)
router.patch('/lost-found/:id/found', requireAuth, async (req, res, next) => {
  try {
    const item = await prisma.lostItem.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    if (item.userId !== req.user!.id && req.user!.role !== Role.ADMINISTRATOR) {
      return res.status(403).json({ error: 'Forbidden', message: 'Only post creator or administrator can mark item found.' });
    }

    const updated = await prisma.lostItem.update({
      where: { id: req.params.id },
      data: { isResolved: true, resolvedAt: new Date() },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// ==================== CONNECT (MENTORS) ====================
// GET /api/mentors
router.get('/mentors', requireAuth, async (req, res, next) => {
  try {
    const { branch, interest } = req.query;

    // Fetch current user's student profile for branch prioritization
    const currentStudent = await prisma.studentProfile.findUnique({
      where: { userId: req.user!.id },
    });

    const where: any = { isAvailable: true };
    if (interest && typeof interest === 'string') {
      where.interests = { has: interest };
    }

    const mentors = await prisma.mentorProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            studentProfile: true,
          },
        },
      },
    });

    // Sanitise according to privacy toggles & apply branch filter
    let results = mentors
      .filter((m) => {
        if (branch && typeof branch === 'string' && branch !== 'ALL') {
          return m.user.studentProfile?.branch === branch;
        }
        return true;
      })
      .map((m) => {
        return {
          id: m.id,
          userId: m.userId,
          fullName: m.user.fullName,
          program: m.user.studentProfile?.program || 'B.Tech',
          branch: m.user.studentProfile?.branch || 'Engineering',
          yearOfStudy: m.user.studentProfile?.yearOfStudy || 3,
          bio: m.bio,
          interests: m.interests,
          email: m.shareEmail ? m.user.email : null,
          phone: m.sharePhone ? m.user.phone : null,
          linkedInUrl: m.shareLinkedIn ? m.linkedInUrl : null,
          isSameBranch: currentStudent ? m.user.studentProfile?.branch === currentStudent.branch : false,
        };
      });

    // Sort: Same-branch first, then alphabetically
    results.sort((a, b) => {
      if (a.isSameBranch && !b.isSameBranch) return -1;
      if (!a.isSameBranch && b.isSameBranch) return 1;
      return a.fullName.localeCompare(b.fullName);
    });

    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/mentors/availability (Year 2+ check on server)
router.patch('/mentors/availability', requireAuth, async (req, res, next) => {
  try {
    const student = await prisma.studentProfile.findUnique({ where: { userId: req.user!.id } });
    if (!student || student.yearOfStudy < 2) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only students in Year 2 or above are eligible to mentor.',
      });
    }

    const { isAvailable, bio, interests, shareEmail, sharePhone, shareLinkedIn, linkedInUrl } = req.body;

    const mentor = await prisma.mentorProfile.upsert({
      where: { userId: req.user!.id },
      create: {
        userId: req.user!.id,
        isAvailable: Boolean(isAvailable),
        bio: bio || 'Available to guide fellow students.',
        interests: Array.isArray(interests) ? interests : ['General Academics', 'Career Advice'],
        shareEmail: shareEmail ?? true,
        sharePhone: sharePhone ?? false,
        shareLinkedIn: shareLinkedIn ?? false,
        linkedInUrl: linkedInUrl || null,
      },
      update: {
        ...(typeof isAvailable === 'boolean' ? { isAvailable } : {}),
        ...(bio !== undefined ? { bio } : {}),
        ...(Array.isArray(interests) ? { interests } : {}),
        ...(typeof shareEmail === 'boolean' ? { shareEmail } : {}),
        ...(typeof sharePhone === 'boolean' ? { sharePhone } : {}),
        ...(typeof shareLinkedIn === 'boolean' ? { shareLinkedIn } : {}),
        ...(linkedInUrl !== undefined ? { linkedInUrl } : {}),
      },
    });

    res.json({ success: true, data: mentor });
  } catch (err) {
    next(err);
  }
});

// ==================== SCHOLARSHIPS ====================
// GET /api/scholarships (students browse, filter, search, saved status, recipient/mentor metrics)
router.get('/scholarships', requireAuth, async (req, res, next) => {
  try {
    const { search, branch } = req.query;
    const where: any = { isDeleted: false };

    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { provider: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (branch && typeof branch === 'string' && branch !== 'ALL') {
      where.OR = [{ branch: null }, { branch }];
    }

    const scholarships = await prisma.scholarship.findMany({
      where,
      orderBy: { deadline: 'asc' },
      include: {
        savedBy: {
          where: { studentId: req.user!.id },
          select: { id: true, status: true },
        },
        recipients: {
          include: {
            student: {
              include: {
                mentorProfile: true,
              },
            },
          },
        },
      },
    });

    const enriched = scholarships.map((s) => {
      const recipientCount = s.recipients.length;
      const mentorsAvailableCount = s.recipients.filter(
        (r) => r.student.mentorProfile && r.student.mentorProfile.isAvailable
      ).length;
      const isSaved = s.savedBy.length > 0;
      const applicationStatus = s.savedBy[0]?.status || null;

      // Sanitise: remove raw student user objects to prevent leakage of personal data
      const { recipients, savedBy, ...rest } = s;

      return {
        ...rest,
        recipientCount,
        mentorsAvailableCount,
        isSaved,
        applicationStatus,
      };
    });

    res.json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
});

// POST /api/scholarships (Admin only)
router.post('/scholarships', requireAuth, requireRole(Role.ADMINISTRATOR), async (req, res, next) => {
  try {
    const { name, provider, amount, deadline, description, eligibility, branch, applicationLink, isVerifiedByAdmin } = req.body;
    const created = await prisma.scholarship.create({
      data: {
        name,
        provider,
        amount,
        deadline: new Date(deadline),
        description,
        eligibility,
        branch: branch || null,
        applicationLink,
        isVerifiedByAdmin: isVerifiedByAdmin ?? true,
      },
    });
    res.json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/scholarships/:id (Admin only)
router.patch('/scholarships/:id', requireAuth, requireRole(Role.ADMINISTRATOR), async (req, res, next) => {
  try {
    const { name, provider, amount, deadline, description, eligibility, branch, applicationLink, isVerifiedByAdmin } = req.body;
    const updated = await prisma.scholarship.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(provider && { provider }),
        ...(amount && { amount }),
        ...(deadline && { deadline: new Date(deadline) }),
        ...(description && { description }),
        ...(eligibility && { eligibility }),
        ...(branch !== undefined && { branch }),
        ...(applicationLink && { applicationLink }),
        ...(typeof isVerifiedByAdmin === 'boolean' && { isVerifiedByAdmin }),
      },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/scholarships/:id (Admin only - soft delete: hides from students)
router.delete('/scholarships/:id', requireAuth, requireRole(Role.ADMINISTRATOR), async (req, res, next) => {
  try {
    await prisma.scholarship.update({
      where: { id: req.params.id },
      data: { isDeleted: true },
    });
    res.json({ success: true, message: 'Scholarship removed (soft-deleted)' });
  } catch (err) {
    next(err);
  }
});

// POST /api/scholarships/:id/save (Student save / bookmark toggle)
router.post('/scholarships/:id/save', requireAuth, async (req, res, next) => {
  try {
    const existing = await prisma.savedScholarship.findUnique({
      where: {
        studentId_scholarshipId: {
          studentId: req.user!.id,
          scholarshipId: req.params.id,
        },
      },
    });

    if (existing) {
      await prisma.savedScholarship.delete({
        where: { id: existing.id },
      });
      return res.json({ success: true, isSaved: false });
    } else {
      await prisma.savedScholarship.create({
        data: {
          studentId: req.user!.id,
          scholarshipId: req.params.id,
        },
      });
      return res.json({ success: true, isSaved: true });
    }
  } catch (err) {
    next(err);
  }
});

// ==================== OPPORTUNITIES ====================
// GET /api/opportunities (search, category filter, saved/applied status)
router.get('/opportunities', requireAuth, async (req, res, next) => {
  try {
    const { search, category } = req.query;
    const where: any = {};

    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { organization: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category && typeof category === 'string' && category !== 'ALL') {
      where.category = category;
    }

    const items = await prisma.opportunity.findMany({
      where,
      orderBy: { deadline: 'asc' },
      include: {
        savedBy: {
          where: { studentId: req.user!.id },
        },
      },
    });

    const enriched = items.map((op) => {
      const savedRecord = op.savedBy[0];
      const { savedBy, ...rest } = op;
      return {
        ...rest,
        isSaved: Boolean(savedRecord),
        applicationStatus: savedRecord?.status || null, // 'SAVED' | 'APPLIED' | null
      };
    });

    res.json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
});

// POST /api/opportunities/:id/save
router.post('/opportunities/:id/save', requireAuth, async (req, res, next) => {
  try {
    const existing = await prisma.savedOpportunity.findUnique({
      where: {
        studentId_opportunityId: {
          studentId: req.user!.id,
          opportunityId: req.params.id,
        },
      },
    });

    if (existing) {
      await prisma.savedOpportunity.delete({ where: { id: existing.id } });
      return res.json({ success: true, isSaved: false, status: null });
    } else {
      const created = await prisma.savedOpportunity.create({
        data: {
          studentId: req.user!.id,
          opportunityId: req.params.id,
          status: 'SAVED',
        },
      });
      return res.json({ success: true, isSaved: true, status: created.status });
    }
  } catch (err) {
    next(err);
  }
});

// PATCH /api/opportunities/:id/status (toggle/update APPLIED status)
router.patch('/api/opportunities/:id/status', requireAuth, async (req, res, next) => {
  try {
    const { status } = req.body; // 'SAVED' | 'APPLIED'
    const updated = await prisma.savedOpportunity.upsert({
      where: {
        studentId_opportunityId: {
          studentId: req.user!.id,
          opportunityId: req.params.id,
        },
      },
      create: {
        studentId: req.user!.id,
        opportunityId: req.params.id,
        status: status || 'APPLIED',
      },
      update: {
        status: status || 'APPLIED',
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// ==================== CLUBS & SOCIETIES ====================
// GET /api/clubs (browse clubs with events, announcements, and recruitment)
router.get('/clubs', requireAuth, async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const where: any = {};
    if (category && typeof category === 'string' && category !== 'ALL') {
      where.category = category;
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const clubs = await prisma.club.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        events: {
          where: { startTime: { gte: new Date() } },
          orderBy: { startTime: 'asc' },
          take: 3,
        },
        members: {
          where: { role: 'LEAD' },
          include: { user: { select: { fullName: true, email: true } } },
        },
      },
    });

    res.json({ success: true, data: clubs });
  } catch (err) {
    next(err);
  }
});

// GET /api/club/my-club (Club Core gets their managed club)
router.get('/club/my-club', requireAuth, requireRole(Role.CLUB_CORE, Role.ADMINISTRATOR), async (req, res, next) => {
  try {
    const membership = await prisma.clubMembership.findFirst({
      where: { userId: req.user!.id },
      include: {
        club: {
          include: {
            events: { orderBy: { startTime: 'desc' } },
          },
        },
      },
    });

    if (!membership && req.user!.role !== Role.ADMINISTRATOR) {
      return res.status(403).json({ error: 'Forbidden', message: 'You are not assigned as Core of any club.' });
    }

    const club = membership ? membership.club : await prisma.club.findFirst({ include: { events: true } });
    res.json({ success: true, data: club });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/clubs/:id (Club Core manages ONLY their own club, 403 otherwise)
router.patch('/clubs/:id', requireAuth, requireRole(Role.CLUB_CORE, Role.ADMINISTRATOR), async (req, res, next) => {
  try {
    // Ownership check on the server
    if (req.user!.role !== Role.ADMINISTRATOR) {
      const membership = await prisma.clubMembership.findFirst({
        where: { clubId: req.params.id, userId: req.user!.id },
      });
      if (!membership) {
        return res.status(403).json({ error: 'Forbidden', message: 'You can only edit your own club.' });
      }
    }

    const { description, contactEmail, websiteUrl } = req.body;
    const updated = await prisma.club.update({
      where: { id: req.params.id },
      data: {
        ...(description && { description }),
        ...(contactEmail && { contactEmail }),
        ...(websiteUrl !== undefined && { websiteUrl }),
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/clubs/:id/events (Club Core creates event for their club)
router.post('/clubs/:id/events', requireAuth, requireRole(Role.CLUB_CORE, Role.ADMINISTRATOR), async (req, res, next) => {
  try {
    if (req.user!.role !== Role.ADMINISTRATOR) {
      const membership = await prisma.clubMembership.findFirst({
        where: { clubId: req.params.id, userId: req.user!.id },
      });
      if (!membership) {
        return res.status(403).json({ error: 'Forbidden', message: 'You can only create events for your own club.' });
      }
    }

    const { title, description, location, startTime, endTime } = req.body;
    const event = await prisma.event.create({
      data: {
        title,
        description: description || '',
        category: 'CLUB',
        location: location || 'Campus',
        startTime: new Date(startTime),
        endTime: new Date(endTime || startTime),
        clubId: req.params.id,
        organizerId: req.user!.id,
        isPublic: true,
      },
    });

    res.json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
});

// ==================== FACULTY DASHBOARD ====================
// GET /api/faculty/overview (Aggregate attendance for their own subjects ONLY)
router.get('/faculty/overview', requireAuth, requireRole(Role.FACULTY), async (req, res, next) => {
  try {
    // Fetch subjects assigned to this faculty
    const subjects = await prisma.subject.findMany({
      where: {
        OR: [
          { facultyId: req.user!.id },
          { facultyName: { contains: (req.user as any).fullName, mode: 'insensitive' } },
        ],
      },
      include: {
        attendanceRecords: true,
      },
      orderBy: { code: 'asc' },
    });

    const breakdown = subjects.map((sub) => {
      const totalMarks = sub.attendanceRecords.length;
      const presentMarks = sub.attendanceRecords.filter((r) => r.status === 'PRESENT').length;
      const averageAttendance = totalMarks > 0 ? Math.round((presentMarks / totalMarks) * 100) : 100;

      return {
        id: sub.id,
        code: sub.code,
        name: sub.name,
        branch: sub.branch,
        semester: sub.semester,
        totalMarks,
        averageAttendance,
      };
    });

    res.json({ success: true, data: { subjects: breakdown } });
  } catch (err) {
    next(err);
  }
});

export default router;
