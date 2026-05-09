# Task 5.3 Manual Testing Guide

## Overview
This guide provides step-by-step instructions to manually verify that Task 5.3 (Restore chat history and member list) is working correctly.

## Prerequisites
- Backend server running on port 3000
- Frontend development server running
- Two browser windows or incognito tabs for multi-user testing

## Test 1: Chat History Restoration

### Steps:
1. **Setup:**
   - Open Browser Window 1
   - Login as User 1
   - Create a new room or join an existing room

2. **Send Messages:**
   - In the chat panel, send 3-5 messages:
     - "Hello, this is message 1"
     - "Testing chat history"
     - "This should be restored"
     - "Message number 4"
     - "Final test message"

3. **Refresh Page:**
   - Press F5 or click the browser refresh button
   - Wait for the page to reload

4. **Verify:**
   - ✅ All 5 messages should be visible in the chat panel
   - ✅ Messages should be in the correct order (oldest to newest)
   - ✅ Each message should show the correct sender name
   - ✅ Chat panel should auto-scroll to the bottom

### Expected Result:
All chat messages sent before the refresh are restored and displayed in the chat panel.

---

## Test 2: Member List Restoration

### Steps:
1. **Setup:**
   - Open Browser Window 1 (User 1)
   - Open Browser Window 2 (User 2)
   - Both users join the same room

2. **Verify Initial State:**
   - In Window 1, check the room header
   - Should see "2 members"
   - Should see 2 avatar circles with initials

3. **Refresh Window 1:**
   - In Window 1, press F5 to refresh
   - Wait for the page to reload

4. **Verify After Refresh:**
   - ✅ Room header should still show "2 members"
   - ✅ Both user avatars should be visible
   - ✅ Hovering over avatars should show display names

5. **Add Third User:**
   - Open Browser Window 3 (User 3)
   - User 3 joins the same room
   - Refresh Window 1

6. **Verify Three Members:**
   - ✅ Room header should show "3 members"
   - ✅ Three avatar circles should be visible

### Expected Result:
Member list is correctly restored after page refresh, showing all current room members.

---

## Test 3: User Role Display (OWNER)

### Steps:
1. **Setup:**
   - Open Browser Window 1
   - Login as User 1
   - Create a new room (User 1 becomes OWNER)

2. **Verify OWNER UI:**
   - ✅ Should see "Choose a game to start" message
   - ✅ Should see 4 game selection buttons:
     - Tic-Tac-Toe
     - Connect Four
     - Rock Paper Scissors
     - Hangman

3. **Refresh Page:**
   - Press F5 to refresh
   - Wait for the page to reload

4. **Verify After Refresh:**
   - ✅ Still see "Choose a game to start" message
   - ✅ Still see all 4 game selection buttons
   - ✅ Can click buttons to start games

### Expected Result:
OWNER role is preserved after refresh, and game start buttons remain visible.

---

## Test 4: User Role Display (MEMBER)

### Steps:
1. **Setup:**
   - Window 1: User 1 creates a room (OWNER)
   - Window 2: User 2 joins the room (MEMBER)

2. **Verify MEMBER UI (Window 2):**
   - ✅ Should see "Waiting for the room owner to start a game" message
   - ✅ Should NOT see game selection buttons

3. **Refresh Window 2:**
   - In Window 2, press F5 to refresh
   - Wait for the page to reload

4. **Verify After Refresh:**
   - ✅ Still see "Waiting for the room owner to start a game" message
   - ✅ Still do NOT see game selection buttons

### Expected Result:
MEMBER role is preserved after refresh, and user cannot start games.

---

## Test 5: User Role Display (SPECTATOR)

### Steps:
1. **Setup:**
   - Window 1: User 1 creates a room (OWNER)
   - Window 2: User 2 joins the room (MEMBER)
   - Window 1: User 1 starts a game (e.g., Tic-Tac-Toe)
   - Window 3: User 3 joins the room (becomes SPECTATOR because game is in progress)

2. **Verify SPECTATOR UI (Window 3):**
   - ✅ Should see "You joined as a spectator" message
   - ✅ Should NOT see game selection buttons
   - ✅ Can view the game but cannot make moves

3. **Refresh Window 3:**
   - In Window 3, press F5 to refresh
   - Wait for the page to reload

4. **Verify After Refresh:**
   - ✅ Still see "You joined as a spectator" message
   - ✅ Still cannot make moves in the game
   - ✅ Can still view the game state

### Expected Result:
SPECTATOR role is preserved after refresh, and user remains a spectator.

---

## Test 6: Combined Test (Chat + Members + Role + Active Game)

### Steps:
1. **Setup:**
   - Window 1: User 1 creates a room (OWNER)
   - Window 2: User 2 joins the room (MEMBER)

2. **Send Messages:**
   - User 1 sends: "Let's play Tic-Tac-Toe"
   - User 2 sends: "Sounds good!"

3. **Start Game:**
   - User 1 starts Tic-Tac-Toe game
   - User 1 makes first move (click a cell)
   - User 2 makes second move (click a cell)

4. **Refresh Window 1:**
   - In Window 1, press F5 to refresh
   - Wait for the page to reload

5. **Verify Everything Restored:**
   - ✅ Chat panel shows both messages
   - ✅ Room header shows "2 members"
   - ✅ Both user avatars are visible
   - ✅ User 1 is still OWNER (can see "New Game" button after game ends)
   - ✅ Game board shows the 2 moves that were made
   - ✅ Current turn indicator is correct
   - ✅ Can continue playing the game

### Expected Result:
All state is restored correctly: chat history, member list, user role, and active game state.

---

## Test 7: Empty State Handling

### Steps:
1. **Setup:**
   - Create a new room
   - Do NOT send any messages
   - Do NOT add any other users

2. **Refresh Page:**
   - Press F5 to refresh

3. **Verify:**
   - ✅ Chat panel shows "No messages yet. Say something!"
   - ✅ Room header shows "1 members" (just you)
   - ✅ One avatar circle is visible
   - ✅ No errors in browser console

### Expected Result:
Empty states are handled gracefully without errors.

---

## Debugging Tips

### If messages are not restored:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter by "WS" (WebSocket)
4. Look for `room:get_state` event
5. Check the response payload for `messages` array

### If members are not restored:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Look for `room:get_state` event
4. Check the response payload for `members` array
5. Verify `isOnline` field is present

### If role is not correct:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Look for `room:get_state` event
4. Check the response payload for `userRole` field
5. Should be one of: "OWNER", "MEMBER", "SPECTATOR"

### If game state is not restored:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Look for `room:get_state` event
4. Check the response payload for `activeGame` object
5. Verify `state`, `players`, and `gameType` fields are present

---

## Success Criteria

Task 5.3 is considered COMPLETE if all of the following are true:

- ✅ Chat messages are restored after page refresh
- ✅ Member list is restored with correct count
- ✅ Member avatars are displayed correctly
- ✅ User role (OWNER/MEMBER/SPECTATOR) is preserved
- ✅ Role-based UI behavior is correct (game start buttons, messages)
- ✅ Active game state is restored (if game was in progress)
- ✅ Empty states are handled gracefully
- ✅ No errors in browser console

---

## Notes

- This task builds on Task 5.1 (room:get_state socket event)
- The backend must be running for state recovery to work
- Socket authentication must complete before state recovery
- State recovery happens automatically on page load (no user action required)
