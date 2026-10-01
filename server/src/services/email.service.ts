import { config } from '../config/env';

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
  // If an email API key is configured, attempt sending via email provider
  if (config.emailApiKey) {
    try {
      // Generic HTTPS call to Resend / SendGrid / Custom provider API
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.emailApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
        }),
      });

      if (response.ok) {
        return { success: true, method: 'email_provider' };
      }
      console.warn('[EmailService] Provider responded with error:', await response.text());
    } catch (err: any) {
      console.warn('[EmailService] Failed to send via email provider:', err.message);
    }
  }

  // Development Fallback: If no provider key is configured and not in production
  if (!config.isProduction) {
    console.log('\n======================================================');
    console.log('              [CAMPUSSYNC DEV OTP LOG]                ');
    console.log('------------------------------------------------------');
    console.log(` Recipient: ${toEmail} (${recipientName})`);
    console.log(` Target Role: ${role}`);
    console.log(` Verification Code (OTP):  >>>  ${otp}  <<<`);
    console.log(` Valid For: 10 minutes`);
    console.log('======================================================\n');
    return { success: true, method: 'console_dev_fallback' };
  }

  throw new Error('Email service is not configured in production environment.');
}
