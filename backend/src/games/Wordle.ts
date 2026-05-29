import { GameEngine, type GameState, type Move } from './GameEngine.js';

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

function turkishUpper(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/i/g, 'İ')
    .replace(/ı/g, 'I')
    .toUpperCase();
}

function turkishLower(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLowerCase();
}

const TARGET_WORDS: string[] = [
  'ADRES', 'AHLAK', 'AKŞAM', 'ALTIN', 'ANLAM', 'ARABA', 'ASKER',
  'ASLAN', 'ATLAS', 'AYRAN', 'BAHÇE', 'BALIK', 'BARIŞ', 'BAŞKA',
  'BEYAZ', 'BİLGİ', 'BÖCEK', 'BOYUT', 'BUHAR', 'BULUT', 'BÜYÜK',
  'CADDE', 'ÇARŞI', 'ÇELİK', 'ÇEVRE', 'ÇİÇEK', 'ÇORAP', 'DALGA',
  'DARBE', 'DENİZ', 'DERİN', 'DOĞAL', 'DOLAP', 'DORUK', 'DÖNÜŞ',
  'DÜNYA', 'DUVAR', 'EKMEK', 'ELMAS', 'ENGEL', 'ERKEN', 'EVREN',
  'FENER', 'FİDAN', 'GARIP', 'GİDİŞ', 'GÖLGE', 'GÖREV', 'GÜÇLÜ',
  'GÜNAH', 'GÜNEŞ', 'GÜVEN', 'GÜZEL', 'HAFTA', 'HAKİM', 'HALAT',
  'HASTA', 'HAYAT', 'HAZIR', 'HUKUK', 'İFADE', 'İLERİ', 'İNANÇ',
  'İNSAN', 'İSTEK', 'İŞLEM', 'KABİN', 'KABUL', 'KADIN', 'KAFES',
  'KALEM', 'KANAT', 'KAPAK', 'KARGO', 'KASIM', 'KAŞIK', 'KAVGA',
  'KAYAK', 'KAYIP', 'KAZAK', 'KELAM', 'KENDİ', 'KESER', 'KOLAY',
  'KOMŞU', 'KORKU', 'KÖPRÜ', 'KÖYLÜ', 'KUMAŞ', 'KÜÇÜK', 'KÜREK',
  'LAMBA', 'LİMAN', 'MAKAS', 'MASAL', 'MELEK', 'MERAK', 'METAL',
  'MEYVE', 'MOTOR', 'MUTLU', 'MÜDÜR', 'NEFES', 'NEHİR', 'NİŞAN',
  'NOKTA', 'NOTER', 'NÜFUS', 'OKUMA', 'ORMAN', 'ORTAM', 'ÖĞLEN',
  'ÖZGÜR', 'ÖZLEM', 'PAKET', 'PAMUK', 'PANEL', 'PARÇA', 'PASTA',
  'PAZAR', 'PERDE', 'PİLOT', 'PROJE', 'RADAR', 'RADYO', 'RAHAT',
  'RAPOR', 'REÇEL', 'ROBOT', 'ROMAN', 'SABAH', 'SAÇMA', 'SAHİL',
  'SAHNE', 'SAKİN', 'SALON', 'SAMAN', 'SANAT', 'SARAY', 'SAVAŞ',
  'SEBEP', 'SEBZE', 'SEFER', 'SEVGİ', 'SİLAH', 'SINAV', 'SINIF',
  'SOFRA', 'SOKAK', 'SONRA', 'SONUÇ', 'SÜREÇ', 'ŞARAP', 'ŞEHİR',
  'ŞEKER', 'TABAK', 'TAKİM', 'TAKİP', 'TALEP', 'TAMAM', 'TARAF',
  'TARLA', 'TAVUK', 'TEKER', 'TEMEL', 'TERZİ', 'TESİS', 'TOPLU',
  'TOPUK', 'TUHAF', 'TURNE', 'TUZAK', 'TUZLU', 'UYARI', 'UYGUN',
  'UZMAN', 'ÜSTÜN', 'VAKİT', 'VAPUR', 'VATAN', 'VEKİL', 'VÜCUT',
  'YABAN', 'YAKIN', 'YALAN', 'YARIM', 'YASAL', 'YAŞAM', 'YATAK',
  'YAVAŞ', 'YAZAR', 'YERLİ', 'YETKİ', 'YOĞUN', 'YOKSA', 'YORUM',
  'YÜZDE', 'YÜZME', 'ZAMAN', 'ZAYIF', 'ZEHİR', 'ZİRVE',
];

