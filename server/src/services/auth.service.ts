import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dayjs from 'dayjs';
import { config } from '../config/env';
import { generateSecureOtp, hashOtp, verifyOtpHash } from '../utils/crypto';
import { sendOtpEmail, sendAccountNoticeEmail } from './email.service';

const prisma = new PrismaClient();

export interface InitiateLoginParams {
  email: string;
  password: string;
  selectedRole: string; // "STUDENT" | "FACULTY" | "ADMINISTRATOR" | "CLUB_CORE"
  ipAddress?: string;
}

export interface VerifyOtpParams {
  challengeId: string;
  otp: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ResendOtpParams {
  challengeId: string;
}

export interface RegisterUserParams {
  fullName: string;
  email: string;
  password: string;
  branch: string;
  semester: number;
  ipAddress?: string;
}

export interface VerifyRegistrationParams {
  challengeId: string;
  otp: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AuthService {
  /**
   * Step 1: Validates credentials & selected role against DB, then creates and sends an OTP challenge.
   */
  static async initiateLogin({ email, password, selectedRole, ipAddress }: InitiateLoginParams) {
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Fetch user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { studentProfile: true },
    });

    // 2. Timing-safe password verification
    let isPasswordValid = false;
    if (user) {
      isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    } else {
      // Run dummy compare to mitigate timing enumeration attacks
      await bcrypt.compare(password, '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGH');
    }

    if (!user || !isPasswordValid) {
      // Safe, generic error message
      throw { status: 401, message: 'Incorrect email or password.' };
    }

    // Unverified accounts cannot log in
    if (user.isEmailVerified === false) {
      throw { status: 403, message: 'Your account is not verified. Please complete email verification.' };
    }

    // 3. Strict Role Verification against Database Source of Truth
    // The database is the final authority. Selected role never grants elevated access.
    if (user.role !== selectedRole) {
      if (selectedRole === 'ADMINISTRATOR') {
        throw { status: 403, message: 'This account does not have Administrator access.' };
      } else if (selectedRole === 'FACULTY') {
        throw { status: 403, message: 'This account does not have Faculty access.' };
      } else if (selectedRole === 'CLUB_CORE') {
        throw { status: 403, message: 'This account does not have Club Core access.' };
      } else {
        throw { status: 403, message: `Access denied. Selected role does not match account credentials.` };
      }
    }

    // 4. Invalidate any existing pending challenges for this user
    await prisma.otpChallenge.updateMany({
      where: {
        userId: user.id,
        consumedAt: null,
      },
      data: {
        consumedAt: new Date(), // cancel previous pending
      },
    });

    // 5. Generate secure 6-digit OTP and store hash in database
    const plainOtp = generateSecureOtp();
    const otpHash = hashOtp(plainOtp);
    const expiresAt = dayjs().add(10, 'minute').toDate();

    const challenge = await prisma.otpChallenge.create({
      data: {
        userId: user.id,
        otpHash,
        expiresAt,
        attempts: 0,
        ipAddress,
      },
    });

    // 6. Deliver OTP via email (or dev console fallback)
    await sendOtpEmail({
      toEmail: user.email,
      recipientName: user.fullName,
      otp: plainOtp,
      role: user.role,
    });

    // Return masked email and challengeId (NEVER return plain OTP or user hash)
    const emailParts = user.email.split('@');
    const maskedName = emailParts[0].length > 3
      ? `${emailParts[0].slice(0, 2)}***${emailParts[0].slice(-1)}`
      : `${emailParts[0].slice(0, 1)}***`;
    const maskedEmail = `${maskedName}@${emailParts[1]}`;

    return {
      challengeId: challenge.id,
      maskedEmail,
      expiresAt: challenge.expiresAt,
      message: `A 6-digit verification code has been sent to ${maskedEmail}.`,
      // DEV_SHOW_OTP: when true, return OTP in API response ONLY for @campus.edu emails. When false, never return/log.
      ...(config.devShowOtp && user.email.toLowerCase().endsWith('@campus.edu') ? { devOtp: plainOtp } : {}),
    };
  }

