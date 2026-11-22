import {
  PrismaClient,
  Role,
  AnnouncementPriority,
  AnnouncementSource,
  EventCategory,
  DeadlineCategory,
  IssueCategory,
  IssueStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import dayjs from 'dayjs';

// Showcase demo data for CampusSync.
// SAFE TO RUN ON EVERY START: it never deletes anything and never creates duplicates
// (each record is looked up by its email / title / code first).
// Event and deadline dates are refreshed on every run so they always stay in the future.

const prisma = new PrismaClient();

async function findOrCreateByTitle<T>(
  find: () => Promise<T | null>,
  create: () => Promise<T>,
  update?: (existing: T) => Promise<unknown>
): Promise<void> {
  const existing = await find();
  if (!existing) {
    await create();
  } else if (update) {
    await update(existing);
  }
}

async function main() {
  console.log('[Seed:Showcase] Adding demo data (mentors, announcements, events, deadlines, lost & found, issues)...');

  const studentPw = await bcrypt.hash('Student@123', 10);

  const admin = await prisma.user.findUnique({ where: { email: 'admin@campus.edu' } });
  const faculty = await prisma.user.findUnique({ where: { email: 'dr.ramanujan@campus.edu' } });
  const clubLead = await prisma.user.findUnique({ where: { email: 'robotics.lead@campus.edu' } });
  const aarav = await prisma.user.findUnique({ where: { email: 'aarav.sharma@campus.edu' } });

  if (!admin || !faculty || !aarav) {
    console.log('[Seed:Showcase] Base accounts missing - run seed-base first. Skipping.');
    return;
  }

  // ---------------------------------------------------------------------------
  // 1. MENTORS (senior students who appear on the Mentors page)
  // ---------------------------------------------------------------------------
  const mentors = [
    { name: 'Priya Patel', email: 'priya.patel@campus.edu', collegeId: 'MNT2024CSE001', branch: 'Computer Science & Engineering', year: 3, sem: 5,
      interests: ['Machine Learning', 'System Design', 'Cloud Computing'],
      bio: 'ML research intern at the IEEE student chapter. Happy to help with internship prep, resumes and PyTorch.', linkedIn: 'https://linkedin.com/in/priya-patel-demo' },
    { name: 'Rohan Mehra', email: 'rohan.mehra@campus.edu', collegeId: 'MNT2023CSE002', branch: 'Computer Science & Engineering', year: 4, sem: 7,
      interests: ['Distributed Systems', 'DevOps', 'Competitive Programming'],
      bio: 'Final-year student with a product-company SDE offer. Mentoring for mock interviews and DSA practice.', linkedIn: 'https://linkedin.com/in/rohan-mehra-demo' },
    { name: 'Ananya Deshmukh', email: 'ananya.deshmukh@campus.edu', collegeId: 'MNT2024ECE003', branch: 'Electronics & Communication Engineering', year: 3, sem: 5,
      interests: ['Embedded Systems', 'IoT', 'Robotics'],
      bio: 'Core member of the rover team. Guides juniors on microcontrollers and PCB design.', linkedIn: null },
    { name: 'Kabir Verma', email: 'kabir.verma@campus.edu', collegeId: 'MNT2023MEC004', branch: 'Mechanical Engineering', year: 4, sem: 7,
      interests: ['CAD Modeling', 'Electric Vehicles', 'Formula Student'],
      bio: 'Leads the Formula Student EV powertrain team. Can help with CAD, FEA and design competitions.', linkedIn: 'https://linkedin.com/in/kabir-verma-demo' },
    { name: 'Sneha Rao', email: 'sneha.rao@campus.edu', collegeId: 'MNT2025EEE005', branch: 'Electrical Engineering', year: 2, sem: 3,
      interests: ['Renewable Energy', 'Power Electronics', 'Smart Grids'],
      bio: 'Second-year researcher on solar micro-inverters. Available for coursework doubts and lab help.', linkedIn: 'https://linkedin.com/in/sneha-rao-demo' },
    { name: 'Devansh Joshi', email: 'devansh.joshi@campus.edu', collegeId: 'MNT2024CSE006', branch: 'Computer Science & Engineering', year: 3, sem: 5,
      interests: ['Cybersecurity', 'Web Development', 'Open Source'],
      bio: 'Active CTF player and open-source contributor. Guides juniors on web security and first PRs.', linkedIn: 'https://linkedin.com/in/devansh-joshi-demo' },
    { name: 'Meera Iyer', email: 'meera.iyer@campus.edu', collegeId: 'MNT2023CSE007', branch: 'Computer Science & Engineering', year: 4, sem: 7,
      interests: ['UI/UX Design', 'Product Management', 'Hackathons'],
      bio: 'Won two national hackathons. Mentors teams on pitching, UI design and product thinking.', linkedIn: 'https://linkedin.com/in/meera-iyer-demo' },
    { name: 'Arjun Nair', email: 'arjun.nair@campus.edu', collegeId: 'MNT2024CIV008', branch: 'Civil Engineering', year: 3, sem: 5,
      interests: ['Structural Design', 'GATE Preparation', 'Sustainability'],
      bio: 'GATE aspirant and teaching assistant for Strength of Materials. Happy to share notes and study plans.', linkedIn: null },
  ];

  for (const m of mentors) {
    const user = await prisma.user.upsert({
      where: { email: m.email },
      update: { isEmailVerified: true },
      create: {
        email: m.email,
        passwordHash: studentPw,
        isEmailVerified: true,
        fullName: m.name,
        role: Role.STUDENT,
      },
    });
    await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, collegeId: m.collegeId, program: 'B.Tech', branch: m.branch, semester: m.sem, yearOfStudy: m.year },
    });
    await prisma.mentorProfile.upsert({
      where: { userId: user.id },
      update: { isAvailable: true },
      create: {
        userId: user.id,
        isAvailable: true,
        bio: m.bio,
        interests: m.interests,
        shareEmail: true,
        sharePhone: false,
        shareLinkedIn: Boolean(m.linkedIn),
        linkedInUrl: m.linkedIn,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // 2. ANNOUNCEMENTS
  // ---------------------------------------------------------------------------
  const announcements = [
    { title: 'End-Semester Examination Date Sheet Released', author: admin, role: Role.ADMINISTRATOR, source: AnnouncementSource.ADMINISTRATION, priority: AnnouncementPriority.URGENT,
      content: 'The end-semester date sheet for all B.Tech programmes is now available on the examination portal. Students must verify their subject codes and report discrepancies to the Examination Cell within 3 working days.', dept: null, sem: null },
    { title: 'Fee Payment Window for Next Semester Now Open', author: admin, role: Role.ADMINISTRATOR, source: AnnouncementSource.ADMINISTRATION, priority: AnnouncementPriority.HIGH,
      content: 'Semester fee payment is open on the student portal. A late fee applies after the due date. Scholarship holders should upload their sanction letters before paying.', dept: null, sem: null },
    { title: 'Campus Wi-Fi Maintenance This Saturday', author: admin, role: Role.ADMINISTRATOR, source: AnnouncementSource.ADMINISTRATION, priority: AnnouncementPriority.NORMAL,
      content: 'Wi-Fi in hostels and academic blocks will be unavailable from 10 AM to 1 PM on Saturday for a network upgrade. Library computers will remain available.', dept: null, sem: null },
    { title: 'CS301 Data Structures: Extra Doubt-Clearing Session', author: faculty, role: Role.FACULTY, source: AnnouncementSource.FACULTY, priority: AnnouncementPriority.HIGH,
      content: 'An extra doubt-clearing session on trees and graphs will be held on Thursday at 4 PM in LT-2. Bring your assignment questions.', dept: 'Computer Science & Engineering', sem: 3 },
    { title: 'Mid-Term Marks Uploaded for Semester 3 CSE', author: faculty, role: Role.FACULTY, source: AnnouncementSource.FACULTY, priority: AnnouncementPriority.NORMAL,
      content: 'Mid-term marks for all semester 3 CSE theory subjects are now on the portal. Re-evaluation requests can be submitted to the department office by Friday.', dept: 'Computer Science & Engineering', sem: 3 },
    { title: 'Guest Lecture: Careers in Artificial Intelligence', author: faculty, role: Role.FACULTY, source: AnnouncementSource.FACULTY, priority: AnnouncementPriority.NORMAL,
      content: 'An industry guest lecture on careers in AI and machine learning will be held in the Main Auditorium. Attendance is open to all branches.', dept: null, sem: null },
    ...(clubLead ? [
      { title: 'Robotics Society Recruitment Drive Open', author: clubLead, role: Role.CLUB_CORE, source: AnnouncementSource.CLUB, priority: AnnouncementPriority.NORMAL,
        content: 'The Robotics & Automation Society is recruiting first- and second-year students for its design, coding and outreach teams. Fill the form on the Clubs page.', dept: null, sem: null },
      { title: 'Hackathon Team Formation Meet', author: clubLead, role: Role.CLUB_CORE, source: AnnouncementSource.CLUB, priority: AnnouncementPriority.NORMAL,
        content: 'Looking for teammates for upcoming hackathons? Join the team formation meet in the Innovation Lab on Friday evening.', dept: null, sem: null },
    ] : []),
  ];

  for (const a of announcements) {
    await findOrCreateByTitle(
      () => prisma.announcement.findFirst({ where: { title: a.title } }),
      () => prisma.announcement.create({
        data: {
          title: a.title,
          content: a.content,
          authorId: a.author.id,
          authorRole: a.role,
          sourceCategory: a.source,
          isVerifiedByAdmin: true,
          priority: a.priority,
          targetDepartment: a.dept,
          targetSemester: a.sem,
        },
      })
    );
  }

  // ---------------------------------------------------------------------------
  // 3. EVENTS (dates refreshed every run so they stay upcoming)
  // ---------------------------------------------------------------------------
  const robotics = await prisma.club.findFirst({ where: { name: 'Robotics & Automation Society (RAS)' } });
  const acm = await prisma.club.findFirst({ where: { name: 'ACM Student Chapter' } });

  const events = [
    { title: 'Annual Tech Fest: InnovateX', category: EventCategory.CAMPUS, location: 'Main Auditorium', inDays: 6, startHour: 10, hours: 8, clubId: null,
      description: 'Two-day technical festival with project expos, coding contests and startup pitches.' },
    { title: 'Inter-College Coding Contest', category: EventCategory.COMPETITION, location: 'CS Lab 204, Block B', inDays: 3, startHour: 14, hours: 3, clubId: acm?.id ?? null,
      description: 'A 3-hour competitive programming contest. Top 3 teams win prizes and internship referrals.' },
    { title: 'Arduino & IoT Hands-on Workshop', category: EventCategory.WORKSHOP, location: 'Robotics Lab, Block C', inDays: 4, startHour: 11, hours: 4, clubId: robotics?.id ?? null,
      description: 'Build a working IoT weather station with sensors and an Arduino board. Kits provided.' },
    { title: 'Inter-Department Cricket Tournament', category: EventCategory.SPORTS, location: 'Main Sports Ground', inDays: 8, startHour: 8, hours: 6, clubId: null,
      description: 'Annual cricket tournament between all departments. Register your team with the Sports Committee.' },
    { title: 'Resume Building & Placement Prep Session', category: EventCategory.ACADEMIC, location: 'Seminar Hall 1', inDays: 2, startHour: 15, hours: 2, clubId: null,
      description: 'The Training & Placement Cell explains resume formats, aptitude tests and interview etiquette.' },
    { title: 'Open Source Contribution Sprint', category: EventCategory.CLUB, location: 'Innovation Lab', inDays: 10, startHour: 10, hours: 6, clubId: acm?.id ?? null,
      description: 'Make your first open-source contribution with mentors guiding you through issues and pull requests.' },
  ];

  for (const e of events) {
    const startTime = dayjs().add(e.inDays, 'day').hour(e.startHour).minute(0).second(0).millisecond(0).toDate();
    const endTime = dayjs(startTime).add(e.hours, 'hour').toDate();
    const organizerId = e.clubId && clubLead ? clubLead.id : admin.id;
    await findOrCreateByTitle(
      () => prisma.event.findFirst({ where: { title: e.title } }),
      () => prisma.event.create({
        data: { title: e.title, description: e.description, category: e.category, location: e.location, startTime, endTime, organizerId, clubId: e.clubId, isPublic: true },
      }),
      (existing: any) => prisma.event.update({ where: { id: existing.id }, data: { startTime, endTime } })
    );
  }

  // ---------------------------------------------------------------------------
  // 4. DEADLINES (dates refreshed every run so they stay upcoming)
  // ---------------------------------------------------------------------------
  const deadlines = [
    { title: 'Semester Fee Payment', category: DeadlineCategory.REGISTRATION, source: 'Accounts Office', inDays: 9, dept: null, sem: null,
      description: 'Pay next-semester fees on the student portal to avoid the late fee.' },
    { title: 'CS301 Lab Record Submission', category: DeadlineCategory.ASSIGNMENT, source: 'Department of CSE', inDays: 2, dept: 'Computer Science & Engineering', sem: 3,
      description: 'Submit the signed Data Structures lab record to your lab instructor.' },
    { title: 'Mini Project Proposal Submission', category: DeadlineCategory.ACADEMIC, source: 'Department of CSE', inDays: 5, dept: 'Computer Science & Engineering', sem: 3,
      description: 'Upload a 2-page mini project proposal with team details on the department portal.' },
    { title: 'Hostel Room Renewal Application', category: DeadlineCategory.APPLICATION, source: 'Hostel Office', inDays: 12, dept: null, sem: null,
      description: 'Apply for hostel room renewal for the next academic session.' },
    { title: 'Merit Scholarship Document Verification', category: DeadlineCategory.SCHOLARSHIP, source: 'Scholarship Cell', inDays: 7, dept: null, sem: null,
      description: 'Submit income certificate and mark sheets for scholarship verification.' },
    { title: 'Tech Fest Project Expo Registration', category: DeadlineCategory.COMPETITION, source: 'Student Council', inDays: 4, dept: null, sem: null,
      description: 'Register your project for the InnovateX project exhibition.' },
  ];

  for (const d of deadlines) {
    const dueDate = dayjs().add(d.inDays, 'day').hour(23).minute(59).second(0).millisecond(0).toDate();
    await findOrCreateByTitle(
      () => prisma.deadline.findFirst({ where: { title: d.title } }),
      () => prisma.deadline.create({
        data: { title: d.title, description: d.description, dueDate, category: d.category, source: d.source, department: d.dept, semester: d.sem },
      }),
      (existing: any) => prisma.deadline.update({ where: { id: existing.id }, data: { dueDate } })
    );
  }

  // ---------------------------------------------------------------------------
  // 5. LOST & FOUND
  // ---------------------------------------------------------------------------
  const lostItems = [
    { title: 'Casio fx-991EX Scientific Calculator', description: 'Black calculator left on a desk after the Discrete Maths class.', location: 'Lecture Hall 101', daysAgo: 1, time: '11:30 AM' },
    { title: 'Blue Water Bottle with Stickers', description: 'Steel bottle with coding stickers, left near the basketball court.', location: 'Sports Complex', daysAgo: 2, time: '06:00 PM' },
    { title: 'Black Wireless Earbuds Case', description: 'Small black earbuds case, possibly dropped in the library reading hall.', location: 'Central Library, 2nd Floor', daysAgo: 3, time: '03:15 PM' },
  ];
  for (const l of lostItems) {
    const dateLost = dayjs().subtract(l.daysAgo, 'day').toDate();
    await findOrCreateByTitle(
      () => prisma.lostItem.findFirst({ where: { title: l.title } }),
      () => prisma.lostItem.create({
        data: { title: l.title, description: l.description, locationLost: l.location, dateLost, timeLost: l.time, contactEmail: aarav.email, userId: aarav.id, isResolved: false },
      })
    );
  }

  const foundItems = [
    { title: 'Grey Laptop Charger (65W)', description: 'Found plugged in at a library charging point.', location: 'Central Library', heldAt: 'Library Front Desk', daysAgo: 1 },
    { title: 'Student ID Card - Mechanical Dept', description: 'ID card found near the canteen entrance.', location: 'Central Food Court', heldAt: 'Security Office, Gate 1', daysAgo: 2 },
    { title: 'Set of Keys with Red Keychain', description: 'Three keys on a red keychain found in the parking area.', location: 'Two-Wheeler Parking', heldAt: 'Security Office, Gate 1', daysAgo: 4 },
  ];
  for (const f of foundItems) {
    await findOrCreateByTitle(
      () => prisma.foundItem.findFirst({ where: { title: f.title } }),
      () => prisma.foundItem.create({
        data: { title: f.title, description: f.description, locationFound: f.location, dateFound: dayjs().subtract(f.daysAgo, 'day').toDate(), heldAtLocation: f.heldAt, contactEmail: admin.email },
      })
    );
  }

  // ---------------------------------------------------------------------------
  // 6. CAMPUS ISSUES (reported by the demo student, different statuses)
  // ---------------------------------------------------------------------------
  const issues = [
    { code: 'ISS-DEMO-0001', title: 'Projector not working in LT-2', category: IssueCategory.CLASSROOM, status: IssueStatus.IN_PROGRESS, location: 'Lecture Theatre 2',
      description: 'The projector does not turn on, so slides cannot be shown during lectures.', notes: 'Technician assigned; replacement lamp ordered.' },
    { code: 'ISS-DEMO-0002', title: 'Weak Wi-Fi in Girls Hostel Block B', category: IssueCategory.WIFI, status: IssueStatus.UNDER_REVIEW, location: 'Girls Hostel, Block B',
      description: 'Wi-Fi drops frequently on the 2nd and 3rd floors in the evening.', notes: null },
    { code: 'ISS-DEMO-0003', title: 'Water cooler leaking near CS block', category: IssueCategory.PLUMBING, status: IssueStatus.RESOLVED, location: 'CS Block, Ground Floor',
      description: 'The water cooler is leaking and the floor stays wet.', notes: 'Fixed by the maintenance team.' },
    { code: 'ISS-DEMO-0004', title: 'Broken bench in Room 305', category: IssueCategory.INFRASTRUCTURE, status: IssueStatus.REPORTED, location: 'Academic Block, Room 305',
      description: 'One bench in the third row is broken and unsafe to sit on.', notes: null },
  ];
  for (const i of issues) {
    await prisma.campusIssue.upsert({
      where: { issueCode: i.code },
      update: {},
      create: {
        issueCode: i.code,
        title: i.title,
        description: i.description,
        location: i.location,
        category: i.category,
        status: i.status,
        reporterId: aarav.id,
        adminNotes: i.notes,
        resolvedAt: i.status === IssueStatus.RESOLVED ? new Date() : null,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // 7. LIBRARY occupancy (so the live seat counter shows a realistic number)
  // ---------------------------------------------------------------------------
  await prisma.library.upsert({
    where: { id: 'campus-main-library' },
    update: { occupied: 132, lastUpdated: new Date() },
    create: { id: 'campus-main-library', name: 'Central University Library', capacity: 200, occupied: 132, lastUpdated: new Date(), updatedById: admin.id },
  });

  console.log('[Seed:Showcase] Done.');
}

main()
  .catch((e) => {
    console.error('[Seed:Showcase] Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });