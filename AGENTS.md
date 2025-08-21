# AGENTS.md - Coding Agent Guidelines

## Build/Test/Lint Commands
- `npm run dev` - Start development server with turbopack
- `npm run build` - Build for production (includes prisma generate)
- `npm run lint` - Run Next.js linter
- `npm run db:push` - Push Prisma schema to database
- `npm run db:reset` - Reset database with force
- **No test framework configured** - Consider using Jest/Vitest for testing

## Code Style Guidelines
- **TypeScript**: Strict mode enabled, use proper typing
- **Imports**: Use `@/*` path alias for project files, organize imports with external libs first
- **Components**: Export default functions, use PascalCase for component names
- **Props**: Define TypeScript interfaces for component props (e.g., `AuthProviderProps`)
- **Client components**: Mark with `"use client"` directive at top when needed
- **API routes**: Use Next.js 14+ App Router pattern in `app/api/`
- **Error handling**: Use try-catch blocks, return NextResponse.json with status codes
- **Database**: Use Prisma client (`@/lib/prisma`), include proper select fields
- **Security**: Hash passwords with bcryptjs (12 rounds), validate inputs
- **Styling**: Tailwind CSS with modern utilities, prefer rounded-xl over rounded
- **State**: Use useState for local state, prefer controlled components
- **Console logs**: Debug logs acceptable for auth flows (use emoji prefixes)