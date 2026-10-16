import { Router } from 'express';
import { z } from 'zod';
import { AuthController } from '../controllers/auth.controller';
import { validateBody } from '../middlewares/validate';
import { requireAuth } from '../middlewares/auth.middleware';
import {
  loginRateLimiter,
  otpVerifyRateLimiter,
  resendOtpRateLimiter,
  registerIpRateLimiter,
  registerEmailRateLimiter,
} from '../middlewares/rateLimiter';

const router = Router();

const loginSchema = z.object({
  email: z.string().email('Please enter a valid college email address.'),
  password: z.string().min(1, 'Password is required.'),
  selectedRole: z.enum(['STUDENT', 'FACULTY', 'ADMINISTRATOR', 'CLUB_CORE'], {
    errorMap: () => ({ message: 'Please select a valid role.' }),
  }),
});

const verifyOtpSchema = z.object({
  challengeId: z.string().uuid('Invalid challenge ID.'),
  otp: z.string().length(6, 'Verification code must be 6 digits.').regex(/^\d{6}$/, 'Code must contain numbers only.'),
});

const resendOtpSchema = z.object({
  challengeId: z.string().uuid('Invalid challenge ID.'),
});

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid college email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  branch: z.string().min(1, 'Branch selection is required.'),
  semester: z.number().int().min(1).max(8, 'Semester must be between 1 and 8.'),
});

const verifyRegistrationSchema = z.object({
  challengeId: z.string().uuid('Invalid challenge ID.'),
  otp: z.string().length(6, 'Verification code must be 6 digits.').regex(/^\d{6}$/, 'Code must contain numbers only.'),
});

// Auth Routes
router.post('/login', loginRateLimiter, validateBody(loginSchema), AuthController.login);
router.post('/verify-otp', otpVerifyRateLimiter, validateBody(verifyOtpSchema), AuthController.verifyOtp);
router.post('/resend-otp', resendOtpRateLimiter, validateBody(resendOtpSchema), AuthController.resendOtp);
router.post('/register', registerIpRateLimiter, registerEmailRateLimiter, validateBody(registerSchema), AuthController.register);
router.post('/verify-registration', otpVerifyRateLimiter, validateBody(verifyRegistrationSchema), AuthController.verifyRegistration);
router.post('/logout', AuthController.logout);
router.get('/me', requireAuth, AuthController.me);

export default router;
