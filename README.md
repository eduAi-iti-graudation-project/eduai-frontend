<div align="center">

<img src="https://img.shields.io/badge/EduAI-Frontend-1F9D7C?style=for-the-badge&logoColor=white" height="36"/>

# eduai-frontend

### React + Vite client application for the EduAI platform

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-latest-000000?style=flat-square)](https://ui.shadcn.com)

[Getting Started](#-getting-started) · [Project Structure](#-project-structure) · [Pages](#-pages--routes) · [Tech Stack](#-tech-stack) · [Scripts](#-scripts) · [Contributing](#-contributing)

</div>

---

## 📋 Overview

This repository contains the frontend client for **EduAI** — an AI-assisted grading and classroom management platform. It serves two user roles:

- **Teachers** — Build rubrics, review AI-suggested grades, confirm them, and get early alerts on struggling students
- **Students** — Submit assignments and view confirmed grades and feedback

This is a **desktop web application** — there is no mobile app in scope. The frontend communicates with [`eduai-backend`](https://github.com/your-org/eduai-backend) exclusively via REST API; it never talks to the database, Supabase, or any LLM API directly.

---

## ⚡ Getting Started

### Prerequisites

| Tool | Version | Download |
|---|---|---|
| Node.js | v20 LTS | [nodejs.org](https://nodejs.org) |
| npm | v10+ | ships with Node |
| Git | latest | [git-scm.com](https://git-scm.com) |

> The backend must be reachable for API calls to work — either running locally
> (see [`eduai-backend`](https://github.com/your-org/eduai-backend)) or the
> deployed Render URL. This repo has no Docker setup of its own; Docker is
> only used on the backend side, for the local Postgres+pgvector database.

---

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/your-org/eduai-frontend.git
cd eduai-frontend
```

**2. Install dependencies**

```bash
npm install
```

**3. Set up environment variables**

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in the values:

```bash
# API
VITE_API_URL=http://localhost:3000

# App
VITE_APP_ENV=development
```

**4. Sync API types from the backend** (see [API Contract](#-api-contract) below)

```bash
npm run sync:api-types
```

**5. Start the development server**

```bash
npm run dev
```

The app will be available at **http://localhost:5173**

---

## 📁 Project Structure

```
eduai-frontend/
│
├── public/                         # Static assets (favicon, fonts)
│
├── src/
│   │
│   ├── components/
│   │   ├── ui/                     # shadcn/ui auto-generated — NEVER edit manually
│   │   └── layout/
│   │       ├── AppShell.tsx        # Authenticated layout (nav/sidebar)
│   │       ├── Sidebar.tsx         # Role-aware navigation
│   │       └── Topbar.tsx
│   │
│   ├── pages/                      # Route-level page components
│   │   ├── public/
│   │   │   └── LoginPage.tsx
│   │   ├── teacher/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── RubricBuilderPage.tsx
│   │   │   ├── SubmissionsQueuePage.tsx
│   │   │   ├── GradingReviewPage.tsx
│   │   │   ├── AlertsPage.tsx
│   │   │   └── AssistantChatPage.tsx
│   │   ├── student/
│   │   │   └── StudentPortalPage.tsx
│   │   └── utility/
│   │       ├── NotFoundPage.tsx
│   │       └── UnauthorizedPage.tsx
│   │
│   ├── routes/
│   │   ├── index.tsx                # Root router config
│   │   ├── TeacherRoutes.tsx        # Protected teacher routes
│   │   └── StudentRoutes.tsx        # Protected student routes
│   │
│   ├── hooks/                       # Shared custom hooks (useAuth, etc.)
│   │
│   ├── lib/
│   │   ├── api.ts                   # Typed API client — all backend calls go through here
│   │   ├── queryClient.ts           # TanStack Query client config
│   │   └── utils.ts                 # cn() and shared utilities
│   │
│   ├── types/
│   │   └── api-schema.ts            # GENERATED — do not hand-edit, see API Contract
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                    # Tailwind directives + design tokens
│
├── .claude/skills/design-system/    # Neubrutalist design tokens (auto-loaded by agent)
├── AGENTS.md                        # Canonical agent instructions (cross-tool)
├── CLAUDE.md                        # Imports AGENTS.md for Claude Code
├── specs.md                         # Full product/architecture spec
├── frontend-specs.md                # This repo's conventions
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── components.json                  # shadcn/ui config
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

## 🗺️ Pages & Routes

### 🔓 Public — No Auth Required

| Page | File | Route |
|---|---|---|
| Login / Signup | `pages/public/LoginPage.tsx` | `/login` |

Role (teacher/student) is determined after login, not chosen on this page.

---

### 👩‍🏫 Teacher — Role: `TEACHER`

| Page | File | Route |
|---|---|---|
| Dashboard | `pages/teacher/DashboardPage.tsx` | `/teacher/dashboard` |
| Rubric Builder | `pages/teacher/RubricBuilderPage.tsx` | `/teacher/assignments/:assignmentId/rubric` |
| Submissions Queue | `pages/teacher/SubmissionsQueuePage.tsx` | `/teacher/assignments/:assignmentId/submissions` |
| Grading Review | `pages/teacher/GradingReviewPage.tsx` | `/teacher/submissions/:submissionId/review` |
| Student Performance & Alerts | `pages/teacher/AlertsPage.tsx` | `/teacher/classes/:classId/alerts` |
| Assistant Chat Panel | `pages/teacher/AssistantChatPage.tsx` | `/teacher/assistant` |

---

### 🎓 Student — Role: `STUDENT`

| Page | File | Route |
|---|---|---|
| Student Portal (assignments, submission, confirmed grades) | `pages/student/StudentPortalPage.tsx` | `/student/dashboard` |

Students only ever see **confirmed** grades and feedback — an unconfirmed AI suggestion must never reach this page, enforced by the API response shape, not by frontend filtering.

---

### ⚠️ Utility

| Page | File | Route |
|---|---|---|
| 404 Not Found | `pages/utility/NotFoundPage.tsx` | `*` |
| 403 Unauthorized | `pages/utility/UnauthorizedPage.tsx` | `/403` |

---

## 🛠️ Tech Stack

### Core

| Library | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tool & dev server |

### Routing & Data

| Library | Version | Purpose |
|---|---|---|
| React Router | v6 | Client-side routing |
| TanStack Query | v5 | Server state, caching, background sync — **all** API calls go through this, never manual `fetch` + `useEffect` |

### UI & Styling

| Library | Version | Purpose |
|---|---|---|
| shadcn/ui | latest | Component primitives (Radix UI based) — always restyled to match the neubrutalist tokens, never left with default styling |
| Tailwind CSS | v3 | Utility-first styling |
| Lucide React | latest | Icon system |

### Forms & Validation

| Library | Version | Purpose |
|---|---|---|
| React Hook Form | v7 | Form management |
| Zod | v3 | Schema validation — shared with backend schemas where the shape overlaps |
| @hookform/resolvers | v3 | Zod ↔ React Hook Form bridge |

### Data Display

| Library | Version | Purpose |
|---|---|---|
| Recharts | v2 | Student performance trend charts |

### API Contract

| Tool | Purpose |
|---|---|
| openapi-typescript | Generates `src/types/api-schema.ts` from the backend's live OpenAPI document — see below |

---

## 📜 Scripts

```bash
# Start development server (http://localhost:5173)
npm run dev

# Pull the latest API types from the backend
npm run sync:api-types

# Type-check without building
npm run type-check

# Lint all files
npm run lint

# Lint and auto-fix
npm run lint:fix

# Format with Prettier
npm run format

# Production build
npm run build

# Preview production build locally
npm run preview
```

---

## 🔌 API Contract

The backend is the single source of truth for the API shape — this repo never
hand-maintains a list of endpoints. Whenever the backend's DTOs change, run:

```bash
npm run sync:api-types
# equivalent to:
# npx openapi-typescript $VITE_API_URL/api-json -o src/types/api-schema.ts
```

This pulls a live OpenAPI document from the running backend and generates
real TypeScript types from it. `src/lib/api.ts` imports from the generated
file and exposes typed functions per resource — components call these, never
raw `fetch()` with hand-typed shapes. Run this before starting any task that
adds or touches an API call, not after debugging a mismatch.

---

## 🎨 Design System

The UI follows a **neubrutalist** system: solid black borders, hard offset shadows (no blur, ever), flat saturated colors, no gradients. Full reference lives in [`.claude/skills/design-system/SKILL.md`](.claude/skills/design-system/SKILL.md) — read that before styling any component.

### Color Tokens

```css
--brand-blue:   #4361EE  /* informational / neutral / primary buttons */
--brand-yellow: #FFC857  /* pending / attention */
--brand-green:  #1F9D7C  /* confirmed / good */
--brand-coral:  #FF6B5D  /* flagged / at-risk / destructive actions */
--brand-ink:    #23305A  /* headings, primary text */
```

### Signature Component Rules

- Every card/button/input/tag: `border-2 border-black`
- Every card/button shadow: `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` — **never** a soft/blurred shadow
- Corners: `rounded-lg` (~8px) — not sharp, not pill-shaped
- Buttons "press" their shadow in on hover (see the design-system skill for the exact class)

### Adding shadcn Components

```bash
npx shadcn@latest add [component-name]
```

> ⚠️ Never manually edit files inside `src/components/ui/` — they are managed by the shadcn CLI. Always restyle with the tokens above after adding one; shadcn's default styling does not match this system.

---

## 🔐 Auth & Route Guards

Auth is handled by Supabase Auth. Routes are protected by role-based guards in `src/routes/`:

```
/teacher/* → requires auth + role === "TEACHER"
/student/* → requires auth + role === "STUDENT"
```

Unauthenticated users are redirected to `/login`.
Wrong-role users are redirected to `/403`.

---

## 🌐 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ | Backend REST API base URL |
| `VITE_APP_ENV` | ❌ | `development` \| `staging` \| `production` |

> All env variables must be prefixed with `VITE_` to be accessible in the browser.

---

## 📐 Code Conventions

### File Naming
```
PascalCase   → components, pages  (DashboardPage.tsx)
camelCase    → hooks, utilities    (useGradingQuery.ts)
kebab-case   → config files        (tailwind.config.ts)
```

### Import Order
```ts
// 1. React
import { useState, useEffect } from "react"

// 2. Third-party libraries
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"

// 3. Internal absolute imports (@/)
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// 4. Relative imports
import { SubmissionCard } from "./SubmissionCard"
```

### Component Structure
```tsx
interface SubmissionCardProps {
  submission: Submission
  isLoading: boolean
}

export function SubmissionCard({ submission, isLoading }: SubmissionCardProps) {
  const navigate = useNavigate()

  const isPending = submission.status === "PENDING"

  function handleClick() {
    navigate(`/teacher/submissions/${submission.id}/review`)
  }

  return (
    <div
      className={cn(
        "border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
        isPending && "bg-brand-yellow"
      )}
      onClick={handleClick}
    >
      ...
    </div>
  )
}

export default SubmissionCard
```

---

## 🤝 Contributing

Feature branches target **`dev`**, not `main`. Both branches are protected (PR + 1 review + passing CI required, no force-push).

### Branch Naming

```
feature/[feature-name]     → new page or feature
fix/[bug-description]      → bug fixes
chore/[task-description]   → config, deps, tooling
design/[page-name]         → design implementation from Stitch
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org):

```
feat(grading): add rubric citation display on review screen
fix(alerts): resolve trend chart rendering for single confirmed grade
chore(deps): sync generated API types after backend DTO change
design(dashboard): implement teacher dashboard per neubrutalist tokens
```

### Pull Request Checklist

Before opening a PR into `dev`, confirm:

- [ ] `npm run type-check` passes with no errors
- [ ] `npm run lint` passes with no warnings
- [ ] `npm run sync:api-types` was re-run if the backend's API changed
- [ ] Neubrutalist tokens applied — no default shadcn styling left unstyled
- [ ] Students never see an unconfirmed AI suggestion anywhere in the diff
- [ ] Responsive behavior verified at 1440px (primary) and tablet width
- [ ] No `console.log` statements in the code
- [ ] No `any` types without an explanatory comment

---

## 👥 Team

| Name | GitHub |
|---|---|
| Abdallah Ehab Wageeh | [@Abdallah-Ehab](https://github.com/Abdallah-Ehab) |
| Eyad Emad Hamdy Sharara | [@eyademad1](https://github.com/eyademad1) |
| Alaa Anwar Abo Elazm | [@Alaa-Anwer](https://github.com/Alaa-Anwer) |
| Ahmed Sameh Mohamed | [@REPLACE_ME](https://github.com) |
| Ahmed Adel Selim | [@AhmedAdelSelim01](https://github.com/AhmedAdelSelim01) |

---

## 🔗 Related Repositories

| Repository | Description |
|---|---|
| [`eduai-backend`](https://github.com/your-org/eduai-backend) | NestJS REST API, Prisma, grading/analysis/assistant agents |

---

<div align="center">

Part of the **EduAI** platform · Built with ❤️

</div>