# Implementation Plan: PlayChat Completion

## Overview

This implementation plan covers the final 10% of the PlayChat integration project to achieve production-ready status. The work is organized into three phases: Backend Implementation (State Recovery + Hangman Roles), Frontend Implementation (Toast System + Loading States + Mobile Responsiveness), and Quality Assurance (Testing + Debug Cleanup).

The implementation follows a backend-first approach to ensure core functionality is solid before enhancing the user interface.

## Tasks

### Phase 1: Backend Implementation

- [ ] 1. Implement State Recovery System
  - [x] 1.1 Add room:get_state socket event handler in room.handler.ts
    - Create new socket event handler that accepts `{ roomId: string }`
    - Implement membership verification (user must be a member)
    - Fetch room data with members and messages using Prisma include
    - Fetch active game from database (status: IN_PROGRESS)
    - Reconstruct active game state from memory (activeGames map)
    - Handle server restart scenario (game in DB but not in memory)
    - Reconstruct member online status from socket connections (io.in(roomId).fetchSockets())
    - Return RoomStateResponse with room, members, messages, activeGame, userRole
    - Implement error handling for "Room not found", "Not a member", "Failed to fetch state"
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8_
  
  - [x] 1.2 Write unit tests for state recovery handler
    - Test returns complete state for valid room member
    - Test returns error for non-member
    - Test returns error for non-existent room
    - Test correctly reconstructs online status from socket connections
    - Test handles missing active game (returns null)
    - Test handles active game in memory
    - Test handles active game in DB but not memory (server restart scenario)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ] 2. Implement Hangman Role Assignment and Enforcement
  - [x] 2.1 Modify Hangman.ts to add roles map to HangmanState
    - Add `roles: { [userId: string]: 'SETTER' | 'GUESSER' }` to HangmanState interface
    - Modify initialize() to assign player[0] as SETTER, player[1] as GUESSER
    - Populate roles map in initialize() return value
    - Ensure setter and guesser fields are set correctly
    - _Requirements: 2.1, 2.2_
  
  - [x] 2.2 Enhance Hangman validateMove to enforce role-based permissions
    - Check if userId === state.guesser for letter guesses
    - Return false if wrong role attempts letter guess
    - Maintain existing validation for letter format and already-guessed letters
    - Keep word submission validation (currently disabled, but architecture supports it)
    - _Requirements: 2.5, 2.6, 2.7_
  
  - [x] 2.3 Modify game.handler.ts to include role information in game:started event
    - When gameType === 'HANGMAN', map players to include gameRole field
    - Extract gameRole from (gameState as HangmanState).roles[userId]
    - Emit enhanced game:started payload with players containing gameRole
    - _Requirements: 2.3_
  
  - [x] 2.4 Update game:move error messages for role violations
    - Return "Only the Word Guesser can guess letters" when guesser role check fails
    - Return "Only the Word Setter can submit the word" for word submission attempts
    - Maintain existing "Invalid move" for other validation failures
    - _Requirements: 2.7_
  
  - [x] 2.5 Write unit tests for Hangman role assignment and validation
    - Test initialize() assigns player 0 as SETTER
    - Test initialize() assigns player 1 as GUESSER
    - Test initialize() throws error if not exactly 2 players
    - Test roles map is included in returned state
    - Test guesser can guess valid letters
    - Test guesser cannot guess already-guessed letters
    - Test guesser cannot guess invalid characters
    - Test setter cannot guess letters
    - Test neither player can move after game ends
    - Test validates letter format (single uppercase A-Z)
    - _Requirements: 2.1, 2.2, 2.5, 2.6_

- [x] 3. Checkpoint - Backend Implementation Complete
  - Ensure all backend tests pass
  - Verify state recovery works via manual socket testing (e.g., Postman or socket.io-client)
  - Verify Hangman role assignment and enforcement via manual testing
  - Ask the user if questions arise

### Phase 2: Frontend Implementation

- [x] 4. Implement Toast Notification System
  - [x] 4.1 Create Toast component with Architectural Noir styling
    - Create `frontend/src/components/ui/Toast.tsx` component
    - Implement toast types: error, success, warning
    - Use background #111111, white text, border #222222
    - Add auto-dismiss after 4 seconds
    - Add manual dismiss on click
    - Ensure flat surfaces, no gradients, no shadows
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.7, 3.8_
  
  - [x] 4.2 Create ToastContext for global toast management
    - Create `frontend/src/context/ToastContext.tsx`
    - Implement addToast, removeToast functions
    - Implement toast queue with vertical stacking
    - Ensure multiple toasts don't overlap
    - _Requirements: 3.6_
  
  - [x] 4.3 Integrate toast notifications in Room.tsx for socket errors
    - Show error toast when room:join fails
    - Show error toast when game:start fails
    - Show error toast when game:move fails
    - Show warning toast when player disconnects during game
    - _Requirements: 3.1, 3.3_
  
  - [x] 4.4 Integrate toast notifications for game results
    - Show success toast when game ends with winner
    - Show success toast when game ends in draw
    - Show warning toast when game ends due to disconnect_timeout
    - _Requirements: 3.2, 3.3_

