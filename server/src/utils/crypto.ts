import crypto from 'crypto';

/**
 * Generates a cryptographically secure 6-digit numerical OTP.
 */
export function generateSecureOtp(): string {
  // Uses crypto.randomInt for uniform distribution without bias
  const otpNumber = crypto.randomInt(100000, 1000000);
  return otpNumber.toString();
}

/**
 * Hashes an OTP using SHA-256 with an optional application salt.
 * We never store the plain OTP in the database.
 */
export function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp.trim()).digest('hex');
}

/**
 * Constant-time comparison between two hashes to prevent timing attacks.
 */
export function verifyOtpHash(plainOtp: string, expectedHash: string): boolean {
  const computedHash = hashOtp(plainOtp);
  if (computedHash.length !== expectedHash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(expectedHash));
}
