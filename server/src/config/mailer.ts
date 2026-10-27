import nodemailer from 'nodemailer';
import { config } from './env';

let transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  if (config.smtpUser && config.smtpPass) {
    const isGmail = config.smtpHost.includes('gmail') || config.smtpUser.includes('@gmail.com');
    if (isGmail) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.smtpUser,
          pass: config.smtpPass,
        },
      });
      console.log(`[Mailer] Initialized Gmail SMTP transport for: ${config.smtpUser}`);
    } else {
      transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpPort === 465,
        auth: {
          user: config.smtpUser,
          pass: config.smtpPass,
        },
      });
      console.log(`[Mailer] Initialized custom SMTP transport at ${config.smtpHost}:${config.smtpPort}`);
    }
  } else {
    try {
      // Create a real testing account on ethereal.email to deliver verifiable inbox messages
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`[Mailer] Provisioned real Ethereal web inbox credentials: ${testAccount.user}`);
    } catch {
      // Fallback to stream buffer
      transporter = nodemailer.createTransport({
        streamTransport: true,
        buffer: true,
      } as any);
    }
  }

  return transporter;
}

export interface EmailDispatchResult {
  verifyUrl: string;
  previewUrl?: string | false;
}

export async function sendVerificationEmail(
  email: string,
  token: string,
  name: string
): Promise<EmailDispatchResult> {
  const verifyUrl = `${config.clientUrl}/verify-email?token=${token}`;

  let previewUrl: string | false = false;

  try {
    const transport = await getTransporter();
    const info = await transport.sendMail({
      from: config.emailFrom,
      to: email,
      subject: 'Verify your SecureDoc Advanced Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #4f46e5; margin: 0; font-size: 24px;">SecureDoc Advanced</h1>
            <p style="color: #64748b; font-size: 13px; margin: 4px 0 0;">Zero-Plaintext Encrypted Document Custody</p>
          </div>
          
          <h2 style="color: #0f172a; font-size: 18px;">Verify Your Account Email</h2>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">Hello ${name},</p>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">
            Thank you for registering with <strong>SecureDoc Advanced</strong>. Please click the button below to verify your email address. Once verified, you will be able to upload, encrypt, share, and collaborate on documents.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 24px;">
            <p style="color: #64748b; font-size: 12px; margin: 0 0 6px;">Single-use verification token: <code style="color: #4f46e5;">${token}</code></p>
            <p style="color: #64748b; font-size: 12px; margin: 0;">This cryptographic link expires in 24 hours. It can only be used once.</p>
          </div>
          
          <p style="color: #94a3b8; font-size: 11px; margin-top: 24px; word-break: break-all;">
            If the button doesn't work, copy and paste this link into your browser: <br/>
            <a href="${verifyUrl}" style="color: #6366f1;">${verifyUrl}</a>
          </p>
        </div>
      `,
    });

    previewUrl = nodemailer.getTestMessageUrl(info);

    console.log(`\n======================================================`);
    console.log(`✉️  [SECURE EMAIL DELIVERY] Verification Dispatched`);
    console.log(`To: ${name} <${email}>`);
    console.log(`Verification URL: ${verifyUrl}`);
    if (previewUrl) {
      console.log(`📬 Live Web Inbox Preview: ${previewUrl}`);
    }
    console.log(`======================================================\n`);
  } catch (err: any) {
    console.error(`[Mailer] Error dispatching email: ${err.message}`);
  }

  return { verifyUrl, previewUrl: previewUrl || undefined };
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  name: string
): Promise<EmailDispatchResult> {
  const resetUrl = `${config.clientUrl}/reset-password?token=${token}`;
  let previewUrl: string | false = false;

  try {
    const transport = await getTransporter();
    const info = await transport.sendMail({
      from: config.emailFrom,
      to: email,
      subject: 'Reset your SecureDoc Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #0f172a;">Password Reset Request</h2>
          <p style="color: #334155; font-size: 14px;">Hello ${name},</p>
          <p style="color: #334155; font-size: 14px;">We received a request to reset your password. Click the button below to set a new password.</p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetUrl}" style="background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #64748b; font-size: 12px;">This single-use link expires in 15 minutes.</p>
        </div>
      `,
    });

    previewUrl = nodemailer.getTestMessageUrl(info);
  } catch (err: any) {
    console.error(`[Mailer] Error dispatching password reset email: ${err.message}`);
  }

  return { verifyUrl: resetUrl, previewUrl: previewUrl || undefined };
}

export async function sendTwoFactorCodeEmail(
  email: string,
  otpCode: string,
  name: string
): Promise<{ success: boolean; previewUrl?: string }> {
  let previewUrl: string | false = false;

  try {
    const transport = await getTransporter();
    const info = await transport.sendMail({
      from: config.emailFrom,
      to: email,
      subject: `[${otpCode}] Your SecureDoc 2-Step Verification Code`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #4f46e5; margin: 0; font-size: 22px;">SecureDoc Advanced</h1>
            <p style="color: #64748b; font-size: 13px; margin: 4px 0 0;">Multi-Platform Cryptographic Vault</p>
          </div>

          <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <p style="color: #475569; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; margin: 0 0 10px;">
              2-Step Verification Code
            </p>
            <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #4f46e5; font-family: monospace;">
              ${otpCode}
            </div>
            <p style="color: #64748b; font-size: 12px; margin: 10px 0 0;">
              Valid for 10 minutes. Do not share this code with anyone.
            </p>
          </div>

          <p style="color: #334155; font-size: 14px; line-height: 1.5;">
            Hello ${name},<br/>
            A sign-in request was initiated for your SecureDoc account. Enter the 6-digit code above on your laptop, desktop, or mobile device to complete authentication.
          </p>

          <p style="color: #94a3b8; font-size: 11px; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px;">
            If you did not initiate this sign-in attempt, someone may have entered your password. Please sign in and change your password immediately.
          </p>
        </div>
      `,
    });

    previewUrl = nodemailer.getTestMessageUrl(info);

    console.log(`\n======================================================`);
    console.log(`🔐 [2-STEP VERIFICATION OTP DISPATCHED]`);
    console.log(`To: ${name} <${email}>`);
    console.log(`OTP Code: [${otpCode}]`);
    if (previewUrl) {
      console.log(`📬 Live Web Inbox Preview: ${previewUrl}`);
    }
    console.log(`======================================================\n`);
    return { success: true, previewUrl: previewUrl || undefined };
  } catch (err: any) {
    console.error(`[Mailer] Error dispatching 2FA OTP email: ${err.message}`);
    return { success: false };
  }
}

