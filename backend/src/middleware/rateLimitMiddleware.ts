import type { FastifyRequest, FastifyReply } from 'fastify';
import { checkRateLimit } from '../services/redisRateLimiter.service.js';

function getActionFromRoute(method: string, url: string): string {
  if (url.includes('/auth/register')) return 'auth:register';
  if (url.includes('/auth/login')) return 'auth:login';
  if (url.includes('/auth/forgot-password')) return 'auth:forgot-password';
  if (method === 'POST' && url.includes('/rooms') && !url.includes('/verify')) return 'rooms:create';
  if (method === 'GET' && url.includes('/rooms')) return 'rooms:list';
  return 'default';
}

function getIdentifier(request: FastifyRequest): string {
  if (request.user?.userId) {
    return `user:${request.user.userId}`;
  }
  const forwarded = request.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : request.ip;
  return `ip:${ip}`;
}

export async function rateLimitMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const action = getActionFromRoute(request.method, request.url);
  const identifier = getIdentifier(request);

  const result = await checkRateLimit(identifier, action);

  reply.header('X-RateLimit-Remaining', result.remaining.toString());
  reply.header('X-RateLimit-Reset', result.resetIn.toString());

  if (!result.allowed) {
    reply.status(429).send({
      error: 'Too many requests. Please try again later.',
      retryAfter: result.resetIn,
    });
  }
}
