# 🌐 SocialSphere — Social Network Platform

> A full-stack social networking platform built with Next.js 15, TypeScript, PostgreSQL, and Socket.IO

---

## 📅 Day 1 — Foundation Setup

**Date:** Day 1 of 10  
**Status:** ✅ Complete

### What was accomplished today

- Initialized Next.js 15 project with TypeScript and Tailwind CSS
- Designed and wrote the full Prisma schema (all 10+ models)
- Set up PostgreSQL database connection
- Created project folder structure
- Added environment variable configuration
- Set up global layout and base UI tokens
- Configured `.gitignore` with staged-commit strategy
- Created reusable UI primitives (Button, Input, Avatar)

### Commit History (Day 1)

```
git commit -m "chore: initial project setup with Next.js 15 + TypeScript"
git commit -m "feat: add Prisma schema with all core models"
git commit -m "feat: add Tailwind config with custom design tokens"
git commit -m "feat: create reusable layout components"
git commit -m "chore: add .env.example and environment setup"
git commit -m "docs: add README with project overview"
```

### Files Created Today

```
package.json
next.config.ts
tailwind.config.ts
tsconfig.json
.gitignore
.env.example
prisma/schema.prisma
src/app/layout.tsx
src/app/globals.css
src/app/page.tsx
src/lib/db.ts
src/lib/utils.ts
src/components/ui/Button.tsx
src/components/ui/Input.tsx
src/components/ui/Avatar.tsx
src/components/layout/Navbar.tsx
src/types/index.ts
```

### 📋 Day 2 Plan

- Implement JWT authentication system
- Build login and signup pages
- Create auth API routes (register, login, logout, refresh)
- Add auth middleware for protected routes
- Secure cookie handling

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 + TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT + HTTP-only cookies |
| Real-time | Socket.IO |
| File Upload | Cloudinary |
| State | Zustand |
| Validation | Zod |
