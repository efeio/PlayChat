export type Choice = 'tas' | 'kagit' | 'makas';

export interface GameBody {
  playerChoice: Choice;
}

export interface GameResult {
  playerChoice: Choice;
  cpuChoice: Choice;
  result: string;
}
