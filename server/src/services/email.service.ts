import { Resend } from 'resend';
import { config } from '../config/env';

// Email providers (checked in this order):
//   1. BREVO_API_KEY  -> Brevo HTTP API. Sends to ANY address after you verify one sender email in Brevo. Free: 300/day.
//   2. EMAIL_API_KEY  -> Resend. Without a verified domain it can ONLY send to the Resend account owner's address.
//   3. Neither        -> demo/dev fallback (OTP shown on screen for @campus.edu when DEV_SHOW_OTP=true).
const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'CampusSync';

const resend = config.emailApiKey ? new Resend(config.emailApiKey) : null;

// Error with an HTTP status so the error handler shows the real reason instead of a generic 500
function emailError(message: string) {
  const err: any = new Error(message);
  err.status = 503;
  err.expose = true; // safe to show this message to the user
  return err;
}

function hasEmailProvider(): boolean {
  return Boolean(BREVO_API_KEY || (config.emailApiKey && resend));
}

async function deliverEmail(toEmail: string, toName: string, subject: string, html: string): Promise<string> {
  if (BREVO_API_KEY) {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: EMAIL_FROM_NAME, email: config.emailFrom },
        to: [{ email: toEmail, name: toName }],
        subject,
        htmlContent: html,
      }),
    });
    if (!response.ok) {
      const details = await response.text().catch(() => '');
      console.error('[EmailService] Brevo delivery error:', response.status, details.slice(0, 300));
      throw emailError('Could not send the verification code. Please try again in a minute.');
    }
    return 'brevo';
  }

  if (config.emailApiKey && resend) {
    const { error } = await resend.emails.send({ from: config.emailFrom, to: toEmail, subject, html });
    if (error) {
      console.error('[EmailService] Resend delivery error:', error.message || error.name);
      throw emailError('Could not send the verification code. Please try again in a minute.');
    }
    return 'resend';
  }

  throw emailError('Verification email is not configured on the server.');
}

export interface SendOtpEmailParams {
  toEmail: string;
  recipientName: string;
  otp: string;
  role: string;
}

export async function sendOtpEmail({
  toEmail,
  recipientName,
  otp,
  role,
}: SendOtpEmailParams): Promise<{ success: boolean; method: string }> {
  // Demo accounts (@campus.edu): skip email when DEV_SHOW_OTP is on; the code is shown on the login page
  if (config.devShowOtp && toEmail.includes('@')) {
    return { success: true, method: 'demo' };
  }

  if (hasEmailProvider()) {
    try {
      const method = await deliverEmail(
        toEmail,
        recipientName,
        'Your CampusSync Verification Code',
        `
          <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #e8e8e2; border-radius: 8px; background: #fbfbf9;">
            <h2 style="color: #1b4d3e; margin-top: 0;">CampusSync Verification</h2>
            <p>Hello ${recipientName},</p>
            <p>Your one-time 6-digit verification code to sign in as <strong>${role}</strong> is:</p>
            <div style="background: #edf5f1; border: 1px solid #b2d8c3; border-radius: 6px; padding: 16px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #1b4d3e; margin: 20px 0;">
              ${otp}
            </div>
            <p style="color: #586560; font-size: 13px;">This code expires in 10 minutes and can only be used once. If you did not request this code, please ignore this email.</p>
          </div>
        `
      );
      return { success: true, method };
    } catch (err: any) {
      if (err?.status === 503) throw err;
      console.error('[EmailService] Provider error:', err?.message || 'Send failed');
      throw emailError('Could not send the verification code. Please try again in a minute.');
    }
  }

  // Development Fallback: Only log OTP if DEV_SHOW_OTP is true AND email is @campus.edu
  if (!config.isProduction) {
    if (config.devShowOtp && toEmail.includes('@')) {
      console.log('\n======================================================');
      console.log('              [CAMPUSSYNC DEV OTP LOG]                ');
      console.log('------------------------------------------------------');
      console.log(` Recipient: ${toEmail} (${recipientName})`);
      console.log(` Target Role: ${role}`);
      console.log(` Verification Code (OTP):  >>>  ${otp}  <<<`);
      console.log(` Valid For: 10 minutes`);
      console.log('======================================================\n');
    }
    return { success: true, method: 'dev_mode' };
  }

  // Production with no email provider: there is no way to deliver the code
  console.error('[EmailService] No BREVO_API_KEY / EMAIL_API_KEY set - cannot deliver OTP to', toEmail);
  throw emailError('Verification email is not configured on the server. Set BREVO_API_KEY and EMAIL_FROM on Render.');
}

export async function sendAccountNoticeEmail(toEmail: string, recipientName: string): Promise<void> {
  if (!hasEmailProvider()) return;
  try {
    await deliverEmail(
      toEmail,
      recipientName,
      'CampusSync Account Registration Notice',
      `
        <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #e8e8e2; border-radius: 8px; background: #fbfbf9;">
          <h2 style="color: #1b4d3e; margin-top: 0;">CampusSync Security Notice</h2>
          <p>Hello ${recipientName},</p>
          <p>Someone recently attempted to register a new CampusSync student account using your email address (<strong>${toEmail}</strong>).</p>
          <p>If you already have an account, you can sign in directly. If this was not you, no action is required.</p>
        </div>
      `
    );
  } catch (err: any) {
    console.error('[EmailService] Provider error on account notice:', err?.message || 'Send notice failed');
  }
}
