import type { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import env from '../../infrastructure/config/env.js';

export interface JwtPayload {
  userId: string;
  username: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.status(401).send({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    reply.status(401).send({ error: 'Invalid token format' });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    request.user = decoded;
  } catch {
    reply.status(401).send({ error: 'Invalid or expired token' });
    return;
  }
}
