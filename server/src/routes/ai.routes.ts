import { Router } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { requireAuth } from '../middlewares/auth.middleware';
import { aiChatRateLimiter } from '../middlewares/rateLimiter';
import { config } from '../config/env';
import dayjs from 'dayjs';

const router = Router();
const prisma = new PrismaClient();

interface SourceCard {
  type: 'DEADLINE' | 'EVENT' | 'SCHOLARSHIP' | 'LIBRARY' | 'CLUB' | 'MENTOR' | 'ATTENDANCE' | 'ISSUE';
  title: string;
  detail: string;
  meta?: string;
}

// POST /api/ai/chat
router.post('/chat', requireAuth, aiChatRateLimiter, async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const q = query.trim().toLowerCase();
    const studentId = req.user!.id;

    const sources: SourceCard[] = [];
    const contextSnippets: string[] = [];

    // 1. Library check
    if (q.includes('library') || q.includes('seat') || q.includes('book') || q.includes('reading') || q.includes('hall')) {
      const lib = await prisma.library.findFirst();
      if (lib) {
        const available = Math.max(0, lib.capacity - lib.occupied);
        const pct = Math.round((lib.occupied / lib.capacity) * 100);
        sources.push({
          type: 'LIBRARY',
          title: lib.name,
          detail: `${available} seats available out of ${lib.capacity} (${pct}% occupied).`,
          meta: `Updated ${dayjs(lib.lastUpdated).format('h:mm A')}`,
        });
        contextSnippets.push(`Central Library currently has ${available} available seats out of ${lib.capacity} total (${pct}% occupancy).`);
      }
    }

    // 2. Deadlines
    if (q.includes('deadline') || q.includes('due') || q.includes('assignment') || q.includes('submission') || q.includes('exam')) {
      const deadlines = await prisma.deadline.findMany({
        where: { dueDate: { gte: new Date() } },
        orderBy: { dueDate: 'asc' },
        take: 4,
      });
      for (const d of deadlines) {
        sources.push({
          type: 'DEADLINE',
          title: d.title,
          detail: `${d.category} - Source: ${d.source}`,
          meta: `Due ${dayjs(d.dueDate).format('MMM D, YYYY')}`,
        });
        contextSnippets.push(`Deadline: "${d.title}" (${d.category}) is due on ${dayjs(d.dueDate).format('YYYY-MM-DD')}.`);
      }
    }

    // 3. Events
    if (q.includes('event') || q.includes('workshop') || q.includes('meet') || q.includes('fest') || q.includes('calendar') || q.includes('techx')) {
      const events = await prisma.event.findMany({
        where: { startTime: { gte: new Date() } },
        orderBy: { startTime: 'asc' },
        take: 4,
      });
      for (const ev of events) {
        sources.push({
          type: 'EVENT',
          title: ev.title,
          detail: `${ev.category} at ${ev.location}`,
          meta: dayjs(ev.startTime).format('MMM D, h:mm A'),
        });
        contextSnippets.push(`Event: "${ev.title}" (${ev.category}) at ${ev.location} on ${dayjs(ev.startTime).format('YYYY-MM-DD h:mm A')}.`);
      }
    }

    // 4. Attendance (logged-in student's own attendance only)
    if (q.includes('attendance') || q.includes('bunk') || q.includes('miss') || q.includes('subject') || q.includes('threshold') || q.includes('class')) {
      const student = await prisma.studentProfile.findUnique({ where: { userId: studentId } });
      if (student) {
        const subjects = await prisma.subject.findMany({
          where: { branch: student.branch, semester: student.semester },
          include: { attendanceRecords: { where: { studentId } } },
        });

        let total = 0;
        let attended = 0;
        for (const sub of subjects) {
          const sTotal = sub.attendanceRecords.length;
          const sAtt = sub.attendanceRecords.filter((r) => r.status === 'PRESENT').length;
          const sPct = sTotal > 0 ? Math.round((sAtt / sTotal) * 100) : 100;
          total += sTotal;
          attended += sAtt;

          sources.push({
            type: 'ATTENDANCE',
            title: `${sub.code}: ${sub.name}`,
            detail: `${sAtt}/${sTotal} attended (${sPct}%)`,
            meta: sPct < 80 ? 'Below 80% threshold' : 'Compliant',
          });
          contextSnippets.push(`Student's attendance in ${sub.code} (${sub.name}) is ${sPct}% (${sAtt}/${sTotal} classes attended).`);
        }
        const overall = total > 0 ? Math.round((attended / total) * 100) : 100;
        contextSnippets.push(`Student's overall attendance across all semester ${student.semester} subjects is ${overall}%.`);
      }
    }

    // 5. Scholarships
    if (q.includes('scholarship') || q.includes('grant') || q.includes('financial') || q.includes('funding') || q.includes('pragati') || q.includes('aicte')) {
      const scholarships = await prisma.scholarship.findMany({
        where: { isDeleted: false },
        take: 3,
      });
      for (const s of scholarships) {
        sources.push({
          type: 'SCHOLARSHIP',
          title: s.name,
          detail: `Amount: ${s.amount} • Provider: ${s.provider}`,
          meta: `Deadline: ${dayjs(s.deadline).format('MMM D, YYYY')}`,
        });
        contextSnippets.push(`Scholarship: "${s.name}" provides ${s.amount} by ${s.provider}. Eligibility: ${s.eligibility}.`);
      }
    }

    // 6. Clubs
    if (q.includes('club') || q.includes('society') || q.includes('robotics') || q.includes('acm') || q.includes('recruitment')) {
      const clubs = await prisma.club.findMany({ take: 4 });
      for (const c of clubs) {
        sources.push({
          type: 'CLUB',
          title: c.name,
          detail: `${c.category} - ${c.description}`,
          meta: c.contactEmail,
        });
        contextSnippets.push(`Club: "${c.name}" (${c.category}). Description: ${c.description}. Contact: ${c.contactEmail}.`);
      }
    }

    // 7. Mentors
    if (q.includes('mentor') || q.includes('senior') || q.includes('guidance') || q.includes('connect')) {
      const mentors = await prisma.mentorProfile.findMany({
        where: { isAvailable: true },
        include: { user: { include: { studentProfile: true } } },
        take: 3,
      });
      for (const m of mentors) {
        sources.push({
          type: 'MENTOR',
          title: m.user.fullName,
          detail: `Year ${m.user.studentProfile?.yearOfStudy || 3} • ${m.user.studentProfile?.branch}`,
          meta: m.interests.join(', '),
        });
        contextSnippets.push(`Mentor: ${m.user.fullName} (${m.user.studentProfile?.branch}, Year ${m.user.studentProfile?.yearOfStudy}). Interests: ${m.interests.join(', ')}.`);
      }
    }

    // 8. Campus Issues (logged-in student's own issues only)
    if (q.includes('issue') || q.includes('complaint') || q.includes('wifi') || q.includes('repair') || q.includes('facility')) {
      const issues = await prisma.campusIssue.findMany({
        where: { reporterId: studentId },
        take: 3,
      });
      for (const iss of issues) {
        sources.push({
          type: 'ISSUE',
          title: `${iss.issueCode}: ${iss.title}`,
          detail: `Status: ${iss.status} at ${iss.location}`,
          meta: dayjs(iss.createdAt).format('MMM D, YYYY'),
        });
        contextSnippets.push(`Student's reported issue: ${iss.issueCode} "${iss.title}" is currently ${iss.status}.`);
      }
    }

    let answer = '';

    // LLM Phrasing or Rule-Based Fallback
    if (contextSnippets.length === 0) {
      answer = `I could not find any active campus database records matching your query "${query}". Please check your query keywords or ask about library seating, upcoming deadlines, scheduled events, scholarships, student clubs, or your personal attendance records.`;
    } else if (config.openaiApiKey) {
      // Optional OpenAI phrasing on server
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.openaiApiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are CampusSync AI, the university campus assistant. Answer the student query concisely and strictly using the retrieved campus database records provided below. Never invent details or deadlines not present in the records. If information is not found in the records, explicitly say so.',
              },
              {
                role: 'user',
                content: `Retrieved Campus Database Context:\n${contextSnippets.join('\n')}\n\nStudent Query: "${query}"`,
              },
            ],
            temperature: 0.2,
            max_tokens: 300,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          answer = data.choices[0]?.message?.content || '';
        }
      } catch (err) {
        // Fall back gracefully to rule-based summary
      }
    }

    // Fallback if OpenAI key is not set or failed
    if (!answer && contextSnippets.length > 0) {
      answer = `Here is what I found in the campus records regarding your query:\n\n` +
        contextSnippets.map((s, idx) => `${idx + 1}. ${s}`).join('\n\n') +
        `\n\nAll details are retrieved live from verified university database records.`;
    }

    res.json({
      success: true,
      data: {
        answer,
        sources,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
