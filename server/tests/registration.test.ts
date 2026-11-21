import { PrismaClient, Role } from '@prisma/client';
import { ensureFoundationalCurriculum, FOUNDATIONAL_SUBJECTS } from '../src/db/curriculum';
import { AuthService } from '../src/services/auth.service';

const prisma = new PrismaClient();

async function runRegistrationTests() {
  console.log('========================================================');
  console.log('--- STARTING REGISTRATION & DROPDOWN TEST SUITE ---');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Curriculum & Database Subject Integrity
    // ----------------------------------------------------
    console.log('Test Group 1: Database Curriculum Coverage');
    assert(FOUNDATIONAL_SUBJECTS.length >= 48, `Foundational curriculum defines ${FOUNDATIONAL_SUBJECTS.length} subjects (covers 6 branches x 8 semesters)`);

    const branchesExpected = [
      'Computer Science & Engineering',
      'Electronics & Communication',
      'Electrical Engineering',
      'Mechanical Engineering',
      'Civil Engineering',
      'Information Technology',
    ];

    for (const b of branchesExpected) {
      const subsForBranch = FOUNDATIONAL_SUBJECTS.filter((s) => s.branch === b);
      const semSet = new Set(subsForBranch.map((s) => s.semester));
      assert(semSet.size === 8, `Branch "${b}" has subjects defined for all 8 semesters (found: ${Array.from(semSet).sort((x, y) => x - y).join(', ')})`);
    }

    // ----------------------------------------------------
    // TEST 2: Program & Semester Metadata Mapping (GET /api/meta/programs logic)
    // ----------------------------------------------------
    console.log('\nTest Group 2: Program and Semester Dropdown Options Generation');
    
    // Simulate programs mapping from subjects
    const branchMap = new Map<string, { program: string; branch: string; semesters: number[] }>();
    for (const sub of FOUNDATIONAL_SUBJECTS) {
      if (!branchMap.has(sub.branch)) {
        branchMap.set(sub.branch, { program: sub.program, branch: sub.branch, semesters: [] });
      }
      const item = branchMap.get(sub.branch)!;
      if (!item.semesters.includes(sub.semester)) {
        item.semesters.push(sub.semester);
      }
    }

    const programs = Array.from(branchMap.values()).map((b) => ({
      ...b,
      semesters: b.semesters.sort((x, y) => x - y),
    }));

    assert(programs.length === 6, `Total 6 academic branches generated for Branch dropdown`);

    // Verify Branch dropdown independence
    const branchNames = programs.map((p) => p.branch);
    assert(branchNames.includes('Computer Science & Engineering'), 'Branch dropdown contains Computer Science & Engineering');
    assert(branchNames.includes('Mechanical Engineering'), 'Branch dropdown contains Mechanical Engineering');
    assert(branchNames.includes('Electrical Engineering'), 'Branch dropdown contains Electrical Engineering');
    assert(branchNames.includes('Civil Engineering'), 'Branch dropdown contains Civil Engineering');

    // Verify Semester dropdown independence & dependency on branch
    for (const p of programs) {
      assert(p.semesters.length === 8, `Semester dropdown for "${p.branch}" contains 8 semesters`);
      assert(JSON.stringify(p.semesters) === JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8]), `Semesters for "${p.branch}" are [1, 2, 3, 4, 5, 6, 7, 8]`);
    }

    // ----------------------------------------------------
    // TEST 3: Validation Logic
    // ----------------------------------------------------
    console.log('\nTest Group 3: Branch and Semester Validation Logic');

    // Valid combinations
    for (let sem = 1; sem <= 8; sem++) {
      const matchCSE = FOUNDATIONAL_SUBJECTS.find((s) => s.branch === 'Computer Science & Engineering' && s.semester === sem);
      assert(!!matchCSE, `Valid (CSE, Semester ${sem}) finds subject ${matchCSE?.code}`);
    }

    const matchME7 = FOUNDATIONAL_SUBJECTS.find((s) => s.branch === 'Mechanical Engineering' && s.semester === 7);
    assert(!!matchME7 && matchME7.code === 'ME701', `Valid (Mechanical Engineering, Semester 7) finds subject ME701`);

    const matchCivil3 = FOUNDATIONAL_SUBJECTS.find((s) => s.branch === 'Civil Engineering' && s.semester === 3);
    assert(!!matchCivil3 && matchCivil3.code === 'CE301', `Valid (Civil Engineering, Semester 3) finds subject CE301`);

    // Invalid combinations
    const invalidBranch = FOUNDATIONAL_SUBJECTS.find((s) => s.branch === 'Aerospace Engineering' && s.semester === 1);
    assert(!invalidBranch, 'Invalid branch "Aerospace Engineering" correctly has no match in curriculum');

    const invalidSem = FOUNDATIONAL_SUBJECTS.find((s) => s.branch === 'Computer Science & Engineering' && s.semester === 9);
    assert(!invalidSem, 'Invalid semester 9 correctly has no match in curriculum');

    console.log('\n========================================================');
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Test execution failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runRegistrationTests();
