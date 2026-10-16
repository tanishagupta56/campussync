import { PrismaClient, OpportunityCategory } from '@prisma/client';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed:Opportunities-Scholarships] Running idempotent seed for 6 scholarships and 8 opportunities...');

  // Demo student Priya Patel (mentor who received scholarships)
  const priya = await prisma.user.findUnique({ where: { email: 'priya.patel@campus.edu' } });
  const rohan = await prisma.user.findUnique({ where: { email: 'rohan.mehra@campus.edu' } });

  // 1. Seed 6 Realistic Indian Scholarships
  const scholarshipsData = [
    {
      name: 'Central Sector Scheme of Scholarships for College and University Students',
      provider: 'Ministry of Education, Govt of India',
      amount: 'INR20,000 / year',
      deadline: dayjs().add(25, 'day').toDate(),
      description: 'Merit-cum-means scholarship for top percentile scorers in Higher Secondary Examination pursuing professional degree courses.',
      eligibility: 'Above 80th percentile in Class 12, family income under INR4.5 LPA, regular degree course.',
      branch: null,
      applicationLink: 'https://scholarships.gov.in',
      isVerifiedByAdmin: true,
      recipients: [
        ...(priya ? [{ studentId: priya.id, yearAwarded: 2024, optedIntoMentoring: true }] : []),
        ...(rohan ? [{ studentId: rohan.id, yearAwarded: 2023, optedIntoMentoring: true }] : []),
      ],
    },
    {
      name: 'AICTE Pragati Scholarship for Girl Students',
      provider: 'All India Council for Technical Education (AICTE)',
      amount: 'INR50,000 / year',
      deadline: dayjs().add(18, 'day').toDate(),
      description: 'Dedicated financial grant covering tuition and contingency allowance for young women admitted into degree technical programmes.',
      eligibility: 'Female students admitted in 1st year B.Tech/B.E., family income under INR8 LPA (max 2 girls per family).',
      branch: null,
      applicationLink: 'https://www.aicte-india.org',
      isVerifiedByAdmin: true,
      recipients: [
        ...(priya ? [{ studentId: priya.id, yearAwarded: 2024, optedIntoMentoring: true }] : []),
      ],
    },
    {
      name: 'Aditya Birla Group Engineering Scholarship',
      provider: 'Aditya Birla Education Trust',
      amount: 'INR1,50,000 / year',
      deadline: dayjs().add(12, 'day').toDate(),
      description: 'Prestigious corporate scholarship awarded to undergraduate engineering students demonstrating exceptional technical and leadership merit.',
      eligibility: 'Top 20 rank holders in institute admission test, minimum 8.5 CGPA in current semester.',
      branch: 'Computer Science & Engineering',
      applicationLink: 'https://www.adityabirlascholars.net',
      isVerifiedByAdmin: true,
      recipients: [
        ...(rohan ? [{ studentId: rohan.id, yearAwarded: 2024, optedIntoMentoring: true }] : []),
      ],
    },
    {
      name: 'Foundation for Excellence (FFE) Engineering Scholarship',
      provider: 'FFE India Trust',
      amount: 'INR40,000 / year',
      deadline: dayjs().add(30, 'day').toDate(),
      description: 'Comprehensive financial, laptop and soft skills mentorship support for gifted engineering and computer science students.',
      eligibility: 'Class 12 >70%, gross family income below INR3 LPA, enrollment in accredited state/central universities.',
      branch: null,
      applicationLink: 'https://ffe.org',
      isVerifiedByAdmin: true,
      recipients: [],
    },
    {
      name: 'Siemens Scholarship Programme for Technical Undergraduates',
      provider: 'Siemens India Ltd',
      amount: 'INR60,000 + Internship',
      deadline: dayjs().add(40, 'day').toDate(),
      description: 'Holistic four-year scholarship including annual grant, full tuition fee reimbursement, and guaranteed summer internship at Siemens R&D labs.',
      eligibility: '1st year students of Mechanical, Electrical or Computer Engineering with family income under INR5 LPA.',
      branch: 'Mechanical Engineering',
      applicationLink: 'https://www.siemens.co.in/scholarship',
      isVerifiedByAdmin: true,
      recipients: [],
    },
    {
      name: 'ONGC Merit-cum-Means National Scholarship',
      provider: 'ONGC Foundation',
      amount: 'INR48,000 / year',
      deadline: dayjs().add(22, 'day').toDate(),
      description: 'National development scholarship for socially and economically underprivileged engineering undergraduates.',
      eligibility: 'Minimum 60% in qualifying board examination, family income under INR2 LPA.',
      branch: null,
      applicationLink: 'https://ongcscholar.org',
      isVerifiedByAdmin: false,
      recipients: [],
    },
  ];

  for (const s of scholarshipsData) {
    const existing = await prisma.scholarship.findFirst({ where: { name: s.name } });
    if (!existing) {
      const created = await prisma.scholarship.create({
        data: {
          name: s.name,
          provider: s.provider,
          amount: s.amount,
          deadline: s.deadline,
          description: s.description,
          eligibility: s.eligibility,
          branch: s.branch,
          applicationLink: s.applicationLink,
          isVerifiedByAdmin: s.isVerifiedByAdmin,
        },
      });

      for (const r of s.recipients) {
        await prisma.scholarshipRecipient.upsert({
          where: {
            scholarshipId_studentId: {
              scholarshipId: created.id,
              studentId: r.studentId,
            },
          },
          create: {
            scholarshipId: created.id,
            studentId: r.studentId,
            yearAwarded: r.yearAwarded,
            optedIntoMentoring: r.optedIntoMentoring,
          },
          update: {},
        });
      }
    }
  }

  // 2. Seed 8 Realistic Opportunities
  const opportunitiesData = [
    {
      name: 'Google Summer of Code (GSoC) 2026',
      organization: 'Google Open Source',
      category: OpportunityCategory.FELLOWSHIP,
      description: 'Global remote stipend-backed program bringing student contributors into open source software development organizations for 12 weeks.',
      eligibility: 'Enrolled undergraduate or postgraduate student 18+ years of age. Familiar with Git and programming.',
      deadline: dayjs().add(20, 'day').toDate(),
      applicationLink: 'https://summerofcode.withgoogle.com',
      stipend: '$1,500 - $3,000',
      branch: 'Computer Science & Engineering',
      year: 2,
    },
    {
      name: 'Smart India Hackathon (SIH) 2026',
      organization: 'Ministry of Education Innovation Cell (MIC)',
      category: OpportunityCategory.HACKATHON,
      description: 'Nationwide 36-hour live product hackathon to innovate digital solutions for pressing challenges of government ministries and industry.',
      eligibility: 'Teams of 6 students from accredited institutes with at least one female teammate.',
      deadline: dayjs().add(15, 'day').toDate(),
      applicationLink: 'https://sih.gov.in',
      stipend: 'INR1,00,000 Cash Prize / problem statement',
      branch: null,
      year: null,
    },
    {
      name: 'Microsoft Imagine Cup Global Student Competition',
      organization: 'Microsoft Corporation',
      category: OpportunityCategory.COMPETITION,
      description: 'Premier global student technology competition challenging student founders to build purpose-driven software leveraging Microsoft Azure & AI.',
      eligibility: 'Students aged 16+ enrolled in university degree programs, teams up to 4 members.',
      deadline: dayjs().add(35, 'day').toDate(),
      applicationLink: 'https://imaginecup.microsoft.com',
      stipend: '$100,000 USD Grand Prize + Mentorship',
      branch: null,
      year: null,
    },
    {
      name: 'DRDO Summer Research Internship',
      organization: 'Defence Research and Development Organisation',
      category: OpportunityCategory.INTERNSHIP,
      description: 'Hands-on 8-week summer internship at DRDO Labs working on autonomous radar systems, signal processing, and embedded telemetry.',
      eligibility: 'Pre-final year B.Tech students in CSE, ECE or Electrical with minimum 7.5 CGPA.',
      deadline: dayjs().add(14, 'day').toDate(),
      applicationLink: 'https://drdo.gov.in',
      stipend: 'INR10,000 / month',
      branch: 'Electronics & Communication',
      year: 3,
    },
    {
      name: 'IIT Bombay E-Yantra Robotics Workshop & Challenge',
      organization: 'e-Yantra Project, IIT Bombay',
      category: OpportunityCategory.WORKSHOP,
      description: 'Intensive sponsored hands-on workshop on embedded ROS, mobile robotics path planning, and embedded control systems.',
      eligibility: 'Engineering undergraduates from 2nd, 3rd, or 4th year across all engineering branches.',
      deadline: dayjs().add(10, 'day').toDate(),
      applicationLink: 'https://e-yantra.org',
      stipend: 'Sponsored kits & certificates',
      branch: null,
      year: null,
    },
    {
      name: 'Flipkart GRiD 7.0 Tech Challenge',
      organization: 'Flipkart Engineering',
      category: OpportunityCategory.COMPETITION,
      description: 'Flagship engineering campus competition across e-commerce tracks: GenAI, Robotics automation, and scalable backend infrastructure.',
      eligibility: 'B.Tech / B.E. students graduating in 2026, 2027, or 2028.',
      deadline: dayjs().add(28, 'day').toDate(),
      applicationLink: 'https://unstop.com/flipkart-grid',
      stipend: 'PPI / Job Offers + INR5,00,000 Cash Pool',
      branch: 'Computer Science & Engineering',
      year: 3,
    },
    {
      name: 'ISRO Chandrayaan Data Science Fellowship',
      organization: 'Indian Space Research Organisation (ISRO)',
      category: OpportunityCategory.RESEARCH,
      description: 'Open research fellowship analyzing Lunar hyperspectral planetary imagery and rover spatial sensor streams using computer vision.',
      eligibility: 'Final and pre-final year students with Python and machine learning coursework.',
      deadline: dayjs().add(45, 'day').toDate(),
      applicationLink: 'https://isro.gov.in/fellowships',
      stipend: 'INR25,000 / month',
      branch: 'Computer Science & Engineering',
      year: 3,
    },
    {
      name: 'ETHIndia Web3 Builders Hackathon',
      organization: 'Devfolio & Ethereum Foundation',
      category: OpportunityCategory.HACKATHON,
      description: 'Asia’s biggest Web3 and decentralised systems hackathon with developer bounties from protocol foundations and angel investors.',
      eligibility: 'Open to all developers and student builders.',
      deadline: dayjs().add(32, 'day').toDate(),
      applicationLink: 'https://ethindia.co',
      stipend: '$100,000+ in bounties and travel grants',
      branch: null,
      year: null,
    },
  ];

  for (const op of opportunitiesData) {
    const existing = await prisma.opportunity.findFirst({ where: { name: op.name } });
    if (!existing) {
      await prisma.opportunity.create({
        data: {
          name: op.name,
          organization: op.organization,
          category: op.category,
          description: op.description,
          eligibility: op.eligibility,
          deadline: op.deadline,
          applicationLink: op.applicationLink,
          stipend: op.stipend,
          branch: op.branch,
          year: op.year,
        },
      });
    }
  }

  console.log('[Seed:Opportunities-Scholarships] Seeding completed idempotently.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
