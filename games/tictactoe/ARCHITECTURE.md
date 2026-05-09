# Architecture Guide

This document describes the professional code structure and organization of the Tic-Tac-Toe project.

## Project Layout

```
tictactoe/
│
├── public/                 # Static assets
│   └── (favicon, etc.)
│
├── src/
│   ├── components/         # Reusable React components
│   │   ├── Cell/
│   │   │   ├── Cell.tsx               # Cell component
│   │   │   ├── Cell.module.css        # Component-scoped styles
│   │   │   └── index.ts               # Public interface
│   │   │
│   │   ├── TicTacToe/
│   │   │   ├── TicTacToe.tsx          # Main game component
│   │   │   ├── TicTacToe.css          # Game styles
│   │   │   └── index.ts               # Public interface
│   │   │
│   │   └── index.ts                   # Component barrel export
│   │
│   ├── types/              # TypeScript type definitions
│   │   ├── game.ts         # Game-related interfaces
│   │   └── index.ts        # Type barrel export
│   │
│   ├── utils/              # Utility functions and helpers
│   │   └── gameLogic.ts    # Pure game logic functions
│   │
│   ├── App.tsx             # Root application component
│   ├── App.css             # Global app styles
│   ├── index.css           # Global reset and base styles
│   └── main.tsx            # React entry point
│
├── index.html              # HTML template
├── package.json            # Project dependencies
├── tsconfig.json           # TypeScript configuration
├── tsconfig.node.json      # Build tool TS config
├── vite.config.ts          # Vite bundler configuration
├── .gitignore              # Git ignore rules
├── README.md               # Project documentation
└── ARCHITECTURE.md         # This file
```

## Design Principles

### 1. **Separation of Concerns**

- **Components**: UI and interaction logic
- **Types**: Data structures and interfaces
- **Utils**: Pure functions and business logic
- **Styles**: CSS organization by component

### 2. **Module Organization**

Each component has its own folder with:
- `.tsx` file - React component
- `.css` or `.module.css` - Component styles
- `index.ts` - Public interface (barrel export)

Example:
```typescript
// Importing from components
import { TicTacToe, Cell } from './components'

// Importing from types
import { GameState, Player } from './types'

// Importing from utils
import { checkWinner, getWinningCells } from './utils/gameLogic'
```

### 3. **Type Safety**

All types are centralized in `src/types/game.ts`:
- Game state interfaces
- Type aliases
- Player information

### 4. **Pure Functions**

Game logic is extracted to `src/utils/gameLogic.ts`:
- `checkWinner()` - Determines game winner
- `getWinningCells()` - Gets winning line positions
- `initialState()` - Creates initial game state
- `PLAYERS` - Player configuration

This makes logic:
- Testable
- Reusable
- Easy to maintain

### 5. **Component Hierarchy**

```
<App>
  └── <TicTacToe>
      ├── Header
      ├── Players Info
      ├── Board
      │   └── <Cell> x9
      ├── Scores
      └── Footer (Buttons)
```

## File Naming Conventions

- **Components**: PascalCase (e.g., `TicTacToe.tsx`, `Cell.tsx`)
- **Utilities**: camelCase (e.g., `gameLogic.ts`)
- **Types**: descriptive names (e.g., `game.ts`)
- **Styles**: match component name (e.g., `TicTacToe.css`)

## Import Patterns

### Good ✅
```typescript
// Use barrel exports
import { TicTacToe, Cell } from './components'
import { GameState, Player } from './types'
import { checkWinner } from './utils/gameLogic'
```

### Avoid ❌
```typescript
// Don't import directly from nested files
import TicTacToe from './components/TicTacToe/TicTacToe'
import GameState from './types/game'
```

## Adding New Features

### Adding a New Component

1. Create folder: `src/components/NewComponent/`
2. Add files:
   ```
   NewComponent/
   ├── NewComponent.tsx
   ├── NewComponent.css
   └── index.ts
   ```
3. Export in `src/components/index.ts`
4. Use in your app

### Adding New Types

1. Add to `src/types/game.ts`
2. Export is automatic via `src/types/index.ts`

### Adding New Utilities

1. Create or update files in `src/utils/`
2. Export functions for reuse
3. Use in components

## Performance Considerations

- ✅ React hooks (`useState`, `useCallback`, `useEffect`)
- ✅ Memoization via `useCallback`
- ✅ Pure game logic functions
- ✅ Component-level state management

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Improvements

- [ ] Add unit tests for game logic
- [ ] Add component tests with React Testing Library
- [ ] Implement state persistence (localStorage)
- [ ] Add multiplayer support
- [ ] Create admin dashboard
- [ ] Add animation library (Framer Motion)

---

**Last Updated**: May 2026