const VALID_GUESSES: string[] = [
  ...TARGET_WORDS,
  'ACELE', 'AÇLIK', 'AFYON', 'AHŞAP', 'AKICI', 'AKREP', 'ALÇAK',
  'ALMAK', 'ARACI', 'ARIZA', 'ARTAN', 'ARTIK', 'AYLIK', 'AZAMI',
  'BAĞCI', 'BAKIŞ', 'BANYO', 'BASIN', 'BASIT', 'BATIK', 'BAYAT',
  'BEKAR', 'BİLEK', 'BİRİM', 'BÖYLE', 'BUDAK', 'BURSA', 'ÇADIR',
  'ÇAKIL', 'ÇALIŞ', 'ÇIKAR', 'ÇİZGİ', 'ÇOĞUL', 'ÇÖZÜM', 'DAĞCI',
  'DAMAR', 'DAMLA', 'DEĞER', 'DEVAM', 'DİKİŞ', 'DİZEL', 'DOLAR',
  'DÜŞÜK', 'DÜŞÜN', 'DÜZEN', 'EMSAL', 'ENGİN', 'ERKEK', 'ESNAF',
  'EŞARP', 'EŞSİZ', 'FAKAT', 'FIRIN', 'FLORA', 'GELEN', 'GENİŞ',
  'GİRİŞ', 'GİZLİ', 'GÖZDE', 'GÜMLÜ', 'HİSSE', 'HIZLI', 'İKLİM',
  'İMKAN', 'İSTİF', 'KAÇAK', 'KAÇIR', 'KAHİN', 'KALIŞ', 'KAYIT',
  'KEŞİF', 'KILIF', 'KİRAZ', 'KOYUN', 'KUŞAK', 'LİSAN', 'MADEN',
  'MANAV', 'MECAZ', 'MİRAS', 'MOBİL', 'MORAL', 'NİYET', 'OLMAZ',
  'ONLAR', 'ÖRGÜT', 'ÖLÇÜM', 'PANDA', 'PATIK', 'PIRIL', 'RAKIT',
  'SABİT', 'SAĞIR', 'SATIN', 'SEÇİM', 'SERGİ', 'SEYİR', 'SİNİR',
  'SOYUT', 'TABİP', 'TABUR', 'TUTAR', 'UÇMAK', 'VAKIF', 'YAĞLI',
  'YAPIŞ', 'YAYIN', 'YAZGI', 'YENİK', 'YOĞUR', 'ZATEN', 'ZİHİN',
  'ZİYAN', 'ŞANSI', 'AÇGÖZ', 'ADALE', 'IŞILD', 'KABAR', 'KIRIK',
  'LANET', 'MUSLUk', 'NAMAZ', 'ORUÇL', 'PIRIL', 'RIHTM', 'SABİR',
  'TOPAZ', 'UÇARI', 'ÜZGÜN', 'YANIT', 'ZEVKL',
];

const TURKISH_DICTIONARY: Set<string> = new Set(
  VALID_GUESSES.map(w => turkishUpper(w.trim()))
    .filter(w => w.length === WORD_LENGTH)
);

type LetterResult = 'correct' | 'present' | 'absent';

interface GuessResult {
  word: string;
  results: LetterResult[];
  playerId: string;
}

interface WordleState extends GameState {
  players: string[];
  targetWord: string;
  guesses: GuessResult[];
  currentPlayerIndex: number;
  winner: string | null;
  finished: boolean;
  maxGuesses: number;
}

interface WordleMove extends Move {
  word: string;
}

