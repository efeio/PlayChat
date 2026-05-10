import { GameEngine } from './GameEngine.js';
const VALID_CHOICES = ['rock', 'paper', 'scissors'];
export class RockPaperScissors extends GameEngine {
    initialize(players) {
        const scores = {};
        const choices = {};
        for (const p of players) {
            scores[p] = 0;
            choices[p] = null;
        }
        return {
            players: [...players],
            choices,
            round: 1,
            scores,
            lastRoundResult: null,
            winner: null,
            maxRounds: 3,
        };
    }
    validateMove(state, move, userId) {
        const s = state;
        const m = move;
        if (s.winner)
            return false;
        if (!s.players.includes(userId))
            return false;
        if (!VALID_CHOICES.includes(m.choice))
            return false;
        if (s.choices[userId] !== null)
            return false;
        return true;
    }
    applyMove(state, move, userId) {
        const s = state;
        const m = move;
        const newChoices = { ...s.choices, [userId]: m.choice };
        const allChosen = s.players.every((p) => newChoices[p] !== null);
        if (!allChosen) {
            return { ...s, choices: newChoices };
        }
        const p1 = s.players[0];
        const p2 = s.players[1];
        const c1 = newChoices[p1];
        const c2 = newChoices[p2];
        const newScores = { ...s.scores };
        let result;
        if (c1 === c2) {
            result = 'Draw!';
        }
        else if ((c1 === 'rock' && c2 === 'scissors') ||
            (c1 === 'paper' && c2 === 'rock') ||
            (c1 === 'scissors' && c2 === 'paper')) {
            newScores[p1] = (newScores[p1] || 0) + 1;
            result = `${p1} wins the round!`;
        }
        else {
            newScores[p2] = (newScores[p2] || 0) + 1;
            result = `${p2} wins the round!`;
        }
        const resetChoices = {};
        for (const p of s.players) {
            resetChoices[p] = null;
        }
        const newRound = s.round + 1;
        let winner = null;
        if (newRound > s.maxRounds) {
            const s1 = newScores[p1] || 0;
            const s2 = newScores[p2] || 0;
            if (s1 > s2)
                winner = p1;
            else if (s2 > s1)
                winner = p2;
            else
                winner = null;
        }
        return {
            ...s,
            choices: winner ? newChoices : resetChoices,
            round: newRound,
            scores: newScores,
            lastRoundResult: result,
            winner,
        };
    }
    checkResult(state) {
        const s = state;
        if (s.round > s.maxRounds) {
            return s.winner ? 'win' : 'draw';
        }
        return 'ongoing';
    }
    getWinner(state) {
        return state.winner;
    }
    getGameLog(move, _userId, state) {
        const s = state;
        if (s.lastRoundResult) {
            return `Round ${s.round - 1}: ${s.lastRoundResult}`;
        }
        return 'made their choice';
    }
}
//# sourceMappingURL=RockPaperScissors.js.map