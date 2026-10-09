import { PrismaClient, Role, AttendanceStatus, AnnouncementPriority, AnnouncementSource, EventCategory, DeadlineCategory, IssueCategory, IssueStatus, OpportunityCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Re-seeding database with complete demo datasets...');
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

  const salt = await bcrypt.genSalt(10);
  const studentPw = await bcrypt.hash('Student@123', salt);
  const facultyPw = await bcrypt.hash('Faculty@123', salt);
  const adminPw = await bcrypt.hash('Admin@123', salt);
  const clubPw = await bcrypt.hash('Club@123', salt);

  // 1. Primary Demo Student: Aarav Sharma (Year 2, eligible to mentor)
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
      mentorProfile: {
        create: {
          isAvailable: false,
          bio: 'Sophomore interested in Competitive Programming and Open Source.',
          interests: ['Algorithms', 'Python', 'Web Development'],
          shareEmail: true,
          sharePhone: false,
          shareLinkedIn: true,
          linkedInUrl: 'https://linkedin.com/in/aarav-sharma',
        },
      },
      attendanceSettings: { create: { alertThreshold: 80.0 } },
    },
  });

  // 2-6. Five additional mentors across branches & years (total 6 seeded mentors)
  const mentorsData = [
    {
      name: 'Priya Patel',
      email: 'priya.patel@campus.edu',
      branch: 'Computer Science & Engineering',
      year: 3,
      sem: 5,
      interests: ['Machine Learning', 'System Design', 'Cloud Computing'],
      bio: 'Published ML researcher at IEEE student chapter. Can help with internship prep and PyTorch.',
      shareEmail: true,
      sharePhone: false,
      shareLinkedIn: true,
      linkedIn: 'https://linkedin.com/in/priya-patel',
    },
    {
      name: 'Rohan Mehra',
      email: 'rohan.mehra@campus.edu',
      branch: 'Computer Science & Engineering',
      year: 4,
      sem: 7,
      interests: ['Distributed Systems', 'DevOps', 'Go'],
      bio: 'Incoming SDE at top product firm. Mentoring for mock technical interviews and resume reviews.',
      shareEmail: true,
      sharePhone: true,
      shareLinkedIn: true,
      linkedIn: 'https://linkedin.com/in/rohan-mehra',
    },
    {
      name: 'Ananya Deshmukh',
      email: 'ananya.deshmukh@campus.edu',
      branch: 'Electronics & Communication',
      year: 3,
      sem: 5,
      interests: ['Embedded Systems', 'IoT', 'Robotics'],
      bio: 'Core member of Rover Team. Guiding juniors on ARM cortex microcontrollers and PCB design.',
      shareEmail: true,
      sharePhone: false,
      shareLinkedIn: false,
    },
    {
      name: 'Kabir Verma',
      email: 'kabir.verma@campus.edu',
      branch: 'Mechanical Engineering',
      year: 4,
      sem: 7,
      interests: ['CAD Modeling', 'Automotive Engineering', 'Thermal Sciences'],
      bio: 'Captain of Formula Student EV powertrain team. Happy to guide on FEA and Formula Bharat.',
      shareEmail: true,
      sharePhone: true,
      shareLinkedIn: true,
      linkedIn: 'https://linkedin.com/in/kabir-verma',
    },
    {
      name: 'Sneha Rao',
      email: 'sneha.rao@campus.edu',
      branch: 'Electrical Engineering',
      year: 2,
      sem: 3,
      interests: ['Renewable Energy', 'Power Electronics', 'Smart Grids'],
      bio: 'Second-year researcher studying micro-inverter efficiency. Available for coursework doubts.',
      shareEmail: true,
      sharePhone: false,
      shareLinkedIn: true,
      linkedIn: 'https://linkedin.com/in/sneha-rao',
    },
    {
      name: 'Devansh Joshi',
      email: 'devansh.joshi@campus.edu',
      branch: 'Computer Science & Engineering',
      year: 3,
      sem: 5,
      interests: ['Cybersecurity', 'Reverse Engineering', 'Cryptography'],
      bio: 'Active CTF player (top 50 national). Guiding juniors on network security & web pentesting.',
      shareEmail: true,
      sharePhone: false,
      shareLinkedIn: true,
      linkedIn: 'https://linkedin.com/in/devansh-joshi',
    },
  ];

  for (const m of mentorsData) {
    await prisma.user.create({
      data: {
        email: m.email,
        passwordHash: studentPw,
        fullName: m.name,
        role: Role.STUDENT,
        phone: '+91 98765 11223',
        studentProfile: {
          create: {
            collegeId: `2024${m.branch.substring(0, 3).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`,
            program: 'B.Tech',
            branch: m.branch,
            semester: m.sem,
            yearOfStudy: m.year,
          },
        },
        mentorProfile: {
          create: {
            isAvailable: true,
            bio: m.bio,
            interests: m.interests,
            shareEmail: m.shareEmail,
            sharePhone: m.sharePhone,
            shareLinkedIn: m.shareLinkedIn,
            linkedInUrl: m.linkedIn || null,
          },
        },
      },
    });
  }

  // Admin & Faculty accounts
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@campus.edu',
      passwordHash: adminPw,
      fullName: 'Campus Administrator',
      role: Role.ADMINISTRATOR,
      phone: '+91 98765 43230',
    },
  });

  const facultyUser = await prisma.user.create({
    data: {
      email: 'dr.ramanujan@campus.edu',
      passwordHash: facultyPw,
      fullName: 'Dr. S. Ramanujan',
      role: Role.FACULTY,
    },
  });

  // Library
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

  // Announcements
  await prisma.announcement.createMany({
    data: [
      {
        title: 'Mid-Semester Examination Schedule Declared',
        content: 'The mid-semester examinations for all B.Tech branches will commence next Monday. Bring college ID.',
        authorId: adminUser.id,
        authorRole: Role.ADMINISTRATOR,
        sourceCategory: AnnouncementSource.ADMINISTRATION,
        isVerifiedByAdmin: true,
        priority: AnnouncementPriority.HIGH,
      },
      {
        title: 'CS301: Assignment 2 Released — Graph Algorithms',
        content: 'Assignment 2 on Graph Traversal is posted on GitHub Classroom. Due Sunday midnight.',
        authorId: facultyUser.id,
        authorRole: Role.FACULTY,
        sourceCategory: AnnouncementSource.FACULTY,
        targetDepartment: 'Computer Science & Engineering',
        priority: AnnouncementPriority.NORMAL,
      },
    ],
  });

  // Events
  await prisma.event.createMany({
    data: [
      {
        title: 'TechX 2026 Innovation Conclave',
        description: 'Keynotes from alumni in AI and startup pitching in main auditorium.',
        category: EventCategory.CAMPUS,
        location: 'Main Auditorium',
        startTime: dayjs().add(2, 'day').hour(10).minute(0).toDate(),
        endTime: dayjs().add(2, 'day').hour(17).minute(0).toDate(),
        organizerId: adminUser.id,
        isPublic: true,
      },
      {
        title: 'Micro-ROS & Robotics Workshop',
        description: 'Deploy robot nodes to ESP32 microcontrollers with hands-on hardware.',
        category: EventCategory.WORKSHOP,
        location: 'Robotics Lab, Block C',
        startTime: dayjs().add(4, 'day').hour(14).minute(0).toDate(),
        endTime: dayjs().add(4, 'day').hour(18).minute(0).toDate(),
        organizerId: adminUser.id,
        isPublic: true,
      },
    ],
  });

  // Deadlines
  await prisma.deadline.createMany({
    data: [
      {
        title: 'CS301 Assignment 2 Submission',
        description: 'Graph Traversal implementation and analysis report on GitHub Classroom.',
        dueDate: dayjs().add(1, 'day').hour(23).minute(59).toDate(),
        category: DeadlineCategory.ASSIGNMENT,
        source: 'Dept of CSE',
      },
      {
        title: 'Semester Exam Hall Ticket Verification',
        description: 'Verify registration details and clear library dues.',
        dueDate: dayjs().add(4, 'day').hour(17).minute(0).toDate(),
        category: DeadlineCategory.REGISTRATION,
        source: 'Examination Cell',
      },
    ],
  });

  // Five Active Lost & Found Items
  await prisma.lostItem.createMany({
    data: [
      {
        title: 'Casio fx-991EX Scientific Calculator',
        description: 'Black scientific calculator left on row 3 desk after Discrete Maths class.',
        locationLost: 'Lecture Hall 101',
        dateLost: dayjs().subtract(1, 'day').toDate(),
        timeLost: '11:30 AM',
        contactEmail: 'aarav.sharma@campus.edu',
        contactPhone: '+91 98765 43210',
        userId: studentAarav.id,
        isResolved: false,
        createdAt: dayjs().subtract(1, 'day').toDate(),
      },
      {
        title: 'Noise ColorFit Smartwatch (Navy Blue Strap)',
        description: 'Navy blue strap smartwatch misplaced near badminton court bench.',
        locationLost: 'Indoor Sports Complex',
        dateLost: dayjs().subtract(3, 'day').toDate(),
        timeLost: '05:45 PM',
        contactEmail: 'priya.patel@campus.edu',
        isResolved: false,
        createdAt: dayjs().subtract(3, 'day').toDate(),
      },
      {
        title: 'SanDisk 64GB Dual USB-C Flash Drive',
        description: 'Silver metallic pen drive containing Ubuntu live image and OS lab codes.',
        locationLost: 'CS Lab 204, Block B',
        dateLost: dayjs().subtract(5, 'day').toDate(),
        timeLost: '03:15 PM',
        contactEmail: 'rohan.mehra@campus.edu',
        isResolved: false,
        createdAt: dayjs().subtract(5, 'day').toDate(),
      },
      {
        title: 'Titan Fastrack Polarized Sunglasses',
        description: 'Black frame sunglasses inside hard black case left on cafeteria table.',
        locationLost: 'Central Food Court',
        dateLost: dayjs().subtract(7, 'day').toDate(),
        timeLost: '01:20 PM',
        contactEmail: 'ananya.deshmukh@campus.edu',
        isResolved: false,
        createdAt: dayjs().subtract(7, 'day').toDate(),
      },
      {
        title: 'Boat Rockerz 450 Wireless Headphones (Hazel Beige)',
        description: 'Over-ear beige headphones left on desk near reference bookshelf.',
        locationLost: 'Central Library 2nd Floor',
        dateLost: dayjs().subtract(2, 'day').toDate(),
        timeLost: '04:00 PM',
        contactEmail: 'kabir.verma@campus.edu',
        isResolved: false,
        createdAt: dayjs().subtract(2, 'day').toDate(),
      },
    ],
  });

  console.log('[Seed] Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