export class Wordle extends GameEngine {
  initialize(players: string[]): WordleState {
    const targetWord = TARGET_WORDS[Math.floor(Math.random() * TARGET_WORDS.length)];

    return {
      players: [...players],
      targetWord,
      guesses: [],
      currentPlayerIndex: 0,
      winner: null,
      finished: false,
      maxGuesses: MAX_GUESSES,
    };
  }

  validateMove(state: GameState, move: Move, userId: string): boolean {
    const s = state as WordleState;
    const m = move as WordleMove;

    if (s.finished) return false;
    if (s.players[s.currentPlayerIndex] !== userId) return false;
    if (!m.word || typeof m.word !== 'string') return false;

    const word = turkishUpper(m.word.trim());
    if (word.length !== WORD_LENGTH) return false;

    const TURKISH_CHARS = /^[ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ]+$/;
    if (!TURKISH_CHARS.test(word)) return false;

    return true;
  }

  isValidDictionaryWord(move: Move): boolean {
    const m = move as WordleMove;
    if (!m.word || typeof m.word !== 'string') return false;
    const word = turkishUpper(m.word.trim());
    if (word.length !== WORD_LENGTH) return false;
    return TURKISH_DICTIONARY.has(word);
  }

  applyMove(state: GameState, move: Move, userId: string): WordleState {
    const s = state as WordleState;
    const m = move as WordleMove;
    const word = turkishUpper(m.word.trim());

    const results = this._evaluateGuess(word, s.targetWord);

    const newGuesses: GuessResult[] = [
      ...s.guesses,
      { word: turkishLower(word), results, playerId: userId },
    ];

    const isCorrect = results.every((r) => r === 'correct');

    let winner: string | null = s.winner;
    let finished = s.finished;

    if (isCorrect) {
      winner = userId;
      finished = true;
    } else if (newGuesses.length >= s.maxGuesses) {
      finished = true;
    }

    const nextPlayerIndex = finished
      ? s.currentPlayerIndex
      : (s.currentPlayerIndex + 1) % s.players.length;

    return {
      ...s,
      guesses: newGuesses,
      currentPlayerIndex: nextPlayerIndex,
      winner,
      finished,
    };
  }

  checkResult(state: GameState): 'ongoing' | 'win' | 'draw' {
    const s = state as WordleState;
    if (!s.finished) return 'ongoing';
    if (s.winner) return 'win';
    return 'draw';
  }

  getWinner(state: GameState): string | null {
    return (state as WordleState).winner;
  }

  getGameLog(move: Move, _userId: string, state: GameState): string {
    const s = state as WordleState;
    const m = move as WordleMove;
    const word = turkishUpper(m.word.trim());

    if (s.winner) {
      return `"${word}" doğru tahmin etti!`;
    }

    const lastGuess = s.guesses[s.guesses.length - 1];
    const correctCount = lastGuess.results.filter((r) => r === 'correct').length;
    const presentCount = lastGuess.results.filter((r) => r === 'present').length;

    return `"${word}" tahmin etti — ${correctCount} doğru, ${presentCount} yanlış yerde`;
  }

  private _evaluateGuess(guess: string, target: string): LetterResult[] {
    const gLen = Math.min(guess.length, target.length, WORD_LENGTH);
    const results: LetterResult[] = new Array(WORD_LENGTH).fill('absent');
    const targetChars = target.split('').slice(0, WORD_LENGTH);
    const guessChars = guess.split('').slice(0, WORD_LENGTH);
    const targetClaimed = new Array(WORD_LENGTH).fill(false);
    const guessClaimed = new Array(WORD_LENGTH).fill(false);

    // Pass 1: claim exact positional matches (green)
    for (let i = 0; i < gLen; i++) {
      if (guessChars[i] === targetChars[i]) {
        results[i] = 'correct';
        targetClaimed[i] = true;
        guessClaimed[i] = true;
      }
    }

    // Pass 2: claim misplaced matches (yellow) from remaining frequency pool
    for (let i = 0; i < gLen; i++) {
      if (guessClaimed[i]) continue;

      for (let j = 0; j < gLen; j++) {
        if (!targetClaimed[j] && guessChars[i] === targetChars[j]) {
          results[i] = 'present';
          targetClaimed[j] = true;
          break;
        }
      }
    }

    return results;
  }
}
