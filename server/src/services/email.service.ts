import { Resend } from 'resend';
import { config } from '../config/env';

const resend = config.emailApiKey ? new Resend(config.emailApiKey) : null;

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
  // If an email API key is configured, send via Resend
  if (config.emailApiKey && resend) {
    try {
      const { error } = await resend.emails.send({
        from: config.emailFrom,
        to: toEmail,
        subject: 'Your CampusSync Verification Code',
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #e8e8e2; border-radius: 8px; background: #fbfbf9;">
            <h2 style="color: #1b4d3e; margin-top: 0;">CampusSync Verification</h2>
            <p>Hello ${recipientName},</p>
            <p>Your one-time 6-digit verification code to sign in as <strong>${role}</strong> is:</p>
            <div style="background: #edf5f1; border: 1px solid #b2d8c3; border-radius: 6px; padding: 16px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #1b4d3e; margin: 20px 0;">
              ${otp}
            </div>
            <p style="color: #586560; font-size: 13px;">This code expires in 10 minutes and can only be used once. If you did not request this code, please ignore this email.</p>
          </div>
        `,
      });

      if (error) {
        // Log provider error without secrets
        console.error('[EmailService] Resend delivery error:', error.message || error.name);
        throw new Error('Could not send the code, try again.');
      }

      return { success: true, method: 'resend' };
    } catch (err: any) {
      if (err.message === 'Could not send the code, try again.') {
        throw err;
      }
      console.error('[EmailService] Provider error:', err?.message || 'Send failed');
      throw new Error('Could not send the code, try again.');
    }
  }

  // Development Fallback: Only log OTP if DEV_SHOW_OTP is true AND email is @campus.edu
  if (!config.isProduction) {
    if (config.devShowOtp && toEmail.toLowerCase().endsWith('@campus.edu')) {
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

  throw new Error('Could not send the code, try again.');
}

export async function sendAccountNoticeEmail(toEmail: string, recipientName: string): Promise<void> {
  if (config.emailApiKey && resend) {
    try {
      await resend.emails.send({
        from: config.emailFrom,
        to: toEmail,
        subject: 'CampusSync Account Registration Notice',
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #e8e8e2; border-radius: 8px; background: #fbfbf9;">
            <h2 style="color: #1b4d3e; margin-top: 0;">CampusSync Security Notice</h2>
            <p>Hello ${recipientName},</p>
            <p>Someone recently attempted to register a new CampusSync student account using your email address (<strong>${toEmail}</strong>).</p>
            <p>If you already have an account, you can sign in directly. If this was not you, no action is required.</p>
          </div>
        `,
      });
    } catch (err: any) {
      console.error('[EmailService] Provider error on account notice:', err?.message || 'Send notice failed');
    }
  }
}
