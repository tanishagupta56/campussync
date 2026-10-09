import { Router } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();
const prisma = new PrismaClient();

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

// POST /api/announcements (Admin/Faculty/Club)
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

// DELETE /api/announcements/:id (Admin only)
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

    const events = await prisma.event.findMany({
      where,
      orderBy: { startTime: 'asc' },
      include: {
        club: { select: { name: true, category: true } },
        organizer: { select: { fullName: true, role: true } },
      },
    });
    res.json({ success: true, data: events });
  } catch (err) {
    next(err);
  }
});

// POST /api/events (Admin/Faculty/Club)
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

    const deadlines = await prisma.deadline.findMany({
      where,
      orderBy: { dueDate: 'asc' },
    });
    res.json({ success: true, data: deadlines });
  } catch (err) {
    next(err);
  }
});

// POST /api/deadlines (Admin/Faculty)
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

// PATCH /api/library (Admin only: +1/-1 or delta or set, capped between 0 and capacity)
router.patch('/api/library', requireAuth, requireRole(Role.ADMINISTRATOR), async (req, res, next) => {
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

export default router;
