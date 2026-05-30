import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import env from '../config/env.js';

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

function isMailConfigured(): boolean {
  return !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  if (!isMailConfigured()) {
    console.log(`[Mail] Verification email (dev mode) to=${to} token=${token}`);
    return;
  }

  const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${token}`;

  await getTransporter().sendMail({
    from: env.SMTP_FROM,
    to,
    subject: 'PlayChat — Verify your email',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #fff; margin-bottom: 16px;">Welcome to PlayChat</h2>
        <p style="color: #a0a0a0; line-height: 1.6;">
          Please verify your email address by clicking the button below.
        </p>
        <a href="${verifyUrl}" style="display: inline-block; margin-top: 24px; padding: 12px 32px; background: #fff; color: #0a0a0a; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Verify Email
        </a>
        <p style="color: #666; font-size: 12px; margin-top: 32px;">
          If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  if (!isMailConfigured()) {
    console.log(`[Mail] Password reset email (dev mode) to=${to} token=${token}`);
    return;
  }

  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;

  await getTransporter().sendMail({
    from: env.SMTP_FROM,
    to,
    subject: 'PlayChat — Reset your password',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #fff; margin-bottom: 16px;">Password Reset</h2>
        <p style="color: #a0a0a0; line-height: 1.6;">
          You requested a password reset. Click the button below to set a new password.
          This link expires in 1 hour.
        </p>
        <a href="${resetUrl}" style="display: inline-block; margin-top: 24px; padding: 12px 32px; background: #fff; color: #0a0a0a; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Reset Password
        </a>
        <p style="color: #666; font-size: 12px; margin-top: 32px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
