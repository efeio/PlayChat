import type { FastifyInstance } from 'fastify';
import { playRound } from '../controllers/game.controller.js';

export default async function gameRoutes(fastify: FastifyInstance) {
  fastify.post('/play', playRound);
}
