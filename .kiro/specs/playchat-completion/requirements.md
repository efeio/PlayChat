# Requirements Document

## Introduction

This document specifies the requirements for completing the final 10% of the PlayChat integration project to achieve production-ready and demo-compliant status. PlayChat is a real-time multiplayer gaming platform with integrated chat functionality. The core architecture (90%) is complete, including authentication, four integrated games (Tic-Tac-Toe, Connect Four, Rock Paper Scissors, Hangman), real-time chat, and the Architectural Noir design system.

The remaining work focuses on state recovery for reconnections, role refinement for Hangman, UI/UX polish (toast notifications, loading states, mobile responsiveness), and quality assurance (disconnect timeout verification, debug cleanup, multi-user testing).

## Glossary

- **Frontend**: The React 19 + Vite + Tailwind client application
- **Backend**: The Fastify v5 + Socket.IO + Prisma/SQLite server application
- **Socket_Manager**: The Socket.IO connection management system
- **State_Recovery_System**: The system responsible for restoring user state after reconnection
- **Toast_System**: The notification system for displaying errors and game results
- **Hangman_Role_Manager**: The system responsible for assigning and enforcing Word Setter and Word Guesser roles in Hangman
- **Loading_State_Manager**: The system responsible for displaying skeleton loaders during data fetching
- **Disconnect_Timer**: The 30-second timer that triggers game end when a player disconnects (INV-008)
- **User**: An authenticated player or spectator in the system
- **Room**: A game session container with members and an optional active game
- **Game_State**: The current state of an active game including board, players, and turn information
- **Chat_History**: The collection of messages in a room's current session
- **Member_List**: The collection of users currently in a room with their roles
- **Role**: A user's permission level in a room (OWNER, MEMBER, SPECTATOR)

## Requirements

### Requirement 1: State Recovery on Reconnection

**User Story:** As a user, I want to restore my game state, chat history, room membership, and role when I refresh the page or reconnect, so that I can continue playing without losing progress.

#### Acceptance Criteria

1. WHEN a User reconnects to a Room, THE State_Recovery_System SHALL restore the current Game_State if a game is active
2. WHEN a User reconnects to a Room, THE State_Recovery_System SHALL restore the Chat_History from the current session
3. WHEN a User reconnects to a Room, THE State_Recovery_System SHALL restore the Member_List with current online status
4. WHEN a User reconnects to a Room, THE State_Recovery_System SHALL restore the User's Role (OWNER, MEMBER, or SPECTATOR)
5. WHEN a User reconnects during an active game, THE State_Recovery_System SHALL restore the player list and current turn indicator
6. THE Backend SHALL provide a REST endpoint or socket event that returns the complete room state including game state, chat history, members, and user role
7. THE Frontend SHALL request state recovery immediately after socket authentication completes
8. WHEN state recovery fails, THE Frontend SHALL display an error message and redirect the User to the dashboard

### Requirement 2: Hangman Role Assignment

**User Story:** As a player, I want clear role assignment in Hangman (Word Setter vs Word Guesser), so that I understand my responsibilities and the game is fair.

#### Acceptance Criteria

1. WHEN a Hangman game starts, THE Hangman_Role_Manager SHALL assign one player as "Word Setter" and one player as "Word Guesser"
2. THE Hangman_Role_Manager SHALL ensure role assignment is deterministic and fair (e.g., alternating, random, or first-join based)
3. WHEN the game starts, THE Backend SHALL include role assignments in the game:started event payload
4. THE Frontend SHALL display each player's role clearly in the Hangman game interface
5. THE Backend SHALL enforce that only the Word Setter can submit the word to guess
6. THE Backend SHALL enforce that only the Word Guesser can submit letter guesses
7. WHEN a player attempts an action not permitted by their role, THE Backend SHALL return an error message

### Requirement 3: Toast Notification System

**User Story:** As a user, I want to see toast notifications for errors and game results, so that I am immediately aware of important events without disrupting my workflow.

#### Acceptance Criteria

