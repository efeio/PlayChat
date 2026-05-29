import { GameEngine, type GameState, type Move } from './GameEngine.js';

const TURKISH_WORDS = [
  'ARABA', 'BAHÇE', 'ÇANTA', 'DENİZ', 'ELMAS', 'FIRTINA', 'GÜNEŞ',
  'HASTANE', 'İSTANBUL', 'JANDARMA', 'KELEBEK', 'LİMAN', 'MEKTUP',
  'NEHIR', 'OKUL', 'PENCERE', 'RÜZGAR', 'SAHNE', 'TREN', 'UÇAK',
  'VAPUR', 'YILDIZ', 'ZİRVE', 'KÖPRÜ', 'ŞEKER', 'BÖCEK', 'DÜNYA',
  'ORMAN', 'KÜTÜPHANE', 'MÜZE', 'ÇIÇEK', 'GÖKKUŞAĞI', 'BULUT',
  'AYÇIÇEĞI', 'KAPLAN', 'YUNUS', 'BAŞAK', 'MEŞALE', 'ŞELALE',
  'KARTAL', 'ASLAN', 'KUMSAL', 'FENER', 'ÇINAR', 'PAPATYA',
  'KAYIK', 'DÜRBüN', 'YELKEN', 'PUSULA', 'HAZİNE', 'KALE',
  'SARAY', 'KÖŞK', 'MİNARE', 'KUBBE', 'KERVAN', 'ÇÖL',
  'VAHA', 'KASIRGA', 'DEPREM', 'YANARDAĞ', 'BUZUL', 'OKYANUS',
  'ADA', 'KÖRFEZ', 'YARIMADA', 'BOĞAZ', 'GEÇİT', 'TUNEL',
  'METEORİT', 'GEZEGEN', 'YILDIZ', 'UZAY', 'GALAKSI', 'NEBULA',
  'TELESKOP', 'RADAR', 'UYDU', 'FÜZE', 'ROBOT', 'BİLGİSAYAR',
  'PROGRAM', 'KLAVYE', 'EKRAN', 'HOPARLÖR', 'MİKROFON', 'KAMERA',
  'FOTOĞRAF', 'RESİM', 'HEYKEL', 'MÜZİK', 'ORKESTRA', 'KONSER',
  'SAHNE', 'PİYANO', 'KEMAN', 'FLÜT', 'DAVUL', 'GİTAR',
  'ROMAN', 'ŞİİR', 'MASAL', 'DESTAN', 'EFSANE', 'MİTOLOJİ',
  'TARİH', 'COĞRAFYA', 'FİZİK', 'KİMYA', 'BİYOLOJİ', 'MATEMATİK',
];

const TURKISH_ALPHABET = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ';

const MAX_WRONG = 6;

function turkishUpper(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/i/g, 'İ')
    .replace(/ı/g, 'I')
    .toUpperCase();
}

function turkishCompare(a: string, b: string): boolean {
  return turkishUpper(a) === turkishUpper(b);
}

interface HangmanState extends GameState {
  word: string;
  players: string[];
  currentTurnIndex: number;
  winner: string | null;
  draw: boolean;
  playerStates: {
    [userId: string]: {
      guessedLetters: string[];
      wrongCount: number;
    };
  };
}

interface HangmanMove extends Move {
  letter?: string;
  word?: string;
}

export class Hangman extends GameEngine {
  initialize(players: string[]): HangmanState {
    if (players.length !== 2) {
      throw new Error('Adam Asmaca tam olarak 2 oyuncu gerektirir');
    }

    const word = TURKISH_WORDS[Math.floor(Math.random() * TURKISH_WORDS.length)];

    return {
      word: turkishUpper(word),
      players: [...players],
      currentTurnIndex: 0,
      winner: null,
      draw: false,
      playerStates: {
        [players[0]]: { guessedLetters: [], wrongCount: 0 },
        [players[1]]: { guessedLetters: [], wrongCount: 0 },
      },
    };
  }

  validateMove(state: GameState, move: Move, userId: string): boolean {
    const s = state as HangmanState;
    const m = move as HangmanMove;

    if (s.winner || s.draw) return false;

    const playerState = s.playerStates[userId];
    if (!playerState) return false;
    if (playerState.wrongCount >= MAX_WRONG) return false;

    if (m.word !== undefined) {
      return typeof m.word === 'string' && m.word.trim().length > 0;
    }

    if (m.letter !== undefined) {
      const letter = turkishUpper(m.letter);
      if (letter.length !== 1) return false;
      if (!TURKISH_ALPHABET.includes(letter)) return false;
      if (playerState.guessedLetters.includes(letter)) return false;
      return true;
    }

    return false;
  }

  applyMove(state: GameState, move: Move, userId: string): HangmanState {
    const s = state as HangmanState;
    const m = move as HangmanMove;
    const playerState = s.playerStates[userId];

    if (m.word) {
      const guessWord = turkishUpper(m.word.trim());
      if (turkishCompare(guessWord, s.word)) {
        return { ...s, winner: userId };
      }

      const newWrongCount = playerState.wrongCount + 1;
      const newPlayerStates = {
        ...s.playerStates,
        [userId]: { ...playerState, wrongCount: newWrongCount },
      };

      const allEliminated = Object.values(newPlayerStates).every(
        (ps) => ps.wrongCount >= MAX_WRONG
      );

      return {
        ...s,
        playerStates: newPlayerStates,
        draw: allEliminated,
        currentTurnIndex: (s.currentTurnIndex + 1) % s.players.length,
      };
    }

    const letter = turkishUpper(m.letter as string);
    const newGuessed = [...playerState.guessedLetters, letter];
    let newWrongCount = playerState.wrongCount;

    if (!s.word.includes(letter)) {
      newWrongCount++;
    }

    const newPlayerStates = {
      ...s.playerStates,
      [userId]: { guessedLetters: newGuessed, wrongCount: newWrongCount },
    };

    let winner: string | null = null;
    if (s.word.split('').every((c) => newGuessed.includes(c))) {
      winner = userId;
    }

    const allEliminated =
      !winner &&
      Object.values(newPlayerStates).every((ps) => ps.wrongCount >= MAX_WRONG);

    return {
      ...s,
      playerStates: newPlayerStates,
      winner,
      draw: allEliminated,
      currentTurnIndex: (s.currentTurnIndex + 1) % s.players.length,
    };
  }

  checkResult(state: GameState): 'ongoing' | 'win' | 'draw' {
    const s = state as HangmanState;
    if (s.winner) return 'win';
    if (s.draw) return 'draw';
    return 'ongoing';
  }

  getWinner(state: GameState): string | null {
    return (state as HangmanState).winner;
  }

  getGameLog(move: Move, userId: string, state: GameState): string {
    const s = state as HangmanState;
    const m = move as HangmanMove;

    if (m.word) {
      const guessWord = turkishUpper(m.word.trim());
      if (turkishCompare(guessWord, s.word)) {
        return 'kelimeyi doğru tahmin etti!';
      }
      return `"${guessWord}" tahmin etti — yanlış`;
    }

    const letter = turkishUpper(m.letter as string);
    if (s.word.includes(letter)) {
      return `"${letter}" harfini tahmin etti — doğru!`;
    }
    return `"${letter}" harfini tahmin etti — yanlış!`;
  }
}
