import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// Announcements
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

    if (source && typeof source === 'string') {
      where.sourceCategory = source;
    }

    if (department && typeof department === 'string') {
      where.OR = [
        { targetDepartment: null },
        { targetDepartment: { contains: department, mode: 'insensitive' } }
      ];
    }

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
      },
    });

    res.json({ success: true, data: announcements });
  } catch (err) {
    next(err);
  }
});

// Events
router.get('/events', requireAuth, async (req, res, next) => {
  try {
    const { upcoming } = req.query;
    const where: any = { isPublic: true };

    if (upcoming === 'true') {
      where.endTime = { gte: new Date() };
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { startTime: 'asc' },
      include: {
        club: { select: { name: true, category: true } },
        organizer: { select: { fullName: true, role: true } },
      },
      take: 20,
    });

    res.json({ success: true, data: events });
  } catch (err) {
    next(err);
  }
});

// Deadlines
router.get('/deadlines', requireAuth, async (req, res, next) => {
  try {
    const { upcoming } = req.query;
    const where: any = {};

    if (upcoming === 'true') {
      where.dueDate = { gte: new Date() };
    }

    const deadlines = await prisma.deadline.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      take: 20,
    });

    res.json({ success: true, data: deadlines });
  } catch (err) {
    next(err);
  }
});

// Library
router.get('/library', requireAuth, async (req, res, next) => {
  try {
    let library = await prisma.library.findFirst();
    if (!library) {
      library = await prisma.library.create({
        data: {
          id: 'campus-main-library',
          name: 'Central University Library',
          capacity: 200,
          occupied: 68,
          lastUpdated: new Date(),
        },
      });
    }

    const available = Math.max(0, library.capacity - library.occupied);
    const occupancyPercentage = library.capacity > 0 
      ? Math.round((library.occupied / library.capacity) * 100) 
      : 0;

    res.json({
      success: true,
      data: {
        ...library,
        available,
        occupancyPercentage,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