- [x] 5. Implement State Recovery in Frontend
  - [x] 5.1 Add room:get_state request in Room.tsx after socket authentication
    - Call socket.emit('room:get_state', { roomId }) after authenticated event
    - Handle RoomStateResponse to restore room, members, messages, activeGame, userRole
    - Update local state with restored data
    - _Requirements: 1.7_
  
  - [x] 5.2 Restore game state UI when activeGame is present
    - Render appropriate game component based on gameType
    - Pass restored game state to game component
    - Display player list with current turn indicator
    - _Requirements: 1.1, 1.5_
  
  - [x] 5.3 Restore chat history and member list
    - Populate chat panel with restored messages
    - Populate member list with restored members and online status
    - Display user's role (OWNER, MEMBER, SPECTATOR)
    - _Requirements: 1.2, 1.3, 1.4_
  
  - [x] 5.4 Handle state recovery errors
    - Show error toast when state recovery fails
    - Redirect to dashboard on "Room not found" or "Not a member" errors
    - Provide retry button for "Failed to fetch state" errors
    - _Requirements: 1.8_

- [x] 6. Implement Hangman Role Display in Frontend
  - [x] 6.1 Update Hangman.tsx to display player roles
    - Show "Word Setter" label for setter player
    - Show "Word Guesser" label for guesser player
    - Highlight current user's role
    - _Requirements: 2.4_
  
  - [x] 6.2 Update Hangman.tsx to handle role-based errors
    - Show error toast when "Only the Word Guesser can guess letters" is received
    - Show error toast when "Only the Word Setter can submit the word" is received
    - _Requirements: 2.7_

- [x] 7. Implement Loading State Management
  - [x] 7.1 Create skeleton loader components
    - Create `frontend/src/components/ui/SkeletonLoader.tsx`
    - Implement skeleton for room cards (Dashboard)
    - Implement skeleton for member list (Room)
    - Implement skeleton for game area (Room)
    - Use background #111111, border #222222, flat surfaces
    - _Requirements: 4.1, 4.2, 4.4_
  
  - [x] 7.2 Integrate skeleton loaders in Dashboard.tsx
    - Show skeleton loaders while fetching room list
    - Replace skeletons with actual room cards when data arrives
    - Show timeout error if loading takes >5 seconds
    - _Requirements: 4.1, 4.5_
  
  - [x] 7.3 Integrate skeleton loaders in Room.tsx
    - Show skeleton loaders while fetching initial room state
    - Replace skeletons with actual content when state recovery completes
    - Show timeout error if loading takes >5 seconds
    - _Requirements: 4.2, 4.3, 4.5_

