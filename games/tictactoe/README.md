# Tic-Tac-Toe

A modern, professional Tic-Tac-Toe game built with React, TypeScript, and Vite.

## Project Structure

```
src/
├── components/           # React components
│   ├── TicTacToe/       # Main game component
│   │   ├── TicTacToe.tsx
│   │   ├── TicTacToe.css
│   │   └── index.ts
│   ├── Cell/            # Individual cell component
│   │   ├── Cell.tsx
│   │   ├── Cell.module.css
│   │   └── index.ts
│   └── index.ts         # Component exports
├── types/               # TypeScript type definitions
│   ├── game.ts         # Game-related types
│   └── index.ts        # Type exports
├── utils/              # Utility functions
│   └── gameLogic.ts    # Game logic and helpers
├── App.tsx             # Main app wrapper
├── App.css             # Global app styles
├── main.tsx            # React entry point
└── index.css           # Global styles
public/                 # Static files
├── index.html          # HTML template
├── package.json        # Dependencies
├── vite.config.ts      # Vite configuration
└── tsconfig.json       # TypeScript configuration
```

## Features

- ✅ Two-player Tic-Tac-Toe game
- ✅ Score tracking across multiple rounds
- ✅ Alternating starting player
- ✅ Winning line highlighting
- ✅ Responsive dark theme
- ✅ Professional UI with accessibility support

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm build
```

The app will be available at `http://localhost:5173`

## Game Rules

- Players alternate turns placing X and O
- First to get 3 in a row (horizontal, vertical, or diagonal) wins
- If all cells are filled with no winner, it's a draw
- After each game, scores are tracked and players alternate who goes first

## Technology Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **CSS3** - Styling with modern features

## Code Organization

This project follows professional React patterns:

- **Separation of concerns**: Components, types, and utilities are separated
- **Modular CSS**: Component-scoped styling where applicable
- **Type safety**: Full TypeScript coverage
- **Reusable utilities**: Game logic extracted to utility functions
- **Index exports**: Barrel exports for clean imports

## Development

```bash
# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

Built with ❤️ for gaming enthusiasts
