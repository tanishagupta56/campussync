import { PrismaClient, Role, AttendanceStatus, AnnouncementPriority, AnnouncementSource, EventCategory, DeadlineCategory, IssueCategory, IssueStatus, OpportunityCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Clearing existing demo data...');
  await prisma.attendanceAlert.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.timetableSlot.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.savedScholarship.deleteMany();
  await prisma.scholarshipRecipient.deleteMany();
  await prisma.scholarship.deleteMany();
  await prisma.savedOpportunity.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.campusIssue.deleteMany();
  await prisma.lostItem.deleteMany();
  await prisma.foundItem.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.event.deleteMany();
  await prisma.deadline.deleteMany();
  await prisma.library.deleteMany();
  await prisma.mentorContactLog.deleteMany();
  await prisma.clubMembership.deleteMany();
  await prisma.club.deleteMany();
  await prisma.otpChallenge.deleteMany();
  await prisma.session.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.mentorProfile.deleteMany();
  await prisma.attendanceSettings.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.user.deleteMany();

  console.log('[Seed] Creating demo users with hashed credentials...');
  const salt = await bcrypt.genSalt(10);
  const studentPw = await bcrypt.hash('Student@123', salt);
  const facultyPw = await bcrypt.hash('Faculty@123', salt);
  const adminPw = await bcrypt.hash('Admin@123', salt);
  const clubPw = await bcrypt.hash('Club@123', salt);

  // 1. Student: Aarav Sharma (3rd Sem CSE)
  const studentAarav = await prisma.user.create({
    data: {
      email: 'aarav.sharma@campus.edu',
      passwordHash: studentPw,
      fullName: 'Aarav Sharma',
      role: Role.STUDENT,
      phone: '+91 98765 43210',
      studentProfile: {
        create: {
          collegeId: '2025CSE0104',
          program: 'B.Tech',
          branch: 'Computer Science & Engineering',
          semester: 3,
          yearOfStudy: 2,
        },
      },
      attendanceSettings: {
        create: {
          alertThreshold: 80.0,
        },
      },
    },
  });

  // 2. Student Mentor: Priya Patel (5th Sem CSE)
  const studentPriya = await prisma.user.create({
    data: {
      email: 'priya.patel@campus.edu',
      passwordHash: studentPw,
      fullName: 'Priya Patel',
      role: Role.STUDENT,
      phone: '+91 98765 43211',
      studentProfile: {
        create: {
          collegeId: '2024CSE0088',
          program: 'B.Tech',
          branch: 'Computer Science & Engineering',
          semester: 5,
          yearOfStudy: 3,
        },
      },
      mentorProfile: {
        create: {
          isAvailable: true,
          bio: 'Third-year CSE student passionate about machine learning, distributed systems, and open-source contributions. Happy to guide juniors on internships and competitive coding.',
          interests: ['Machine Learning', 'System Design', 'Competitive Programming', 'Open Source'],
          shareEmail: true,
          sharePhone: false,
          shareLinkedIn: true,
          linkedInUrl: 'https://linkedin.com/in/priya-patel-campus',
        },
      },
      attendanceSettings: {
        create: {
          alertThreshold: 80.0,
        },
      },
    },
  });

  // 3. Faculty: Dr. S. Ramanujan (CSE)
  const facultyRamanujan = await prisma.user.create({
    data: {
      email: 'dr.ramanujan@campus.edu',
      passwordHash: facultyPw,
      fullName: 'Dr. S. Ramanujan',
      role: Role.FACULTY,
      phone: '+91 98765 43220',
    },
  });

  // 4. Administrator: Admin Office
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@campus.edu',
      passwordHash: adminPw,
      fullName: 'Campus Administrator',
      role: Role.ADMINISTRATOR,
      phone: '+91 98765 43230',
    },
  });

  // 5. Club Core: Robotics Lead
  const clubLead = await prisma.user.create({
    data: {
      email: 'robotics.lead@campus.edu',
      passwordHash: clubPw,
      fullName: 'Vikramaditya Rao',
      role: Role.CLUB_CORE,
      phone: '+91 98765 43240',
    },
  });

  console.log('[Seed] Creating academic enrollments...');
  await prisma.enrollment.createMany({
    data: [
      {
        studentEmail: 'aarav.sharma@campus.edu',
        program: 'B.Tech',
        branch: 'Computer Science & Engineering',
        semester: 3,
      },
      {
        studentEmail: 'priya.patel@campus.edu',
        program: 'B.Tech',
        branch: 'Computer Science & Engineering',
        semester: 5,
      },
    ],
  });

  console.log('[Seed] Creating subjects & timetable for B.Tech CSE Semester 3...');
  const subDSA = await prisma.subject.create({
    data: {
      code: 'CS301',
      name: 'Data Structures & Algorithms',
      program: 'B.Tech',
      branch: 'Computer Science & Engineering',
      semester: 3,
      credits: 4,
      facultyId: facultyRamanujan.id,
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

  // Timetable slots (1=Mon ... 5=Fri)
  await prisma.timetableSlot.createMany({
    data: [
      // Monday
      { subjectId: subDSA.id, dayOfWeek: 1, startTime: '09:00', endTime: '10:00', room: 'LH-101' },
      { subjectId: subCOA.id, dayOfWeek: 1, startTime: '10:15', endTime: '11:15', room: 'LH-101' },
      { subjectId: subDBMS.id, dayOfWeek: 1, startTime: '11:30', endTime: '12:30', room: 'CS-Lab 2' },
      // Tuesday
      { subjectId: subDM.id, dayOfWeek: 2, startTime: '09:00', endTime: '10:00', room: 'LH-102' },
      { subjectId: subDSA.id, dayOfWeek: 2, startTime: '10:15', endTime: '11:15', room: 'LH-101' },
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

  console.log('[Seed] Creating past attendance records for Aarav Sharma...');
  const today = dayjs();
  // Populate last 7 days of attendance
  const pastRecords = [
    { subjectId: subDSA.id, daysAgo: 6, status: AttendanceStatus.PRESENT },
    { subjectId: subDSA.id, daysAgo: 4, status: AttendanceStatus.PRESENT },
    { subjectId: subDSA.id, daysAgo: 2, status: AttendanceStatus.PRESENT },
    { subjectId: subDSA.id, daysAgo: 1, status: AttendanceStatus.ABSENT }, // drops to 75%
    { subjectId: subCOA.id, daysAgo: 5, status: AttendanceStatus.PRESENT },
    { subjectId: subCOA.id, daysAgo: 3, status: AttendanceStatus.PRESENT },
    { subjectId: subCOA.id, daysAgo: 1, status: AttendanceStatus.PRESENT },
    { subjectId: subDBMS.id, daysAgo: 5, status: AttendanceStatus.PRESENT },
    { subjectId: subDBMS.id, daysAgo: 3, status: AttendanceStatus.PRESENT },
    { subjectId: subDBMS.id, daysAgo: 2, status: AttendanceStatus.PRESENT },
    { subjectId: subDM.id, daysAgo: 6, status: AttendanceStatus.PRESENT },
    { subjectId: subDM.id, daysAgo: 4, status: AttendanceStatus.PRESENT },
    { subjectId: subDM.id, daysAgo: 2, status: AttendanceStatus.PRESENT },
  ];

  for (const rec of pastRecords) {
    const recordDate = today.subtract(rec.daysAgo, 'day').startOf('day').toDate();
    await prisma.attendanceRecord.create({
      data: {
        studentId: studentAarav.id,
        subjectId: rec.subjectId,
        date: recordDate,
        status: rec.status,
      },
    });
  }

  // Record an alert for DSA (below 80% threshold demonstration)
  await prisma.attendanceAlert.create({
    data: {
      studentId: studentAarav.id,
      subjectId: subDSA.id,
      threshold: 80.0,
      percentageAtAlert: 75.0,
      sentAt: today.subtract(1, 'day').toDate(),
    },
  });

  console.log('[Seed] Initializing Library capacity and occupancy...');
  await prisma.library.create({
    data: {
      id: 'campus-main-library',
      name: 'Central University Library',
      capacity: 200,
      occupied: 68,
      lastUpdated: new Date(),
      updatedById: adminUser.id,
    },
  });

  console.log('[Seed] Creating Clubs and memberships...');
  const roboticsClub = await prisma.club.create({
    data: {
      name: 'Robotics & Automation Society',
      slug: 'robotics-society',
      category: 'Technical',
      description: 'Building autonomous rovers, combat robots, and IoT automation projects for national and international symposiums.',
      contactEmail: 'robotics@campus.edu',
      websiteUrl: 'https://robotics.campus.edu',
    },
  });

  await prisma.clubMembership.create({
    data: {
      clubId: roboticsClub.id,
      userId: clubLead.id,
      role: 'LEAD',
    },
  });

  const codingClub = await prisma.club.create({
    data: {
      name: 'Campus Developers Guild',
      slug: 'developers-guild',
      category: 'Technical',
      description: 'Community for web developers, mobile engineers, open-source contributors, and competitive coders.',
      contactEmail: 'guild@campus.edu',
    },
  });

  console.log('[Seed] Creating Announcements...');
  await prisma.announcement.createMany({
    data: [
      {
        title: 'Mid-Semester Examination Schedule Declared',
        content: 'The mid-semester examinations for all B.Tech branches will commence from next Monday. Detailed seating arrangements and slot timings are posted on the departmental notice boards. All students must bring their physical college ID cards.',
        authorId: adminUser.id,
        authorRole: Role.ADMINISTRATOR,
        sourceCategory: AnnouncementSource.ADMINISTRATION,
        isVerifiedByAdmin: true,
        priority: AnnouncementPriority.HIGH,
      },
      {
        title: 'CS301: Assignment 2 Released — Graph Algorithms',
        content: 'Assignment 2 on Graph Traversal (BFS/DFS and Dijkstra) is now posted. Submission is due before Sunday midnight. Late submissions will incur a 10% penalty per 24 hours.',
        authorId: facultyRamanujan.id,
        authorRole: Role.FACULTY,
        sourceCategory: AnnouncementSource.FACULTY,
        targetDepartment: 'Computer Science & Engineering',
        targetSemester: 3,
        priority: AnnouncementPriority.NORMAL,
      },
      {
        title: 'Annual Autonomous Robotics Hackathon 2026',
        content: 'Registrations are now open for RoverWars 2026 hosted by the Robotics & Automation Society! Teams of 3-4 members can apply. Hardware kits will be provided to shortlisted teams.',
        authorId: clubLead.id,
        authorRole: Role.CLUB_CORE,
        sourceCategory: AnnouncementSource.CLUB,
        priority: AnnouncementPriority.NORMAL,
      },
    ],
  });

  console.log('[Seed] Creating Events...');
  await prisma.event.createMany({
    data: [
      {
        title: 'TechX 2026 — University Innovation Conclave',
        description: 'Keynotes from alumni leaders in AI, startup pitching, and project exhibitions in the main auditorium.',
        category: EventCategory.CAMPUS,
        location: 'Main Auditorium',
        startTime: today.add(3, 'day').set('hour', 10).set('minute', 0).toDate(),
        endTime: today.add(3, 'day').set('hour', 17).set('minute', 0).toDate(),
        organizerId: adminUser.id,
        isPublic: true,
      },
      {
        title: 'Hands-on ROS2 & Micro-ROS Workshop',
        description: 'Learn Robot Operating System 2 fundamentals and deploy control nodes onto ESP32 microcontrollers.',
        category: EventCategory.WORKSHOP,
        location: 'Robotics Lab, Block C',
        startTime: today.add(5, 'day').set('hour', 14).set('minute', 0).toDate(),
        endTime: today.add(5, 'day').set('hour', 18).set('minute', 0).toDate(),
        organizerId: clubLead.id,
        clubId: roboticsClub.id,
        isPublic: true,
      },
    ],
  });

  console.log('[Seed] Creating Deadlines...');
  await prisma.deadline.createMany({
    data: [
      {
        title: 'CS301 Assignment 2 Submission',
        description: 'Graph Traversal implementation and analysis report on GitHub Classroom.',
        dueDate: today.add(2, 'day').set('hour', 23).set('minute', 59).toDate(),
        category: DeadlineCategory.ASSIGNMENT,
        source: 'Department of CSE',
        department: 'Computer Science & Engineering',
        semester: 3,
      },
      {
        title: 'Semester Exam Hall Ticket Verification',
        description: 'Verify registration details and clear all departmental library dues.',
        dueDate: today.add(5, 'day').set('hour', 17).set('minute', 0).toDate(),
        category: DeadlineCategory.REGISTRATION,
        source: 'Academic Registrar',
      },
      {
        title: 'Reliance Foundation Scholarship Portal Closes',
        description: 'Final application and mark sheet upload deadline.',
        dueDate: today.add(8, 'day').set('hour', 23).set('minute', 59).toDate(),
        category: DeadlineCategory.SCHOLARSHIP,
        source: 'Scholarship Cell',
      },
    ],
  });

  console.log('[Seed] Creating Opportunities & Scholarships...');
  await prisma.opportunity.createMany({
    data: [
      {
        name: 'Google Summer of Code 2026',
        organization: 'Google Open Source Programs',
        description: 'Global program focused on bringing new contributors into open source software development with mentor organizations.',
        category: OpportunityCategory.FELLOWSHIP,
        eligibility: '18+ students enrolled in undergraduate degree',
        deadline: today.add(14, 'day').toDate(),
        applicationLink: 'https://summerofcode.withgoogle.com',
        branch: 'All Branches',
        stipend: '$1,500 - $3,000 stipend',
      },
      {
        name: 'Microsoft Student Research Fellowship',
        organization: 'Microsoft Research India',
        description: 'Work alongside world-class scientists on cutting-edge problems in AI, systems, and algorithms.',
        category: OpportunityCategory.RESEARCH,
        eligibility: 'Pre-final and final year B.Tech/M.Tech students with strong mathematical foundation',
        deadline: today.add(21, 'day').toDate(),
        applicationLink: 'https://careers.microsoft.com',
        branch: 'Computer Science & Engineering',
        year: 3,
        stipend: 'Rs. 75,000 / month',
      },
    ],
  });

  const scholarship1 = await prisma.scholarship.create({
    data: {
      name: 'Reliance Foundation Undergraduate Scholarship',
      provider: 'Reliance Foundation',
      amount: 'Rs. 2,00,000 across degree',
      deadline: today.add(8, 'day').toDate(),
      description: 'Prestigious scholarship aimed at supporting meritorious undergraduate students with leadership potential.',
      eligibility: 'First & Second Year undergraduate students with >80% in 12th board exams.',
      branch: 'All Engineering Branches',
      applicationLink: 'https://www.reliancefoundation.org/scholarships',
      isVerifiedByAdmin: true,
      isDeleted: false,
    },
  });

  // Link Priya Patel as a previous recipient who opted into mentoring
  await prisma.scholarshipRecipient.create({
    data: {
      scholarshipId: scholarship1.id,
      studentId: studentPriya.id,
      yearAwarded: 2024,
      optedIntoMentoring: true,
    },
  });

  console.log('[Seed] Creating Lost & Found noticeboard items...');
  await prisma.lostItem.create({
    data: {
      title: 'Casio fx-991EX Scientific Calculator',
      description: 'Black scientific calculator left on the desk in LH-101 after the Discrete Mathematics lecture.',
      locationLost: 'Lecture Hall 101',
      dateLost: today.subtract(2, 'day').toDate(),
      timeLost: '11:30 AM',
      contactEmail: 'aarav.sharma@campus.edu',
      contactPhone: '+91 98765 43210',
      userId: studentAarav.id,
      isResolved: false,
    },
  });

  await prisma.lostItem.create({
    data: {
      title: 'Milton Stainless Steel Water Bottle (Navy Blue)',
      description: 'Navy blue 1-litre insulated bottle with a scratch on the cap, near Badminton Court 2.',
      locationLost: 'Sports Complex',
      dateLost: today.subtract(4, 'day').toDate(),
      timeLost: '05:30 PM',
      contactEmail: 'priya.patel@campus.edu',
      userId: studentPriya.id,
      isResolved: true,
      resolvedAt: today.subtract(1, 'day').toDate(),
    },
  });

  console.log('[Seed] Creating Campus Issues...');
  await prisma.campusIssue.create({
    data: {
      issueCode: 'ISS-2026-0001',
      title: 'HDMI Projector Port Flickering in LH-101',
      description: 'The ceiling projector intermittently loses signal when connected via the podium HDMI cable during morning lectures.',
      location: 'Lecture Hall 101, Main Academic Block',
      category: IssueCategory.CLASSROOM,
      aiSuggestedCategory: 'CLASSROOM',
      aiSuggestedPriority: 'MEDIUM',
      status: IssueStatus.IN_PROGRESS,
      reporterId: studentAarav.id,
      adminNotes: 'Audio-Visual technician assigned for cable and switch inspection.',
    },
  });

  await prisma.campusIssue.create({
    data: {
      issueCode: 'ISS-2026-0002',
      title: 'Wi-Fi AP Signal Degraded in C-Block 3rd Floor',
      description: 'Students in Lab 304 and adjacent study corridor unable to authenticate with campus enterprise Wi-Fi SSID.',
      location: 'Block C, 3rd Floor Corridor',
      category: IssueCategory.WIFI,
      aiSuggestedCategory: 'WIFI',
      aiSuggestedPriority: 'HIGH',
      status: IssueStatus.UNDER_REVIEW,
      reporterId: studentPriya.id,
    },
  });

  console.log('[Seed] Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('[Seed] Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