- [x] 8. Implement Mobile Responsiveness for Game Boards
  - [x] 8.1 Make TicTacToe.tsx mobile responsive
    - Scale board to fit viewport width while maintaining aspect ratio
    - Ensure touch targets are at least 44x44 pixels
    - Test on mobile viewport (375px width)
    - _Requirements: 5.1, 5.5_
  
  - [x] 8.2 Make ConnectFour.tsx mobile responsive
    - Scale board to fit viewport width while maintaining aspect ratio
    - Ensure touch targets are at least 44x44 pixels
    - Test on mobile viewport (375px width)
    - _Requirements: 5.2, 5.5_
  
  - [x] 8.3 Make RockPaperScissors.tsx mobile responsive
    - Display choice buttons in vertical or wrapped layout on mobile
    - Ensure touch targets are at least 44x44 pixels
    - Test on mobile viewport (375px width)
    - _Requirements: 5.3, 5.5_
  
  - [x] 8.4 Make Hangman.tsx mobile responsive
    - Display word, keyboard, and hangman graphic in stacked layout
    - Ensure keyboard buttons are at least 44x44 pixels
    - Test on mobile viewport (375px width)
    - _Requirements: 5.4, 5.5_
  
  - [x] 8.5 Verify Architectural Noir design system on all screen sizes
    - Test all game boards maintain flat surfaces, no gradients, no shadows
    - Test border color #222222 is consistent
    - Test background colors are consistent (#0a0a0a, #111111, #1a1a1a)
    - _Requirements: 5.6_

- [ ] 9. Checkpoint - Frontend Implementation Complete
  - Ensure all frontend components render correctly
  - Test state recovery flow manually (refresh page during game)
  - Test toast notifications appear and dismiss correctly
  - Test loading states appear and disappear correctly
  - Test mobile responsiveness on 375px viewport
  - Ask the user if questions arise

### Phase 3: Quality Assurance

- [ ] 10. Debug Cleanup
  - [ ] 10.1 Remove console.log statements from backend
    - Search for console.log in backend/src/**/*.ts
    - Remove all console.log except structured logger calls
    - Keep console.error for error logging
    - _Requirements: 7.1_
  
  - [ ] 10.2 Remove console.log statements from frontend
    - Search for console.log in frontend/src/**/*.tsx and frontend/src/**/*.ts
    - Remove all console.log except error logging
    - Keep console.error for error logging
    - _Requirements: 7.2_
  
  - [ ] 10.3 Remove debug comments and TODO markers from backend
    - Search for TODO, FIXME, DEBUG, HACK in backend/src/**/*.ts
    - Resolve or remove all markers
    - _Requirements: 7.3_
  
  - [ ] 10.4 Remove debug comments and TODO markers from frontend
    - Search for TODO, FIXME, DEBUG, HACK in frontend/src/**/*.tsx and frontend/src/**/*.ts
    - Resolve or remove all markers
    - _Requirements: 7.4_
  
  - [ ] 10.5 Remove unused imports and variables from backend
    - Run TypeScript compiler with noUnusedLocals and noUnusedParameters
    - Fix all unused import and variable warnings
    - _Requirements: 7.5_
  
  - [ ] 10.6 Remove unused imports and variables from frontend
    - Run TypeScript compiler with noUnusedLocals and noUnusedParameters
    - Fix all unused import and variable warnings
    - _Requirements: 7.6_

- [ ] 11. Verify Disconnect Timeout Functionality
  - [ ] 11.1 Test disconnect timer starts when player disconnects during game
    - Start a game with two users
    - Disconnect one user
    - Verify disconnect timer starts (check backend logs or add temporary logging)
    - _Requirements: 6.1_
  
  - [ ] 11.2 Test disconnect timer cancels when player reconnects within 30 seconds
    - Start a game with two users
    - Disconnect one user
    - Reconnect within 30 seconds
    - Verify game continues without ending
    - _Requirements: 6.2_
  
  - [ ] 11.3 Test game ends after 30 seconds of disconnect
    - Start a game with two users
    - Disconnect one user
    - Wait 30 seconds
    - Verify game ends with result "disconnect_timeout"
    - Verify remaining player receives win
    - _Requirements: 6.3, 6.4_
  
  - [ ] 11.4 Test game:end event is emitted with reason "disconnect_timeout"
    - Verify game:end event payload includes reason: "disconnect_timeout"
    - Verify all room members receive the event
    - _Requirements: 6.5_
  
  - [ ] 11.5 Test frontend displays disconnect timeout notification
    - Verify toast notification appears when game ends due to disconnect_timeout
    - Verify notification message indicates opponent disconnected
    - _Requirements: 6.6_

- [ ] 12. Multi-User End-to-End Testing
  - [ ] 12.1 Test two users joining the same room simultaneously
    - Open two browser windows with different users
    - Join the same room from both windows
    - Verify both users appear in member list
    - _Requirements: 8.1_
  
  - [ ] 12.2 Test two users playing Tic-Tac-Toe with turn enforcement
    - Start Tic-Tac-Toe game with two users
    - Verify turns alternate correctly
    - Verify non-current player cannot make moves
    - Verify game ends correctly with winner or draw
    - _Requirements: 8.2_
  
  - [ ] 12.3 Test two users playing Connect Four with turn enforcement
    - Start Connect Four game with two users
    - Verify turns alternate correctly
    - Verify non-current player cannot make moves
    - Verify game ends correctly with winner or draw
    - _Requirements: 8.3_
  
  - [ ] 12.4 Test two users playing Rock Paper Scissors with simultaneous moves
    - Start Rock Paper Scissors game with two users
    - Verify both players can submit moves simultaneously
    - Verify game ends correctly with winner or draw
    - _Requirements: 8.4_
  
  - [ ] 12.5 Test two users playing Hangman with role enforcement
    - Start Hangman game with two users
    - Verify roles are assigned (Word Setter and Word Guesser)
    - Verify only Word Guesser can guess letters
    - Verify Word Setter cannot guess letters
    - Verify game ends correctly with winner
    - _Requirements: 8.5_
  
  - [ ] 12.6 Test third user joining as spectator
    - Start a game with two users
    - Join a third user to the room
    - Verify third user is marked as SPECTATOR
    - Verify spectator can view game but cannot make moves
    - _Requirements: 8.6_
  
  - [ ] 12.7 Test chat messages delivered to all room members in real-time
    - Have multiple users in a room
    - Send chat messages from different users
    - Verify all users receive messages in real-time
    - _Requirements: 8.7_
  
  - [ ] 12.8 Test state recovery when one user refreshes during active game
    - Start a game with two users
    - Refresh page for one user
    - Verify user reconnects and game state is restored
    - Verify game continues without interruption
    - _Requirements: 8.8_

- [ ] 13. Final Checkpoint - Production Ready
  - Ensure all tests pass (unit, integration, manual)
  - Verify all system invariants (INV-001 through INV-010) remain intact
  - Verify Architectural Noir design system is consistent across all screens
  - Verify no console.log statements in production code
  - Verify no unused imports or variables
  - Verify all requirements (1-8) are satisfied
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Backend implementation is prioritized to ensure core functionality is solid
- Frontend implementation builds on backend foundation
- Quality assurance ensures production-ready status
- All changes must maintain existing system invariants (INV-001 through INV-010)
- All UI components must follow Architectural Noir design system
- No database schema changes are required
