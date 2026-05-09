# Disconnect Timeout Verification Test Plan
## INV-008: 30-Second Disconnect Rule

**Date:** May 7, 2026  
**Requirement:** INV-008 - If a player disconnects during an active game, wait 30 seconds before declaring the other player as winner  
**Status:** ⏳ READY FOR TESTING

---

## 🎯 Test Objectives

1. Verify 30-second timeout is enforced correctly
2. Confirm `game:end` event with `disconnect_timeout` reason
3. Validate winner determination on disconnect
4. Test reconnection within timeout window
5. Verify game state cleanup after timeout

---

## 🔧 Implementation Details

### Backend Logic (`game.handler.ts`)

```typescript
socket.on('disconnect', () => {
  for (const [gameId, game] of activeGames.entries()) {
    const state = game.state as { players?: string[] };
    if (state.players && state.players.includes(userId)) {
      const timer = setTimeout(async () => {
        // After 30 seconds:
        // 1. Find the other player
        // 2. Update game status to FINISHED
        // 3. Set winnerId to other player
        // 4. Emit game:end with reason: 'disconnect_timeout'
        // 5. Clean up game from memory
      }, 30000); // 30 seconds
      
      disconnectTimers.set(userId, timer);
    }
  }
});
```

### Reconnection Handling (`socket/index.ts`)

```typescript
socket.on('authenticate', (data) => {
  // Cancel any pending disconnect timer
  cancelDisconnectTimer(decoded.userId);
});
```

---

## 🧪 Test Cases

### Test Case 1: Basic Disconnect Timeout
**Objective:** Verify 30-second timeout triggers game end

**Steps:**
1. User A creates a room
2. User B joins the room
3. User A starts a Tic-Tac-Toe game
4. User A makes a move
5. User B disconnects (close browser/tab)
6. Wait 30 seconds
7. Verify game ends with User A as winner

**Expected Results:**
- ✅ Timer starts on User B disconnect
- ✅ After 30 seconds, `game:end` event emitted
- ✅ Event payload includes:
  - `result: 'win'`
  - `winnerId: <User A ID>`
  - `reason: 'disconnect_timeout'`
- ✅ Game status in DB updated to `FINISHED`
- ✅ Winner ID in DB set to User A
- ✅ Game removed from memory (`activeGames`)
- ✅ Frontend displays "Opponent disconnected" message

---

### Test Case 2: Reconnection Within Timeout
**Objective:** Verify timer cancellation on reconnect

**Steps:**
1. User A creates a room
2. User B joins the room
3. User A starts a Connect Four game
4. User A makes a move
5. User B disconnects (close browser/tab)
6. Wait 15 seconds (half the timeout)
7. User B reconnects (reopen browser/tab)
8. Verify game continues normally

**Expected Results:**
- ✅ Timer starts on User B disconnect
- ✅ Timer is cancelled when User B reconnects
- ✅ No `game:end` event emitted
- ✅ Game state preserved
- ✅ User B can continue playing
- ✅ No winner declared

---

### Test Case 3: Multiple Games Disconnect
**Objective:** Verify timeout works independently per game

**Steps:**
1. User A creates Room 1, User B joins
2. User C creates Room 2, User D joins
3. Both rooms start Hangman games
4. User B disconnects from Room 1
5. User D disconnects from Room 2
6. Wait 30 seconds
7. Verify both games end correctly

**Expected Results:**
- ✅ Two independent timers created
- ✅ Room 1 game ends with User A as winner
- ✅ Room 2 game ends with User C as winner
- ✅ Both `game:end` events have `disconnect_timeout` reason
- ✅ No cross-contamination between games

---

### Test Case 4: Disconnect Before First Move
**Objective:** Verify timeout works even if game just started

**Steps:**
1. User A creates a room
2. User B joins the room
3. User A starts a Rock Paper Scissors game
4. User B disconnects immediately (no moves made)
5. Wait 30 seconds
6. Verify game ends with User A as winner

**Expected Results:**
- ✅ Timer starts even with no moves
- ✅ Game ends after 30 seconds
- ✅ User A declared winner
- ✅ `disconnect_timeout` reason provided

---

### Test Case 5: Both Players Disconnect
**Objective:** Verify behavior when both players disconnect

**Steps:**
1. User A creates a room
2. User B joins the room
3. User A starts a Tic-Tac-Toe game
4. User A makes a move
5. User A disconnects
6. User B disconnects
7. Wait 30 seconds
8. Verify game cleanup

**Expected Results:**
- ✅ Two timers created (one per player)
- ✅ First timer to expire determines winner
- ✅ Game ends with remaining player as winner
- ✅ Game cleaned up from memory
- ✅ No errors or crashes

---

### Test Case 6: Disconnect During Hangman (Role-Based)
**Objective:** Verify timeout works with role-based games