1. THE Toast_System SHALL display error notifications when socket events return errors
2. THE Toast_System SHALL display success notifications when a game ends with a winner or draw
3. THE Toast_System SHALL display warning notifications when a player disconnects during a game
4. THE Toast_System SHALL auto-dismiss notifications after 4 seconds
5. THE Toast_System SHALL allow manual dismissal by clicking the notification
6. THE Toast_System SHALL stack multiple notifications vertically without overlap
7. THE Toast_System SHALL follow the Architectural Noir design system (flat surfaces, no gradients, no shadows, border color #222222)
8. THE Toast_System SHALL use white text on dark background (#111111) for readability

### Requirement 4: Loading State Management

**User Story:** As a user, I want to see skeleton loaders when navigating between dashboard and rooms, so that I understand the application is working and not frozen.

#### Acceptance Criteria

1. WHEN the Dashboard is loading room data, THE Loading_State_Manager SHALL display skeleton loaders for room cards
2. WHEN a Room is loading initial data, THE Loading_State_Manager SHALL display skeleton loaders for the member list and game area
3. THE Loading_State_Manager SHALL replace skeleton loaders with actual content when data arrives
4. THE Loading_State_Manager SHALL follow the Architectural Noir design system (flat surfaces, background color #111111, border color #222222)
5. WHEN loading takes longer than 5 seconds, THE Frontend SHALL display a timeout error message

### Requirement 5: Mobile Responsiveness for Game Boards

**User Story:** As a mobile user, I want game boards to be fully playable on my device, so that I can enjoy PlayChat on any screen size.

#### Acceptance Criteria

1. WHEN a User views Tic-Tac-Toe on a mobile device, THE Frontend SHALL scale the board to fit the viewport width while maintaining aspect ratio
2. WHEN a User views Connect Four on a mobile device, THE Frontend SHALL scale the board to fit the viewport width while maintaining aspect ratio
3. WHEN a User views Rock Paper Scissors on a mobile device, THE Frontend SHALL display choice buttons in a vertical or wrapped layout
4. WHEN a User views Hangman on a mobile device, THE Frontend SHALL display the word, keyboard, and hangman graphic in a stacked layout
5. THE Frontend SHALL ensure touch targets for game interactions are at least 44x44 pixels on mobile devices
6. THE Frontend SHALL maintain the Architectural Noir design system on all screen sizes

### Requirement 6: Disconnect Timeout Verification

**User Story:** As a player, I want the game to end automatically if my opponent disconnects for 30 seconds, so that I am not stuck waiting indefinitely.

#### Acceptance Criteria

1. WHEN a player disconnects during an active game, THE Disconnect_Timer SHALL start a 30-second countdown
2. WHEN the disconnected player reconnects within 30 seconds, THE Disconnect_Timer SHALL cancel the countdown
3. WHEN the Disconnect_Timer reaches 30 seconds, THE Backend SHALL end the game with result "disconnect_timeout"
4. WHEN a game ends due to disconnect timeout, THE Backend SHALL award the win to the remaining connected player
5. THE Backend SHALL emit a game:end event with reason "disconnect_timeout" to all room members
6. THE Frontend SHALL display a notification indicating the opponent disconnected and the game ended

### Requirement 7: Debug Cleanup

**User Story:** As a developer, I want all debug code removed from production, so that the application is clean and performant.

#### Acceptance Criteria

1. THE Backend SHALL have all console.log statements removed except for structured logger calls
2. THE Frontend SHALL have all console.log statements removed except for error logging
3. THE Backend SHALL have all debug comments and TODO markers removed or resolved
4. THE Frontend SHALL have all debug comments and TODO markers removed or resolved
5. THE Backend SHALL have no unused imports or variables
6. THE Frontend SHALL have no unused imports or variables

### Requirement 8: Multi-User End-to-End Testing

**User Story:** As a QA engineer, I want to verify multi-user scenarios work correctly, so that the application is production-ready.

#### Acceptance Criteria

1. THE System SHALL support two users joining the same room simultaneously
2. THE System SHALL support two users playing Tic-Tac-Toe with correct turn enforcement
3. THE System SHALL support two users playing Connect Four with correct turn enforcement
4. THE System SHALL support two users playing Rock Paper Scissors with simultaneous move submission
5. THE System SHALL support two users playing Hangman with correct role enforcement (Word Setter and Word Guesser)
6. THE System SHALL support a third user joining as a spectator and viewing the game without being able to submit moves
7. THE System SHALL support chat messages being delivered to all room members in real-time
8. THE System SHALL support state recovery when one user refreshes the page during an active game

## Design System Constraints

All UI components MUST adhere to the Architectural Noir design system:

- **Colors**: 
  - Background base: #0a0a0a
  - Background surface: #111111
  - Background elevated: #1a1a1a
  - Border: #222222
  - Text primary: #ffffff
  - Text secondary: #a0a0a0
  - Text muted: #666666

- **Typography**: Inter font family

- **Visual Style**: 
  - No gradients
  - No shadows
  - Flat surfaces only
  - Minimal borders

- **Buttons**:
  - Primary: White background, black text
  - Outlined: Transparent background, white border, white text

## System Invariants (Must Not Break)

The following invariants are already enforced and MUST remain intact:

- **INV-001**: User can be in only one room at a time
- **INV-002**: Room can have only one active game at a time
- **INV-003**: Only room owner can start games
- **INV-004**: Late joiners become spectators
- **INV-005**: Spectators cannot submit moves
- **INV-006**: No message history replay (only current session)
- **INV-007**: Game logs visually separated from chat
- **INV-008**: 30-second disconnect timeout
- **INV-009**: No web push notifications
- **INV-010**: No global leaderboard
