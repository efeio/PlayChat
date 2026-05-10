# PlayChat

PlayChat is a full-stack real-time communication and gaming platform. It allows users to join rooms, chat with other participants, and play multiplayer games like Hangman, Tic-Tac-Toe, Connect Four, and Rock-Paper-Scissors in real time.

## 🚀 Architecture and Tech Stack

PlayChat adopts a multi-module monolithic repository structure, divided efficiently using npm workspaces:

- **Frontend:** React, TypeScript, React Router, Vite, and Tailwind CSS. The design strictly adheres to the unique "Architectural Noir" design system, characterized by sharp dark backgrounds (`#111111`), flat surfaces, white typography, lack of gradients/shadows, and strict `border-border` outlines.
- **Backend:** Node.js, Fastify, TypeScript, Prisma ORM (SQLite for local development), and Socket.IO for real-time WebSocket communication.
- **Testing:** Playwright for End-to-End (E2E) testing and Vitest/Testing Library for unit/integration tests.
- **Monorepo Management:** `npm workspaces` for efficient cross-module dependencies and script execution.

### Key Features
- **Real-time Chat:** Instant messaging using Socket.IO.
- **Room Management:** Create, join, and leave rooms. State recovery mechanism to ensure users stay connected to rooms and games upon page reloads.
- **Multiplayer Games:** Playfully integrated games managed by a scalable Backend Game Engine.
  - **Hangman:** Roles are automatically assigned (Word Setter vs. Word Guesser).
  - **Connect Four:** Classic interactive grid logic.
  - **Tic-Tac-Toe** and **Rock-Paper-Scissors**.

## 🛠 Prerequisites

Make sure you have the following installed on your local machine:
- Node.js (v18.x or later)
- npm (v9.x or later)

## 🔧 Installation & Setup

Follow these steps to run the PlayChat project on your local machine.

### 1. Clone the repository and install dependencies
Use `npm install` to install dependencies for both frontend and backend.

### 2. Configure Environment Variables
You need to set up the `.env` file for the backend. Copy `.env.example` to `.env` and set up the variables.

### 3. Initialize the Database
Run the following commands to generate the Prisma client and apply database migrations. Use `npm run db:generate` and `npm run db:migrate`.

## 🚀 Running the Application

You can start both the frontend and backend simultaneously using the concurrently script via `npm run dev` (remove dashes).
Alternatively, you can run them in separate terminal windows: `npm run dev:backend` and `npm run dev:frontend`.

## 🧪 Testing

The project uses `vitest` for unit tests and `playwright` for E2E frontend verification. Run tests via `npm run test` or `npm run test:e2e --workspace=frontend`.

## 📦 Building for Production

To compile both the frontend and backend for production, use `npm run build`.
Once built, you can start the backend server with `npm start`.
