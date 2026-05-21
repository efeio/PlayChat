import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/prisma.js';
import env from '../config/env.js';
import { GameType } from '@prisma/client';
import { sendVerificationEmail, sendPasswordResetEmail } from './mail.service.js';

const SALT_ROUNDS = 10;
const VERIFY_TOKEN_EXPIRY_HOURS = 24;
const RESET_TOKEN_EXPIRY_HOURS = 1;

export interface RegisterInput {
  username: string;
  displayName: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  token: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    email: string;
    avatarUrl: string | null;
    isVerified: boolean;
  };
}

export interface GoogleProfile {
  googleId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
}

function generateToken(userId: string, username: string): string {
  return jwt.sign({ userId, username }, env.JWT_SECRET, { expiresIn: '7d' });
}

function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: input.email }, { username: input.username }],
    },
  });

  if (existingUser) {
    throw new Error(
      existingUser.email === input.email
        ? 'Email already in use'
        : 'Username already taken'
    );
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const emailVerifyToken = generateSecureToken();
  const emailVerifyExpires = new Date(Date.now() + VERIFY_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  const user = await prisma.user.create({
    data: {
      username: input.username,
      displayName: input.displayName,
      email: input.email,
      passwordHash,
      emailVerifyToken,
      emailVerifyExpires,
      isVerified: false,
      stats: {
        create: { gameType: GameType.GENERAL },
      },
    },
  });

  await sendVerificationEmail(user.email, emailVerifyToken);

  const token = generateToken(user.id, user.username);

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
    },
  };
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user || !user.passwordHash) {
    throw new Error('Invalid email or password');
  }

  const validPassword = await bcrypt.compare(input.password, user.passwordHash);

  if (!validPassword) {
    throw new Error('Invalid email or password');
  }

  const token = generateToken(user.id, user.username);

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
    },
  };
}

export async function googleOAuthLogin(profile: GoogleProfile): Promise<AuthResult> {
  let user = await prisma.user.findUnique({
    where: { googleId: profile.googleId },
  });

  if (!user) {
    user = await prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: profile.googleId,
          avatarUrl: profile.avatarUrl || user.avatarUrl,
          isVerified: true,
        },
      });
    } else {
      const baseUsername = profile.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
      let username = baseUsername;
      let suffix = 1;

      while (await prisma.user.findUnique({ where: { username } })) {
        username = `${baseUsername}${suffix}`;
        suffix++;
      }

      user = await prisma.user.create({
        data: {
          googleId: profile.googleId,
          email: profile.email,
          username,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          isVerified: true,
          stats: {
            create: { gameType: GameType.GENERAL },
          },
        },
      });
    }
  }

  const token = generateToken(user.id, user.username);

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
    },
  };
}

export async function verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
  const user = await prisma.user.findFirst({
    where: {
      emailVerifyToken: token,
      emailVerifyExpires: { gt: new Date() },
    },
  });

  if (!user) {
    throw new Error('Invalid or expired verification token');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      emailVerifyToken: null,
      emailVerifyExpires: null,
    },
  });

  return { success: true, message: 'Email verified successfully' };
}

export async function resendVerificationEmail(email: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.isVerified) {
    throw new Error('Email is already verified');
  }

  const emailVerifyToken = generateSecureToken();
  const emailVerifyExpires = new Date(Date.now() + VERIFY_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifyToken, emailVerifyExpires },
  });

  await sendVerificationEmail(user.email, emailVerifyToken);
}

export async function forgotPassword(email: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Always respond success to prevent email enumeration
  if (!user || !user.passwordHash) {
    return;
  }

  const passwordResetToken = generateSecureToken();
  const passwordResetExpires = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken, passwordResetExpires },
  });

  await sendPasswordResetEmail(user.email, passwordResetToken);
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  if (newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpires: { gt: new Date() },
    },
  });

  if (!user) {
    throw new Error('Invalid or expired reset token');
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });
}
