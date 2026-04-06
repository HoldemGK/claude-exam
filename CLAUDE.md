# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start dev server with Turbopack
npm run dev:daemon   # Start dev server in background (logs to logs.txt)

# Build & Production
npm run build
npm run start

# Linting & Testing
npm run lint         # ESLint via next lint
npm run test         # Vitest

# Database
npm run setup        # Install deps + Prisma generate + migrate
npm run db:reset     # Reset SQLite database
```

Run a single test file: `npx vitest run src/lib/__tests__/your-file.test.ts`

## Architecture

**UIGen** is an AI-powered React component generator with live preview, built on Next.js 15 (App Router) + React 19.

### Request Flow

1. User types in chat → `ChatInterface` → `ChatContext` (via `useAIChat` from `@ai-sdk/react`) → `POST /api/chat`
2. `/api/chat/route.ts` prepends the system prompt (with prompt caching), sends messages + current VirtualFileSystem state to Claude (`claude-haiku-4-5`)
3. Claude uses tool calls (`str_replace_editor`, `file_manager`) to create/modify files
4. Tool call results stream back; `FileSystemContext.onToolCall` updates the in-memory VirtualFileSystem
5. `PreviewFrame` transpiles JSX→JS via `@babel/standalone` and renders in an iframe using an import map (resolves local imports + CDN packages via esm.sh)

### Key Abstractions

**VirtualFileSystem** (`src/lib/file-system.ts`): All files live in-memory (no disk writes). Serializable to JSON for DB persistence. The FileSystemContext (`src/lib/contexts/file-system-context.tsx`) wraps this and exposes it to the component tree.

**AI Provider** (`src/lib/provider.ts`): Returns the Anthropic provider if `ANTHROPIC_API_KEY` is set, otherwise falls back to `MockLanguageModel` for development.

**AI Tools** (`src/lib/tools/`): `str-replace.ts` handles fine-grained file edits; `file-manager.ts` handles create/rename/delete. Both operate on the VirtualFileSystem passed in the request body.

**JSX Transformer** (`src/lib/transform/jsx-transformer.ts`): Babel-based in-browser transpilation used by PreviewFrame to turn JSX into runnable JS.

**Authentication** (`src/lib/auth.ts`, `src/actions/`): JWT sessions (7-day) stored in httpOnly cookies. Server Actions handle signUp/signIn/signOut. Anonymous users can use the app without auth (work is not persisted).

### Layout

`main-content.tsx` renders a three-panel layout (Chat | Preview/Code) using `react-resizable-panels`. Right panel toggles between live PreviewFrame and Monaco-based CodeEditor + FileTree.

### Database

The database schema is defined in the @prisma/schema.prisma file. Reference it anytime you need to understand the structure of data stored in the database.

### Path Alias

`@/*` maps to `./src/*` (configured in `tsconfig.json`).

### Environment

Requires `ANTHROPIC_API_KEY` in `.env` for real AI responses. Without it, the app uses the mock provider.
