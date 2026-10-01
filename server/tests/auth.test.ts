import { PrismaClient } from '@prisma/client';
import app from '../src/index';
import http from 'http';

const prisma = new PrismaClient();

async function runTests() {
  console.log('--- STARTING PHASE 2 AUTHENTICATION SUITE ---');
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5099, resolve));
  const baseUrl = 'http://localhost:5099';

  try {
    // 1. Health check
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthJson = await healthRes.json();
    if (healthRes.status !== 200 || healthJson.status !== 'ok') {
      throw new Error(`Health check failed: ${JSON.stringify(healthJson)}`);
    }

    // 2. Student credentials + Student role
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'aarav.sharma@campus.edu',
        password: 'Student@123',
        selectedRole: 'STUDENT',
      }),
    });
    const loginJson = await loginRes.json();
    if (loginRes.status !== 200 || !loginJson.data?.challengeId) {
      throw new Error(`Login failed: ${JSON.stringify(loginJson)}`);
    }
    const challengeId = loginJson.data.challengeId;

    // 3. Student credentials with Administrator role selected -> MUST FAIL (403)
    const adminMismatchRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'aarav.sharma@campus.edu',
        password: 'Student@123',
        selectedRole: 'ADMINISTRATOR',
      }),
    });
    const adminMismatchJson = await adminMismatchRes.json();
    if (adminMismatchRes.status !== 403 || !adminMismatchJson.message.includes('Administrator access')) {
      throw new Error(`Expected 403 with Administrator error, got ${adminMismatchRes.status}`);
    }

    // 4. Faculty credentials with Administrator role selected -> MUST FAIL (403)
    const facMismatchRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'dr.ramanujan@campus.edu',
        password: 'Faculty@123',
        selectedRole: 'ADMINISTRATOR',
      }),
    });
    const facMismatchJson = await facMismatchRes.json();
    if (facMismatchRes.status !== 403) {
      throw new Error(`Expected 403 for Faculty selecting Admin, got ${facMismatchRes.status}`);
    }

    // 5. Wrong OTP attempt
    const wrongOtpRes = await fetch(`${baseUrl}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challengeId,
        otp: '000000',
      }),
    });
    const wrongOtpJson = await wrongOtpRes.json();
    if (wrongOtpRes.status !== 400 || !wrongOtpJson.message.includes('Incorrect verification code')) {
      throw new Error(`Expected 400 with attempt count, got ${wrongOtpRes.status}`);
    }

    // 6. Verify correct OTP
    const freshLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'aarav.sharma@campus.edu',
        password: 'Student@123',
        selectedRole: 'STUDENT',
      }),
    });
    const freshJson = await freshLogin.json();
    const freshChallengeId = freshJson.data.challengeId;

    const challengeRow = await prisma.otpChallenge.findUnique({
      where: { id: freshChallengeId },
    });
    if (!challengeRow) throw new Error('Challenge not found in DB');

    const crypto = await import('crypto');
    let matchingOtp = '';
    for (let i = 100000; i <= 999999; i++) {
      const candidate = i.toString();
      const hash = crypto.createHash('sha256').update(candidate).digest('hex');
      if (hash === challengeRow.otpHash) {
        matchingOtp = candidate;
        break;
      }
    }

    const verifyRes = await fetch(`${baseUrl}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challengeId: freshChallengeId,
        otp: matchingOtp,
      }),
    });
    const verifyJson = await verifyRes.json();
    if (verifyRes.status !== 200 || !verifyJson.data?.token || !verifyJson.data?.user) {
      throw new Error(`Verification failed: ${JSON.stringify(verifyJson)}`);
    }
    const token = verifyJson.data.token;

    // 7. GET /api/auth/me with Bearer token
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meJson = await meRes.json();
    if (meRes.status !== 200 || meJson.data?.user?.email !== 'aarav.sharma@campus.edu') {
      throw new Error(`GET /me failed: ${JSON.stringify(meJson)}`);
    }

    // 8. Logout
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const logoutJson = await logoutRes.json();
    if (logoutRes.status !== 200) {
      throw new Error(`Logout failed: ${JSON.stringify(logoutJson)}`);
    }

    console.log('ALL PHASE 2 BACKEND AUTH TESTS PASSED PERFECTLY!');
    process.exit(0);
  } catch (err: any) {
    console.error('TEST FAILED:', err.message);
    process.exit(1);
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runTests();
