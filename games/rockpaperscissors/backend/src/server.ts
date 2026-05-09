import Fastify from 'fastify';
import cors from '@fastify/cors';
import gameRoutes from './routes/game.routes.js';

const fastify = Fastify({ logger: true });

fastify.register(cors, {
  origin: '*'
});

fastify.register(gameRoutes);

const start = async () => {
  try {
    await fastify.listen({ port: 3001 });
    console.log('Backend http://localhost:3001 adresinde çalışıyor');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
