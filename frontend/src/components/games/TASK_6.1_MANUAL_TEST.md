# Task 6.1: Manual Testing Guide

## Test Scenario: Hangman Role Display

### Prerequisites
1. Two users logged in (User A and User B)
2. Both users in the same room
3. User A is the room owner

### Test Steps

#### Step 1: Start Hangman Game
1. User A clicks "Start Game" and selects "Hangman"
2. **Expected Result**: Game starts with roles assigned

#### Step 2: Verify Role Display for Word Setter (User A)
1. User A views the game interface
2. **Expected Results**:
   - See "Word Setter: [User A's name]" with highlighted background
   - See "(You)" indicator in green next to User A's name
   - See "Word Guesser: [User B's name]" with normal background
   - No "(You)" indicator next to User B's name

#### Step 3: Verify Role Display for Word Guesser (User B)
1. User B views the game interface
2. **Expected Results**:
   - See "Word Setter: [User A's name]" with normal background
   - No "(You)" indicator next to User A's name
   - See "Word Guesser: [User B's name]" with highlighted background
   - See "(You)" indicator in green next to User B's name

#### Step 4: Verify Visual Styling
1. Check the role display section on both users' screens
2. **Expected Results**:
   - Current user's role has elevated background (#1a1a1a)
   - Current user's role has primary text color (white)
   - Other role has surface background (#111111)
   - Other role has secondary text color (gray)
   - "(You)" indicator is in accent green (#4a7c59)
   - Borders are subtle (#222222)
   - No gradients or shadows (Architectural Noir compliance)

#### Step 5: Verify Functional Behavior
1. User B (Guesser) clicks letter buttons to guess
2. User A (Setter) attempts to click letter buttons
3. **Expected Results**:
   - User B can successfully guess letters
   - User A cannot interact with letter buttons (they should not be visible to setter)
   - Only the guesser sees the keyboard interface

### Visual Reference

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  [Word Setter: Alice]  [Word Guesser: Bob (You)]      │
│   ↑ normal style        ↑ highlighted style            │
│                                                         │
│              ┌───┐                                      │
│              │   O                                      │
│              │  /|\                                     │
│              │  / \                                     │
│            ──┴──                                        │
│                                                         │
│              J A V A _ _ _ _ _ _                       │
│                                                         │
│  [A] [B] [C] [D] [E] [F] [G] [H] [I] [J] ...          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Success Criteria

✅ Both roles are clearly labeled
✅ Player names are displayed correctly
✅ Current user's role is visually highlighted
✅ "(You)" indicator appears only for current user
✅ Styling follows Architectural Noir design system
✅ Only guesser can interact with the game interface

### Known Limitations

- Spectators (3rd user joining) will see both roles but no "(You)" indicator
- If roles map is missing from backend, component falls back to setter/guesser fields
