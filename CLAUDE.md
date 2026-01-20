# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MoonTV is an open-source video aggregation player built with Next.js 14, TypeScript, and Tailwind CSS. It aggregates video content from multiple sources and provides a unified interface for searching, browsing, and watching videos. The project supports both local storage and Redis-based persistent storage for user data.

## Development Commands

- `pnpm dev` - Start development server (generates runtime config first)
- `pnpm build` - Build for production (generates runtime config first)
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Run ESLint with auto-fix and format
- `pnpm lint:strict` - Run ESLint with max warnings = 0
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm test` - Run Jest tests
- `pnpm test:watch` - Run Jest in watch mode
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting
- `pnpm gen:runtime` - Generate runtime config from config.json
- `pnpm pages:build` - Build for Cloudflare Pages

## Architecture

### Core Structure

- **Next.js 14 App Router**: Uses the new app directory structure
- **TypeScript**: Strict typing throughout the application
- **Tailwind CSS**: Utility-first CSS framework
- **Video Player**: Uses VidStack and HLS.js for video playback
- **Storage**: Supports both localStorage and Redis for data persistence

### Key Directories

- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - Reusable React components
- `src/lib/` - Core business logic, utilities, and types
- `src/styles/` - Global styles and theme definitions
- `scripts/` - Build and configuration scripts
- `public/` - Static assets and PWA manifest

### Configuration System

The project uses a unique configuration system:

1. **config.json** - Main configuration file defining video sources and settings
2. **scripts/convert-config.js** - Converts config.json to TypeScript runtime config
3. **src/lib/runtime.ts** - Auto-generated TypeScript config (DO NOT EDIT MANUALLY)

Always run `pnpm gen:runtime` after modifying config.json to regenerate the runtime config.

### Storage Architecture

Two storage modes are supported:

1. **localStorage** - Browser-based storage for single-user deployments
2. **Redis** - Server-side storage for multi-user deployments with user accounts

Storage type is controlled by `NEXT_PUBLIC_STORAGE_TYPE` environment variable.

### API Route Structure

- `/api/search/` - Video search endpoints
- `/api/detail/` - Video detail fetching
- `/api/admin/` - Admin panel APIs (Redis mode only)
- `/api/favorites/` - User favorites management
- `/api/playrecords/` - Viewing history management

### Component Architecture

- **Responsive Design**: Mobile-first approach with desktop sidebar and mobile bottom navigation
- **Theme System**: Dark/light mode support via next-themes
- **PWA Support**: Service worker and manifest for offline capability
- **Video Player**: Integrated VidStack player with HLS support

## Important Development Notes

### Configuration Management

- The `config.json` file defines all video source APIs
- After modifying `config.json`, always run `pnpm gen:runtime`
- The generated `src/lib/runtime.ts` should never be edited manually
- Video sources must follow Apple CMS V10 API format

### Environment Variables

Key environment variables for development:

- `NEXT_PUBLIC_STORAGE_TYPE` - Storage backend (localstorage/redis)
- `REDIS_URL` - Redis connection string (required for Redis mode)
- `PASSWORD` - Admin password for single-user mode
- `USERNAME` - Admin username for Redis mode
- `NEXT_PUBLIC_ENABLE_REGISTER` - Enable user registration (Redis mode)

### Testing

- Jest is configured for unit testing
- Tests are located alongside source files or in `__tests__` directories
- Run tests with `pnpm test` or `pnpm test:watch`

### Code Quality

- ESLint with Next.js, TypeScript, and Prettier configurations
- Husky pre-commit hooks for code quality
- Commitlint for conventional commit messages
- Strict TypeScript configuration

### Video Source Integration

When adding new video sources:

1. Add the source configuration to `config.json`
2. Run `pnpm gen:runtime` to update the runtime config
3. Ensure the API follows Apple CMS V10 format
4. Test the integration thoroughly

### Deployment Considerations

- Vercel deployment: Zero-config, automatic builds on push
- Docker deployment: Multi-stage builds with optimized images
- Cloudflare Pages: Uses `pnpm pages:build` command
- All deployments support environment variable configuration

## Code Style Guidelines

### Naming Conventions

- **Components**: PascalCase (e.g., `VideoCard`, `EpisodeSelector`)
- **Hooks**: camelCase with `use` prefix (e.g., `useLocalStorage`)
- **Utils/Constants**: camelCase (e.g., `cleanHtmlTags`, `generateStorageKey`)
- **Files**: kebab-case for non-component files (e.g., `db.client.ts`)
- **API Routes**: kebab-case (e.g., `search/route.ts`, `playrecords/route.ts`)

### Component Patterns

- Use `'use client'` for client-side components
- Use `export default function` for page components
- Keep components focused - extract logic to custom hooks when >150 lines
- Use TypeScript interfaces for props (not inline types)

### API Response Patterns

- Always return `{ data, error, message }` structure for consistency
- Use `NextResponse.json()` for API routes
- Handle errors with try/catch and proper error messages

### CSS/Tailwind

- Use `dark:` prefix for dark mode styles
- Use `sm:`, `md:`, `lg:`, `xl:` for responsive breakpoints
- Use semantic colors (e.g., `text-green-500` for primary actions)

### Git Commit Messages

Follow conventional commits:

- `feat: add new video source`
- `fix: resolve playback progress bug`
- `refactor: extract common fetch logic`
- `docs: update API documentation`
