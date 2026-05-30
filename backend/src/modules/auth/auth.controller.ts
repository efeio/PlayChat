import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  registerUser,
  loginUser,
  googleOAuthLogin,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
} from './auth.service.js';
import env from '../../infrastructure/config/env.js';

interface RegisterBody {
  username: string;
  displayName: string;
  email: string;
  password: string;
}

interface LoginBody {
  email: string;
  password: string;
}

interface VerifyEmailBody {
  token: string;
}

interface ForgotPasswordBody {
  email: string;
}

interface ResetPasswordBody {
  token: string;
  password: string;
}

export async function register(
  request: FastifyRequest<{ Body: RegisterBody }>,
  reply: FastifyReply
) {
  const { username, displayName, email, password } = request.body;

  if (!username || !displayName || !email || !password) {
    return reply.status(400).send({ error: 'All fields are required' });
  }

  if (password.length < 6) {
    return reply.status(400).send({ error: 'Password must be at least 6 characters' });
  }

  if (password.length > 128) {
    return reply.status(400).send({ error: 'Password must be at most 128 characters' });
  }

  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return reply.status(400).send({ error: 'Username must be 3-20 characters (letters, numbers, underscore)' });
  }

  if (displayName.trim().length < 2 || displayName.trim().length > 30) {
    return reply.status(400).send({ error: 'Display name must be 2-30 characters' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return reply.status(400).send({ error: 'Invalid email format' });
  }

  try {
    const result = await registerUser({ username, displayName, email, password });
    return reply.status(201).send(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    return reply.status(400).send({ error: message });
  }
}

export async function login(
  request: FastifyRequest<{ Body: LoginBody }>,
  reply: FastifyReply
) {
  const { email, password } = request.body;

  if (!email || !password) {
    return reply.status(400).send({ error: 'Email and password are required' });
  }

  try {
    const result = await loginUser({ email, password });
    return reply.status(200).send(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Login failed';
    return reply.status(401).send({ error: message });
  }
}

export async function googleOAuthStart(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  if (!env.GOOGLE_CLIENT_ID) {
    return reply.status(503).send({ error: 'Google OAuth is not configured' });
  }

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_CALLBACK_URL,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
  });

  return reply.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

export async function googleOAuthCallback(
  request: FastifyRequest<{ Querystring: { code?: string; error?: string } }>,
  reply: FastifyReply
) {
  const { code, error } = request.query as { code?: string; error?: string };

  if (error || !code) {
    return reply.redirect(`${env.CLIENT_URL}/login?error=oauth_failed`);
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      return reply.redirect(`${env.CLIENT_URL}/login?error=oauth_token_failed`);
    }

    const tokens = await tokenResponse.json() as { access_token: string; id_token?: string };

    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoResponse.ok) {
      return reply.redirect(`${env.CLIENT_URL}/login?error=oauth_profile_failed`);
    }

    const profile = await userInfoResponse.json() as {
      id: string;
      email: string;
      name: string;
      picture?: string;
    };

    const result = await googleOAuthLogin({
      googleId: profile.id,
      email: profile.email,
      displayName: profile.name,
      avatarUrl: profile.picture,
    });

    return reply.redirect(`${env.CLIENT_URL}/oauth/callback#token=${encodeURIComponent(result.token)}`);
  } catch {
    return reply.redirect(`${env.CLIENT_URL}/login?error=oauth_failed`);
  }
}

export async function verifyEmailHandler(
  request: FastifyRequest<{ Body: VerifyEmailBody }>,
  reply: FastifyReply
) {
  const { token } = request.body;

  if (!token) {
    return reply.status(400).send({ error: 'Verification token is required' });
  }

  try {
    const result = await verifyEmail(token);
    return reply.send(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Verification failed';
    return reply.status(400).send({ error: message });
  }
}

export async function resendVerificationHandler(
  request: FastifyRequest<{ Body: { email: string } }>,
  reply: FastifyReply
) {
  const { email } = request.body;

  if (!email) {
    return reply.status(400).send({ error: 'Email is required' });
  }

  try {
    await resendVerificationEmail(email);
    return reply.send({ success: true, message: 'Verification email sent' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send verification email';
    return reply.status(400).send({ error: message });
  }
}

export async function forgotPasswordHandler(
  request: FastifyRequest<{ Body: ForgotPasswordBody }>,
  reply: FastifyReply
) {
  const { email } = request.body;

  if (!email) {
    return reply.status(400).send({ error: 'Email is required' });
  }

  try {
    await forgotPassword(email);
    return reply.send({ success: true, message: 'If the email exists, a reset link has been sent' });
  } catch {
    return reply.send({ success: true, message: 'If the email exists, a reset link has been sent' });
  }
}

export async function resetPasswordHandler(
  request: FastifyRequest<{ Body: ResetPasswordBody }>,
  reply: FastifyReply
) {
  const { token, password } = request.body;

  if (!token || !password) {
    return reply.status(400).send({ error: 'Token and password are required' });
  }

  if (password.length < 6) {
    return reply.status(400).send({ error: 'Password must be at least 6 characters' });
  }

  try {
    await resetPassword(token, password);
    return reply.send({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Password reset failed';
    return reply.status(400).send({ error: message });
  }
}
