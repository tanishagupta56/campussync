import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// GET /api/search?q=<query>
// Returns categorised results across announcements, events, deadlines, opportunities, scholarships, clubs, lost-found
router.get('/search', requireAuth, async (req, res, next) => {
  try {
    const q = (req.query.q as string || '').trim();
    if (!q || q.length < 2) {
      return res.json({ success: true, data: { results: [], query: q } });
    }

    const contains = { contains: q, mode: 'insensitive' as const };

    const [announcements, events, deadlines, opportunities, scholarships, clubs, lostItems] =
      await Promise.all([
        prisma.announcement.findMany({
          where: { OR: [{ title: contains }, { content: contains }] },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true, sourceCategory: true, createdAt: true },
        }),
        prisma.event.findMany({
          where: { isPublic: true, OR: [{ title: contains }, { description: contains }, { location: contains }] },
          take: 5,
          orderBy: { startTime: 'asc' },
          select: { id: true, title: true, category: true, location: true, startTime: true },
        }),
        prisma.deadline.findMany({
          where: { OR: [{ title: contains }, { description: contains }] },
          take: 5,
          orderBy: { dueDate: 'asc' },
          select: { id: true, title: true, category: true, dueDate: true },
        }),
        prisma.opportunity.findMany({
          where: { OR: [{ name: contains }, { description: contains }, { organization: contains }] },
          take: 5,
          orderBy: { deadline: 'asc' },
          select: { id: true, name: true, category: true, organization: true },
        }),
        prisma.scholarship.findMany({
          where: { isDeleted: false, OR: [{ name: contains }, { description: contains }, { provider: contains }] },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, name: true, provider: true, isVerifiedByAdmin: true },
        }),
        prisma.club.findMany({
          where: { OR: [{ name: contains }, { description: contains }, { category: contains }] },
          take: 5,
          orderBy: { name: 'asc' },
          select: { id: true, name: true, category: true, description: true },
        }),
        prisma.lostItem.findMany({
          where: {
            isResolved: false,
            OR: [{ title: contains }, { description: contains }, { locationLost: contains }],
          },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true, locationLost: true, createdAt: true },
        }),
      ]);

    const results = [
      ...announcements.map(r => ({ type: 'ANNOUNCEMENT', id: r.id, title: r.title, subtitle: r.sourceCategory, path: '/announcements', date: r.createdAt })),
      ...events.map(r => ({ type: 'EVENT', id: r.id, title: r.title, subtitle: r.location, path: '/calendar', date: r.startTime })),
      ...deadlines.map(r => ({ type: 'DEADLINE', id: r.id, title: r.title, subtitle: r.category, path: '/deadlines', date: r.dueDate })),
      ...opportunities.map(r => ({ type: 'OPPORTUNITY', id: r.id, title: r.name, subtitle: r.organization, path: '/opportunities', date: null })),
      ...scholarships.map(r => ({ type: 'SCHOLARSHIP', id: r.id, title: r.name, subtitle: r.provider, path: '/scholarships', date: null })),
      ...clubs.map(r => ({ type: 'CLUB', id: r.id, title: r.name, subtitle: r.category, path: '/clubs', date: null })),
      ...lostItems.map(r => ({ type: 'LOST_ITEM', id: r.id, title: r.title, subtitle: r.locationLost, path: '/lost-found', date: r.createdAt })),
    ];

    res.json({ success: true, data: { results, query: q } });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/overview – admin stats + campus issues breakdown by status
router.get('/admin/overview', requireAuth, async (req, res, next) => {
  try {
    const [
      announcementCount,
      eventCount,
      deadlineCount,
      opportunityCount,
      scholarshipCount,
      clubCount,
      studentCount,
      lostItemCount,
      issuesByStatus,
    ] = await Promise.all([
      prisma.announcement.count(),
      prisma.event.count(),
      prisma.deadline.count(),
      prisma.opportunity.count(),
      prisma.scholarship.count({ where: { isDeleted: false } }),
      prisma.club.count(),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.lostItem.count({ where: { isResolved: false } }),
      prisma.campusIssue.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

    const issueChart = issuesByStatus.map(g => ({
      label: g.status.replace('_', ' '),
      value: g._count.status,
    }));

    res.json({
      success: true,
      data: {
        counts: {
          announcements: announcementCount,
          events: eventCount,
          deadlines: deadlineCount,
          opportunities: opportunityCount,
          scholarships: scholarshipCount,
          clubs: clubCount,
          students: studentCount,
          activeLostItems: lostItemCount,
        },
        issueChart,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