**Steps:**
1. User A creates a room (becomes Word Setter)
2. User B joins the room (becomes Word Guesser)
3. User A starts Hangman and sets word
4. User B makes one guess
5. User B (Guesser) disconnects
6. Wait 30 seconds
7. Verify User A (Setter) wins

**Expected Results:**
- ✅ Timer starts on Guesser disconnect
- ✅ Setter declared winner after timeout
- ✅ Role information preserved in game end event
- ✅ Correct winner determination

---

### Test Case 7: Spectator Disconnect
**Objective:** Verify spectator disconnect doesn't trigger timeout

**Steps:**
1. User A creates a room
2. User B joins as player
3. User C joins as spectator
4. User A starts a game
5. User C (spectator) disconnects
6. Wait 30 seconds
7. Verify game continues normally

**Expected Results:**
- ✅ No timer created for spectator
- ✅ Game continues unaffected
- ✅ No `game:end` event emitted
- ✅ Players can continue playing

---

### Test Case 8: Disconnect After Game Ends
**Objective:** Verify no timeout triggered after game completion

**Steps:**
1. User A creates a room
2. User B joins the room
3. User A starts a Tic-Tac-Toe game
4. Players complete the game (User A wins)
5. User B disconnects
6. Wait 30 seconds
7. Verify no additional events

**Expected Results:**
- ✅ No timer created (game already finished)
- ✅ No duplicate `game:end` events
- ✅ Game state remains FINISHED
- ✅ Winner unchanged

---

## 🔍 Manual Testing Procedure

### Setup
1. Open two browser windows (or use incognito mode)
2. Register two test users:
   - `test-user-disconnect-1`
   - `test-user-disconnect-2`
3. Have a timer/stopwatch ready

### Execution
1. **Window 1 (User 1):**
   - Login as `test-user-disconnect-1`
   - Create a room named "Disconnect Test"
   - Wait for User 2 to join

2. **Window 2 (User 2):**
   - Login as `test-user-disconnect-2`
   - Join "Disconnect Test" room

3. **Window 1 (User 1):**
   - Start a Tic-Tac-Toe game
   - Make the first move (place X)

4. **Window 2 (User 2):**
   - Close the browser tab/window (simulate disconnect)
   - Start timer

5. **Window 1 (User 1):**
   - Observe the UI
   - After 30 seconds, verify:
     - Game ends
     - "Opponent disconnected" message appears
     - User 1 is declared winner
     - "New Game" button appears (if owner)

### Verification Points
- [ ] Disconnect detected immediately
- [ ] UI shows waiting/loading state
- [ ] Exactly 30 seconds pass before game end
- [ ] Winner correctly determined
- [ ] Game state cleaned up
- [ ] No console errors
- [ ] Database updated correctly

---

## 🐛 Known Edge Cases

### Edge Case 1: Network Fluctuation
**Scenario:** User's network drops briefly then recovers  
**Expected:** Timer cancelled if reconnect within 30s

### Edge Case 2: Server Restart
**Scenario:** Server restarts during active game  
**Expected:** All games end, no timers persist

### Edge Case 3: Rapid Disconnect/Reconnect
**Scenario:** User disconnects and reconnects multiple times  
**Expected:** Timer resets on each reconnect

### Edge Case 4: Timeout Exactly at Move
**Scenario:** Timeout expires exactly when move is made  
**Expected:** Race condition handled gracefully

---

## 📊 Success Criteria

| Criterion | Status |
|-----------|--------|
| 30-second timeout enforced | ⏳ TO TEST |
| `game:end` event emitted | ⏳ TO TEST |
| Correct winner determination | ⏳ TO TEST |
| Reconnection cancels timer | ⏳ TO TEST |
| Game state cleanup | ⏳ TO TEST |
| No memory leaks | ⏳ TO TEST |
| Frontend displays correctly | ⏳ TO TEST |
| Database updated correctly | ⏳ TO TEST |

---

## 🚀 Next Steps

1. **Execute Manual Tests:** Run all 8 test cases
2. **Document Results:** Record pass/fail for each test
3. **Fix Issues:** Address any failures found
4. **Automated Tests:** Consider adding integration tests
5. **Performance Test:** Verify timeout accuracy under load
6. **Final Verification:** Complete end-to-end testing

---

## 📝 Notes

- The 30-second timeout is hardcoded in `game.handler.ts` (line 318)
- Timer cleanup happens in `cancelDisconnectTimer()` function
- Frontend displays disconnect message via `gameResult.reason === 'disconnect_timeout'`
- All game types (Tic-Tac-Toe, Connect Four, Hangman, RPS) use the same timeout logic
- Spectators are excluded from timeout logic (only players tracked)

---

## ✅ Completion Checklist

- [ ] All 8 test cases executed
- [ ] All edge cases verified
- [ ] Frontend displays correct messages
- [ ] Backend logs reviewed
- [ ] Database state verified
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Documentation updated
- [ ] Code review completed
- [ ] Ready for production
