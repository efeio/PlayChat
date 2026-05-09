import type { FastifyRequest, FastifyReply } from 'fastify';
import type { Choice, GameBody, GameResult } from '../types/game.types.js';

export const playRound = async (
  request: FastifyRequest<{ Body: GameBody }>,
  reply: FastifyReply
): Promise<GameResult> => {
  const choices: Choice[] = ['tas', 'kagit', 'makas'];
  const { playerChoice } = request.body;
  const cpuChoice = choices[Math.floor(Math.random() * 3)]!;

  let result = '';
  if (playerChoice === cpuChoice) result = 'Berabere!';
  else if (
    (playerChoice === 'tas' && cpuChoice === 'makas') ||
    (playerChoice === 'kagit' && cpuChoice === 'tas') ||
    (playerChoice === 'makas' && cpuChoice === 'kagit')
  ) {
    result = 'Kazandın!';
  } else {
    result = 'Kaybettin!';
  }

  return { playerChoice, cpuChoice, result };
};
