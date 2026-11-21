import { PrismaClient } from '@prisma/client';

export interface SubjectSeedDef {
  code: string;
  name: string;
  program: string;
  branch: string;
  semester: number;
  credits: number;
  facultyName?: string;
}

export const FOUNDATIONAL_SUBJECTS: SubjectSeedDef[] = [
  // Computer Science & Engineering (Semesters 1 - 8)
  { code: 'CS101', name: 'Fundamentals of Computer Programming', program: 'B.Tech', branch: 'Computer Science & Engineering', semester: 1, credits: 4, facultyName: 'Prof. Ananya Sen' },
  { code: 'CS201', name: 'Object-Oriented Programming & Principles', program: 'B.Tech', branch: 'Computer Science & Engineering', semester: 2, credits: 4, facultyName: 'Prof. Ananya Sen' },
  { code: 'CS301', name: 'Data Structures & Algorithms', program: 'B.Tech', branch: 'Computer Science & Engineering', semester: 3, credits: 4, facultyName: 'Dr. S. Ramanujan' },
  { code: 'CS302', name: 'Computer Organization & Architecture', program: 'B.Tech', branch: 'Computer Science & Engineering', semester: 3, credits: 3, facultyName: 'Prof. Ananya Sen' },
  { code: 'CS303', name: 'Database Management Systems', program: 'B.Tech', branch: 'Computer Science & Engineering', semester: 3, credits: 4, facultyName: 'Dr. Rajesh Kulkarni' },
  { code: 'MA301', name: 'Discrete Mathematics', program: 'B.Tech', branch: 'Computer Science & Engineering', semester: 3, credits: 3, facultyName: 'Dr. Meenakshi Sundaram' },
  { code: 'CS401', name: 'Operating Systems', program: 'B.Tech', branch: 'Computer Science & Engineering', semester: 4, credits: 4, facultyName: 'Dr. Rajesh Kulkarni' },
  { code: 'CS402', name: 'Design & Analysis of Algorithms', program: 'B.Tech', branch: 'Computer Science & Engineering', semester: 4, credits: 4, facultyName: 'Dr. S. Ramanujan' },
  { code: 'CS501', name: 'Computer Networks', program: 'B.Tech', branch: 'Computer Science & Engineering', semester: 5, credits: 4, facultyName: 'Prof. Ananya Sen' },
  { code: 'CS502', name: 'Theory of Computation', program: 'B.Tech', branch: 'Computer Science & Engineering', semester: 5, credits: 3, facultyName: 'Dr. Meenakshi Sundaram' },
  { code: 'CS601', name: 'Compiler Design', program: 'B.Tech', branch: 'Computer Science & Engineering', semester: 6, credits: 4, facultyName: 'Dr. Rajesh Kulkarni' },
  { code: 'CS602', name: 'Software Engineering & Agile', program: 'B.Tech', branch: 'Computer Science & Engineering', semester: 6, credits: 3, facultyName: 'Prof. Ananya Sen' },
  { code: 'CS701', name: 'Cloud Computing & Distributed Systems', program: 'B.Tech', branch: 'Computer Science & Engineering', semester: 7, credits: 3, facultyName: 'Dr. Rajesh Kulkarni' },
  { code: 'CS702', name: 'Artificial Intelligence & Machine Learning', program: 'B.Tech', branch: 'Computer Science & Engineering', semester: 7, credits: 4, facultyName: 'Dr. S. Ramanujan' },
  { code: 'CS801', name: 'Capstone Project & Industrial Training', program: 'B.Tech', branch: 'Computer Science & Engineering', semester: 8, credits: 6, facultyName: 'Dr. S. Ramanujan' },

  // Electronics & Communication (Semesters 1 - 8)
  { code: 'EC101', name: 'Basic Electronics Engineering', program: 'B.Tech', branch: 'Electronics & Communication', semester: 1, credits: 4, facultyName: 'Dr. Vikram Sarabhai' },
  { code: 'EC201', name: 'Electronic Devices & Semiconductor Circuits', program: 'B.Tech', branch: 'Electronics & Communication', semester: 2, credits: 4, facultyName: 'Dr. Vikram Sarabhai' },
  { code: 'EC301', name: 'Digital Logic Design & Verilog', program: 'B.Tech', branch: 'Electronics & Communication', semester: 3, credits: 4, facultyName: 'Prof. Sunita Williams' },
  { code: 'EC401', name: 'Signals, Systems & Transforms', program: 'B.Tech', branch: 'Electronics & Communication', semester: 4, credits: 4, facultyName: 'Dr. Vikram Sarabhai' },
  { code: 'EC501', name: 'Microprocessors & Microcontrollers', program: 'B.Tech', branch: 'Electronics & Communication', semester: 5, credits: 4, facultyName: 'Prof. Sunita Williams' },
  { code: 'EC601', name: 'Digital Communication & Information Theory', program: 'B.Tech', branch: 'Electronics & Communication', semester: 6, credits: 4, facultyName: 'Dr. Vikram Sarabhai' },
  { code: 'EC701', name: 'VLSI Design & Embedded System Architecture', program: 'B.Tech', branch: 'Electronics & Communication', semester: 7, credits: 4, facultyName: 'Prof. Sunita Williams' },
  { code: 'EC801', name: 'Advanced Wireless Networks & Major Project', program: 'B.Tech', branch: 'Electronics & Communication', semester: 8, credits: 6, facultyName: 'Dr. Vikram Sarabhai' },

  // Electrical Engineering (Semesters 1 - 8)
  { code: 'EE101', name: 'Principles of Electrical Engineering', program: 'B.Tech', branch: 'Electrical Engineering', semester: 1, credits: 4, facultyName: 'Dr. Homi Bhabha' },
  { code: 'EE201', name: 'Network Analysis & Circuit Theory', program: 'B.Tech', branch: 'Electrical Engineering', semester: 2, credits: 4, facultyName: 'Dr. Homi Bhabha' },
  { code: 'EE301', name: 'Electrical Machines & Transformers', program: 'B.Tech', branch: 'Electrical Engineering', semester: 3, credits: 4, facultyName: 'Prof. C.V. Raman' },
  { code: 'EE401', name: 'Power Systems Analysis & Modeling', program: 'B.Tech', branch: 'Electrical Engineering', semester: 4, credits: 4, facultyName: 'Dr. Homi Bhabha' },
  { code: 'EE501', name: 'Control Systems & Feedback Principles', program: 'B.Tech', branch: 'Electrical Engineering', semester: 5, credits: 4, facultyName: 'Prof. C.V. Raman' },
  { code: 'EE601', name: 'Power Electronics & Industrial Drives', program: 'B.Tech', branch: 'Electrical Engineering', semester: 6, credits: 4, facultyName: 'Dr. Homi Bhabha' },
  { code: 'EE701', name: 'Renewable Energy Systems & Smart Grids', program: 'B.Tech', branch: 'Electrical Engineering', semester: 7, credits: 4, facultyName: 'Prof. C.V. Raman' },
  { code: 'EE801', name: 'High Voltage Engineering & Capstone Project', program: 'B.Tech', branch: 'Electrical Engineering', semester: 8, credits: 6, facultyName: 'Dr. Homi Bhabha' },

  // Mechanical Engineering (Semesters 1 - 8)
  { code: 'ME101', name: 'Engineering Mechanics & Statics', program: 'B.Tech', branch: 'Mechanical Engineering', semester: 1, credits: 4, facultyName: 'Prof. Satish Dhawan' },
  { code: 'ME201', name: 'Engineering Thermodynamics & Applied Heat', program: 'B.Tech', branch: 'Mechanical Engineering', semester: 2, credits: 4, facultyName: 'Prof. Satish Dhawan' },
  { code: 'ME301', name: 'Mechanics of Solids & Materials', program: 'B.Tech', branch: 'Mechanical Engineering', semester: 3, credits: 4, facultyName: 'Dr. A.P.J. Abdul Kalam' },
  { code: 'ME401', name: 'Fluid Mechanics & Hydraulic Machinery', program: 'B.Tech', branch: 'Mechanical Engineering', semester: 4, credits: 4, facultyName: 'Prof. Satish Dhawan' },
  { code: 'ME501', name: 'Kinematics & Dynamics of Machinery', program: 'B.Tech', branch: 'Mechanical Engineering', semester: 5, credits: 4, facultyName: 'Dr. A.P.J. Abdul Kalam' },
  { code: 'ME601', name: 'Heat and Mass Transfer Fundamentals', program: 'B.Tech', branch: 'Mechanical Engineering', semester: 6, credits: 4, facultyName: 'Prof. Satish Dhawan' },
  { code: 'ME701', name: 'CAD/CAM & Automobile Engineering', program: 'B.Tech', branch: 'Mechanical Engineering', semester: 7, credits: 4, facultyName: 'Dr. A.P.J. Abdul Kalam' },
  { code: 'ME801', name: 'Production Technology & Capstone Project', program: 'B.Tech', branch: 'Mechanical Engineering', semester: 8, credits: 6, facultyName: 'Dr. A.P.J. Abdul Kalam' },

  // Civil Engineering (Semesters 1 - 8)
  { code: 'CE101', name: 'Introduction to Civil Engineering & Surveying', program: 'B.Tech', branch: 'Civil Engineering', semester: 1, credits: 4, facultyName: 'Sir M. Visvesvaraya' },
  { code: 'CE201', name: 'Building Materials, Technology & Construction', program: 'B.Tech', branch: 'Civil Engineering', semester: 2, credits: 4, facultyName: 'Sir M. Visvesvaraya' },
  { code: 'CE301', name: 'Strength of Materials & Structural Elements', program: 'B.Tech', branch: 'Civil Engineering', semester: 3, credits: 4, facultyName: 'Prof. E. Sreedharan' },
  { code: 'CE401', name: 'Structural Analysis & Indeterminate Structures', program: 'B.Tech', branch: 'Civil Engineering', semester: 4, credits: 4, facultyName: 'Sir M. Visvesvaraya' },
  { code: 'CE501', name: 'Geotechnical & Soil Mechanics Engineering', program: 'B.Tech', branch: 'Civil Engineering', semester: 5, credits: 4, facultyName: 'Prof. E. Sreedharan' },
  { code: 'CE601', name: 'Transportation Engineering & Highway Planning', program: 'B.Tech', branch: 'Civil Engineering', semester: 6, credits: 4, facultyName: 'Sir M. Visvesvaraya' },
  { code: 'CE701', name: 'Environmental Engineering & Water Resources', program: 'B.Tech', branch: 'Civil Engineering', semester: 7, credits: 4, facultyName: 'Prof. E. Sreedharan' },
  { code: 'CE801', name: 'Construction Management & Capstone Project', program: 'B.Tech', branch: 'Civil Engineering', semester: 8, credits: 6, facultyName: 'Sir M. Visvesvaraya' },

  // Information Technology (Semesters 1 - 8)
  { code: 'IT101', name: 'Computational Thinking & Python', program: 'B.Tech', branch: 'Information Technology', semester: 1, credits: 4, facultyName: 'Prof. Ananya Sen' },
  { code: 'IT201', name: 'Advanced Data Structures & C++', program: 'B.Tech', branch: 'Information Technology', semester: 2, credits: 4, facultyName: 'Prof. Ananya Sen' },
  { code: 'IT301', name: 'Web Development Architecture & Protocols', program: 'B.Tech', branch: 'Information Technology', semester: 3, credits: 4, facultyName: 'Dr. Rajesh Kulkarni' },
  { code: 'IT401', name: 'Database Engineering & Distributed NoSQL', program: 'B.Tech', branch: 'Information Technology', semester: 4, credits: 4, facultyName: 'Dr. Rajesh Kulkarni' },
  { code: 'IT501', name: 'Computer Systems Architecture & Linux', program: 'B.Tech', branch: 'Information Technology', semester: 5, credits: 4, facultyName: 'Prof. Ananya Sen' },
  { code: 'IT601', name: 'Information Security & Cryptography', program: 'B.Tech', branch: 'Information Technology', semester: 6, credits: 4, facultyName: 'Dr. Rajesh Kulkarni' },
  { code: 'IT701', name: 'Mobile & Cloud Application Development', program: 'B.Tech', branch: 'Information Technology', semester: 7, credits: 4, facultyName: 'Dr. S. Ramanujan' },
  { code: 'IT801', name: 'Enterprise Systems & Major Capstone Project', program: 'B.Tech', branch: 'Information Technology', semester: 8, credits: 6, facultyName: 'Dr. S. Ramanujan' },
];

/**
 * Idempotently ensures that foundational academic subjects exist in the database.
 * If the Subject table has 0 rows, or is missing foundational entries, they are upserted.
 */
export async function ensureFoundationalCurriculum(prisma: PrismaClient): Promise<number> {
  let seededCount = 0;
  for (const s of FOUNDATIONAL_SUBJECTS) {
    await prisma.subject.upsert({
      where: { code: s.code },
      update: {
        name: s.name,
        program: s.program,
        branch: s.branch,
        semester: s.semester,
        credits: s.credits,
        facultyName: s.facultyName,
      },
      create: {
        code: s.code,
        name: s.name,
        program: s.program,
        branch: s.branch,
        semester: s.semester,
        credits: s.credits,
        facultyName: s.facultyName,
      },
    });
    seededCount++;
  }
  return seededCount;
}
