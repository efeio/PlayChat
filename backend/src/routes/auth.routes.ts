import type { FastifyInstance } from 'fastify';
import {
  register,
  login,
  googleOAuthStart,
  googleOAuthCallback,
  verifyEmailHandler,
  resendVerificationHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
} from '../controllers/auth.controller.js';

export async function authRoutes(app: FastifyInstance) {
  app.post('/api/auth/register', register as any);
  app.post('/api/auth/login', login as any);
  app.get('/api/auth/google', googleOAuthStart);
  app.get('/api/auth/google/callback', googleOAuthCallback as any);
  app.post('/api/auth/verify-email', verifyEmailHandler as any);
  app.post('/api/auth/resend-verification', resendVerificationHandler as any);
  app.post('/api/auth/forgot-password', forgotPasswordHandler as any);
  app.post('/api/auth/reset-password', resetPasswordHandler as any);
}
