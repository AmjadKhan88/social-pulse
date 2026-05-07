# 🌐 SocialSphere — Full-Stack Social Network Platform

> A production-ready social networking platform built as a 10-day internship submission.
> Next.js 15 · TypeScript · PostgreSQL · Prisma · Socket.IO · Cloudinary · Zustand · Zod

---

## 📅 Development Timeline

| Day | Focus | Key Deliverables |
|-----|-------|-----------------|
| 1   | Foundation | Prisma schema, Tailwind tokens, base UI components |
| 2   | Auth | JWT + HTTP-only cookies, login/register UI, auth store |
| 3   | Profiles | User profile page, avatar/cover upload, edit modal |
| 4   | Posts | Feed, create/edit/delete posts, media grid |
| 5   | Interactions | Comments (nested), likes, emoji reactions |
| 6   | Friends | Send/accept/reject requests, unfriend, suggestions |
| 7   | Real-time | Socket.IO server, live notifications, online presence |
| 8   | Notifications | Bell UI, notification store, mark-as-read |
| 9   | Privacy | Profile/post/email visibility, online status toggle |
| 10  | Polish | Main layout, feed page, search, infinite scroll |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- A [Cloudinary](https://cloudinary.com) account (free tier works)

### 1 — Clone & install

```bash
git clone https://github.com/your-username/social-network-platform
cd social-network-platform/final-project
npm install
```

### 2 — Environment setup

```bash
cp .env.example .env
# Edit .env with your values
```

### 3 — Database setup

```bash
# Run migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Seed with demo data (10 users + posts + friendships)
npm run db:seed
```

### 4 — Start development

```bash
# Terminal 1 — Next.js app
npm run dev

# Terminal 2 — Socket.IO server
npm run socket:dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo login
```
Email:    alex@example.com
Password: Password123
```

---

## 🏗️ Project Structure

```
final-project/
├── prisma/
│   ├── schema.prisma          # Full DB schema (10+ models)
│   └── seed.ts                # Demo data (10 users, posts, friends)
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login, Register pages
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (main)/            # Authenticated pages
│   │   │   ├── feed/
│   │   │   ├── profile/[id]/
│   │   │   ├── friends/
│   │   │   ├── notifications/
│   │   │   ├── search/
│   │   │   └── settings/privacy/
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # register, login, logout, refresh
│   │   │   ├── posts/         # CRUD + [id]/comments + [id]/likes
│   │   │   ├── users/         # [id] profile + [id]/privacy
│   │   │   ├── friends/       # list, request/[id], [id] unfriend
│   │   │   ├── notifications/ # list, mark read
│   │   │   ├── search/        # full-text search
│   │   │   └── upload/        # Cloudinary upload
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                # Button, Input, Avatar, Textarea
│   │   ├── layout/            # MainLayout, Navbar
│   │   ├── posts/             # PostCard, CreatePost, CommentSection
│   │   ├── profile/           # EditProfileModal
│   │   ├── friends/           # FriendSuggestions
│   │   └── notifications/     # NotificationBell
│   ├── hooks/
│   │   └── useSocket.ts       # Socket.IO client hook
│   ├── lib/
│   │   ├── auth.ts            # JWT, bcrypt, cookie helpers
│   │   ├── db.ts              # Prisma singleton
│   │   ├── utils.ts           # Shared utilities
│   │   └── validations.ts     # Zod schemas
│   ├── server/
│   │   └── socket.ts          # Socket.IO server
│   ├── store/
│   │   ├── auth.store.ts      # Zustand auth state
│   │   └── notification.store.ts
│   └── types/
│       └── index.ts           # TypeScript types
├── public/
├── .env.example
├── middleware.ts              # Route protection
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## ✨ Features

### 🔐 Authentication
- Secure signup with email + username uniqueness validation
- Login by email or username
- JWT access tokens (15m) + refresh tokens (7d) with rotation
- HTTP-only cookies — no XSS risk
- Automatic token refresh via middleware
- Logout invalidates DB token

### 👤 Profiles
- Avatar + cover photo upload via Cloudinary
- Bio, display name, username editing
- Friend count, post count stats
- Profile tabs: Posts / Friends / Photos
- Verified badge system
- Online status indicator

### 📝 Posts
- Text, image, video posts (up to 4 media per post)
- Edit history tracking (`isEdited` flag)
- Audience control: Public / Friends / Only Me
- Rich media grid (1–4 images with overflow counter)
- Inline edit (no page reload)

### 💬 Comments
- Flat + nested comments (1 level deep)
- Comment likes
- Real-time updates via Socket.IO
- Edit + delete own comments

### ❤️ Reactions
- 6-reaction system: Like, Love, Haha, Wow, Sad, Angry
- Hover-to-reveal reaction picker
- Optimistic updates for instant feedback

### 👥 Friends
- Send / cancel / accept / reject requests
- Unfriend
- Mutual friend detection (auto-accept on reverse request)
- Friend suggestions (friends-of-friends algorithm)
- Block system (prevents interaction)

### 🔔 Notifications
- Real-time push via Socket.IO
- Types: like, comment, friend request, friend accept, reaction, mention, system
- Unread count badge
- Mark all / mark one as read
- Dropdown panel + full notifications page

### 🔒 Privacy
- Profile visibility: Public / Friends Only / Private
- Post default audience
- Who can send friend requests
- Email visibility settings
- Online status toggle

### 🔄 Real-time (Socket.IO)
- Live notifications pushed to user
- Online/offline presence broadcast to friends
- Live comment updates in post rooms
- Typing indicators

### 🔍 Search
- Full-text search across users and posts
- Tabbed results (All / People / Posts)
- Debounced live search
- URL-synced search state

---

## 🔌 API Reference

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Create account | ❌ |
| POST | `/api/auth/login` | Login | ❌ |
| POST | `/api/auth/logout` | Logout + clear cookies | ✅ |
| POST | `/api/auth/refresh` | Rotate tokens | ❌ |

### Users

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users/:id` | Get profile + friendship status | Optional |
| PATCH | `/api/users/:id` | Update profile | ✅ Own |
| GET | `/api/users/:id/privacy` | Get privacy settings | ✅ Own |
| PATCH | `/api/users/:id/privacy` | Update privacy settings | ✅ Own |

### Posts

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/posts` | Get feed (paginated, cursor-based) | Optional |
| POST | `/api/posts` | Create post | ✅ |
| GET | `/api/posts/:id` | Get single post | Optional |
| PATCH | `/api/posts/:id` | Edit post | ✅ Own |
| DELETE | `/api/posts/:id` | Delete post | ✅ Own |
| GET | `/api/posts/:id/comments` | Get comments (paginated) | Optional |
| POST | `/api/posts/:id/comments` | Add comment | ✅ |
| POST | `/api/posts/:id/likes` | Like / react to post | ✅ |
| DELETE | `/api/posts/:id/likes` | Unlike post | ✅ |

### Friends

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/friends` | List friends / requests / suggestions | ✅ |
| POST | `/api/friends/request/:id` | Send friend request | ✅ |
| DELETE | `/api/friends/request/:id` | Cancel friend request | ✅ |
| POST | `/api/friends/request/:id/accept` | Accept request | ✅ |
| DELETE | `/api/friends/:id` | Unfriend | ✅ |

### Notifications

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/notifications` | List notifications | ✅ |
| PATCH | `/api/notifications` | Mark all as read | ✅ |

### Search & Upload

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/search` | Search users + posts | Optional |
| POST | `/api/upload` | Upload media to Cloudinary | ✅ |

---

## 🌐 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `JWT_ACCESS_SECRET` | ✅ | Secret for access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | ✅ | Secret for refresh tokens (min 32 chars) |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✅ | Cloudinary API secret |
| `NEXT_PUBLIC_APP_URL` | ✅ | App base URL |
| `NEXT_PUBLIC_SOCKET_URL` | ✅ | Socket.IO server URL |
| `SOCKET_PORT` | ❌ | Socket server port (default: 3001) |
| `MAX_UPLOAD_SIZE_MB` | ❌ | Max upload size in MB (default: 10) |

---

## 🚢 Deployment

### Vercel (Frontend + API)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Set environment variables in the Vercel dashboard.

> **Note:** Socket.IO must run on a separate server (Railway, Fly.io, Render).

### Railway (Socket.IO Server)

```bash
# railway.toml
[build]
  command = "npm install"

[deploy]
  startCommand = "tsx src/server/socket.ts"
```

### Database (MongoDB Atlas / Local MongoDB / Railway)

```bash
# After setting MONGODB_URI:
npm run db:seed
```

---

## 🧪 Testing

```bash
# Type checking
npm run typecheck

# Lint
npm run lint

# Manual API testing
# Import the Postman collection from /docs/postman_collection.json

# Test auth flow
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"alex@example.com","password":"Password123"}'
```

---

## 📈 GitHub Commit Strategy

Each day follows this pattern:

```bash
# Day N, commit 1 — Remove gitignore entry
git add .gitignore && git commit -m "chore: unlock day-N folder for tracking"

# Day N, commits 2-5 — Feature commits
git commit -m "feat: add [feature]"
git commit -m "feat: implement [component]"
git commit -m "fix: handle [edge case]"
git commit -m "style: polish [UI element]"

# Day N, commit 6 — Documentation
git commit -m "docs: update README with day-N progress"
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/amazing-feature`
3. Commit with conventional commits: `git commit -m "feat: add amazing feature"`
4. Push and open a PR

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

*Built with ❤️ over 10 days as an internship project submission.*
