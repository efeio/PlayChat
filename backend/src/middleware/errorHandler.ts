import type { FastifyError, FastifyRequest, FastifyReply } from 'fastify';

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    request.log.error({ err: error, url: request.url, method: request.method }, 'Internal server error');
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const message = statusCode >= 500 && isProduction
    ? 'Internal Server Error'
    : error.message || 'Internal Server Error';

  reply.status(statusCode).send({ error: message });
}