  /**
   * Step 2: Verifies the 6-digit OTP, handles attempt limits, and issues a session token.
   */
  static async verifyOtp({ challengeId, otp, ipAddress, userAgent }: VerifyOtpParams) {
    const challenge = await prisma.otpChallenge.findUnique({
      where: { id: challengeId },
      include: {
        user: {
          include: {
            studentProfile: true,
            mentorProfile: true,
          },
        },
      },
    });

    if (!challenge) {
      throw { status: 400, message: 'Invalid or expired verification session. Please log in again.' };
    }

    // Check if challenge is already consumed
    if (challenge.consumedAt) {
      throw { status: 400, message: 'This verification code has already been used. Please log in again.' };
    }

    // Check if challenge has expired (10 minutes)
    if (dayjs().isAfter(dayjs(challenge.expiresAt))) {
      throw { status: 400, message: 'Verification code has expired. Please request a new code.' };
    }

    // Check attempt limits (Maximum 5 wrong attempts)
    if (challenge.attempts >= 5) {
      // Invalidate challenge
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: new Date() },
      });
      throw {
        status: 429,
        message: 'Maximum verification attempts exceeded. For your security, this code is now invalidated. Please log in again.',
      };
    }

    // Verify OTP Hash using timing-safe comparison
    const isValidOtp = verifyOtpHash(otp, challenge.otpHash);

    if (!isValidOtp) {
      const updatedAttempts = challenge.attempts + 1;
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: updatedAttempts },
      });

      const remaining = 5 - updatedAttempts;
      if (remaining <= 0) {
        // Invalidate on 5th failure
        await prisma.otpChallenge.update({
          where: { id: challenge.id },
          data: { consumedAt: new Date() },
        });
        throw {
          status: 400,
          message: 'Incorrect verification code. Maximum attempts reached. Please request a new code.',
        };
      }

      throw {
        status: 400,
        message: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
      };
    }

    // Success! Mark challenge as consumed
    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    });

    // Create session record in database
    const sessionExpiry = dayjs().add(7, 'day').toDate();
    const sessionToken = jwt.sign(
      {
        userId: challenge.user.id,
        email: challenge.user.email,
        role: challenge.user.role,
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    await prisma.session.create({
      data: {
        userId: challenge.user.id,
        token: sessionToken,
        expiresAt: sessionExpiry,
        ipAddress,
        userAgent,
      },
    });

    // Return sanitized user object (never include passwordHash or otp secrets)
    const { passwordHash, ...safeUser } = challenge.user;

    return {
      token: sessionToken,
      user: safeUser,
    };
  }

  /**
   * Resend OTP with cooldown (60s) and hourly cap.
   */
  static async resendOtp({ challengeId }: ResendOtpParams) {
    const existing = await prisma.otpChallenge.findUnique({
      where: { id: challengeId },
      include: { user: true },
    });

    if (!existing || existing.consumedAt) {
      throw { status: 400, message: 'Invalid or already consumed challenge. Please log in again.' };
    }

    // 60-second cooldown check
    const secondsSinceCreation = dayjs().diff(dayjs(existing.createdAt), 'second');
    if (secondsSinceCreation < 60) {
      const waitSeconds = 60 - secondsSinceCreation;
      throw {
        status: 429,
        message: `Please wait ${waitSeconds} more second${waitSeconds === 1 ? '' : 's'} before requesting a new code.`,
      };
    }

    // Hourly cap check (maximum 5 requests per hour)
    const oneHourAgo = dayjs().subtract(1, 'hour').toDate();
    const recentCount = await prisma.otpChallenge.count({
      where: {
        userId: existing.userId,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentCount >= 5) {
      throw {
        status: 429,
        message: 'Hourly OTP request limit reached. Please try again after an hour.',
      };
    }

    // Generate new OTP for the challenge
    const newOtp = generateSecureOtp();
    const newHash = hashOtp(newOtp);
    const newExpiry = dayjs().add(10, 'minute').toDate();

    await prisma.otpChallenge.update({
      where: { id: challengeId },
      data: {
        otpHash: newHash,
        expiresAt: newExpiry,
        attempts: 0,
      },
    });

    await sendOtpEmail({
      toEmail: existing.user.email,
      recipientName: existing.user.fullName,
      otp: newOtp,
      role: existing.user.role,
    });

    return {
      success: true,
      message: 'A fresh 6-digit verification code has been sent.',
      ...(config.devShowOtp && existing.user.email.toLowerCase().endsWith('@campus.edu') ? { devOtp: newOtp } : {}),
    };
  }

  /**
   * Self-Registration for Students
   * Public, rate-limited, Zod validated, role always STUDENT.
   */
  static async registerUser({ fullName, email, password, branch, semester, ipAddress }: RegisterUserParams) {
    // 1. Delete unverified accounts older than 24 hours
    try {
      await prisma.user.deleteMany({
        where: {
          isEmailVerified: false,
          createdAt: { lt: dayjs().subtract(24, 'hours').toDate() },
        },
      });
    } catch (e) {
      // Ignore background cleanup errors
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Validate branch and semester options against Subject table
    const subjectMatch = await prisma.subject.findFirst({
      where: { branch, semester },
    });
    if (!subjectMatch) {
      throw { status: 400, message: 'Invalid program branch or semester combination.' };
    }

    // 3. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser && existingUser.isEmailVerified) {
      // If the email already has an account, respond exactly as for a new registration (generic message)
      // and email that address a notice, so account existence isn't revealed.
      await sendAccountNoticeEmail(existingUser.email, existingUser.fullName);

      const emailParts = normalizedEmail.split('@');
      const maskedName = emailParts[0].length > 3
        ? `${emailParts[0].slice(0, 2)}***${emailParts[0].slice(-1)}`
        : `${emailParts[0].slice(0, 1)}***`;
      const maskedEmail = `${maskedName}@${emailParts[1]}`;

      return {
        challengeId: '00000000-0000-0000-0000-000000000000',
        maskedEmail,
        expiresAt: dayjs().add(10, 'minute').toDate(),
        message: `A 6-digit verification code has been sent to ${maskedEmail}.`,
      };
    }

    // 4. Create or update unverified account (Role is ALWAYS STUDENT, set on server)
    const passwordHash = await bcrypt.hash(password, 10);
    let user;
    if (existingUser) {
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          fullName,
          passwordHash,
          role: Role.STUDENT,
          isEmailVerified: false,
          registrationBranch: branch,
          registrationSemester: semester,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          fullName,
          passwordHash,
          role: Role.STUDENT,
          isEmailVerified: false,
          registrationBranch: branch,
          registrationSemester: semester,
        },
      });
    }

    // 5. Check hourly cap for OTP creation
    const oneHourAgo = dayjs().subtract(1, 'hour').toDate();
    const recentCount = await prisma.otpChallenge.count({
      where: { userId: user.id, createdAt: { gte: oneHourAgo } },
    });
    if (recentCount >= 5) {
      throw { status: 429, message: 'Too many verification code requests. Please wait an hour.' };
    }

    // Invalidate existing pending challenges
    await prisma.otpChallenge.updateMany({
      where: { userId: user.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    // 6. Generate OTP, hash, store challenge (10 min expiry, 5 attempts, single use)
    const plainOtp = generateSecureOtp();
    const otpHash = hashOtp(plainOtp);
    const expiresAt = dayjs().add(10, 'minute').toDate();

    const challenge = await prisma.otpChallenge.create({
      data: {
        userId: user.id,
        otpHash,
        expiresAt,
        attempts: 0,
        ipAddress,
      },
    });

    // 7. Deliver OTP via email
    await sendOtpEmail({
      toEmail: user.email,
      recipientName: user.fullName,
      otp: plainOtp,
      role: 'Student Registration',
    });

    const emailParts = user.email.split('@');
    const maskedName = emailParts[0].length > 3
      ? `${emailParts[0].slice(0, 2)}***${emailParts[0].slice(-1)}`
      : `${emailParts[0].slice(0, 1)}***`;
    const maskedEmail = `${maskedName}@${emailParts[1]}`;

    return {
      challengeId: challenge.id,
      maskedEmail,
      expiresAt: challenge.expiresAt,
      message: `A 6-digit verification code has been sent to ${maskedEmail}.`,
      ...(config.devShowOtp && user.email.toLowerCase().endsWith('@campus.edu') ? { devOtp: plainOtp } : {}),
    };
  }

  /**
   * Verifies Registration OTP, marks verified, creates StudentProfile & Enrollment, signs in.
   */
  static async verifyRegistration({ challengeId, otp, ipAddress, userAgent }: VerifyRegistrationParams) {
    if (challengeId === '00000000-0000-0000-0000-000000000000') {
      throw { status: 400, message: 'Invalid or expired verification session.' };
    }

    const challenge = await prisma.otpChallenge.findUnique({
      where: { id: challengeId },
      include: { user: true },
    });

    if (!challenge) {
      throw { status: 400, message: 'Invalid verification session. Please register again.' };
    }

    if (challenge.consumedAt) {
      throw { status: 400, message: 'This verification code has already been used.' };
    }

    if (dayjs().isAfter(dayjs(challenge.expiresAt))) {
      throw { status: 400, message: 'Verification code has expired. Please request a new code.' };
    }

    if (challenge.attempts >= 5) {
      throw { status: 429, message: 'Too many incorrect attempts. Please request a fresh verification code.' };
    }

    const isMatch = verifyOtpHash(otp, challenge.otpHash);
    if (!isMatch) {
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      const remaining = 5 - (challenge.attempts + 1);
      throw { status: 401, message: `Invalid code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` };
    }

    // Consume challenge
    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    });

    // Mark user verified
    const user = await prisma.user.update({
      where: { id: challenge.userId },
      data: { isEmailVerified: true },
    });

    // Create StudentProfile & Enrollment
    const branch = user.registrationBranch || 'Computer Science & Engineering';
    const semester = user.registrationSemester || 1;
    const year = new Date().getFullYear();
    const branchAbbr = branch.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3) || 'CSE';
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const collegeId = `${year}${branchAbbr}${randomSuffix}`;

    const subjectEntry = await prisma.subject.findFirst({
      where: { branch, semester },
    });
    const program = subjectEntry?.program || 'B.Tech';

    const studentProfile = await prisma.studentProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        collegeId,
        program,
        branch,
        semester,
        yearOfStudy: Math.min(4, Math.max(1, Math.ceil(semester / 2))),
      },
      update: {
        program,
        branch,
        semester,
        yearOfStudy: Math.min(4, Math.max(1, Math.ceil(semester / 2))),
      },
    });

    await prisma.enrollment.upsert({
      where: { studentEmail: user.email },
      create: {
        studentEmail: user.email,
        program,
        branch,
        semester,
      },
      update: {
        program,
        branch,
        semester,
      },
    });

    // Sign user in: Generate JWT session token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    const expiresAt = dayjs().add(7, 'day').toDate();
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    const { passwordHash, ...safeUser } = user;
    return {
      token,
      user: {
        ...safeUser,
        studentProfile,
      },
    };
  }

  /**
   * Invalidates active session on logout.
   */
  static async logout(token: string) {
    if (!token) return;
    try {
      await prisma.session.deleteMany({
        where: { token },
      });
    } catch (e) {
      // Ignore if session already deleted
    }
  }

  /**
   * Retrieves authenticated user details.
   */
  static async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: true,
        mentorProfile: true,
      },
    });

    if (!user) {
      throw { status: 404, message: 'User not found.' };
    }

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
