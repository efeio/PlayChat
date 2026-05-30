import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? [{ emit: 'event', level: 'query' }, 'warn', 'error']
    : ['warn', 'error'],
});

prisma.$on('query' as never, (e: { duration: number; query: string }) => {
  if (e.duration > 200) {
    console.warn(`[Prisma Slow Query] ${e.duration}ms: ${e.query.slice(0, 200)}`);
  }
});

export default prisma;
