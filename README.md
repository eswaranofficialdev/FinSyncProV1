# FinSync Pro — Enterprise Finance Management System

A MERN-stack finance management platform with role-based access (Super Admin / Admin / User), personal & community expense tracking, split-expense settlement, dashboards, and reporting.

This repo contains a **working, functional core** of the full spec: authentication & RBAC, transactions, community expense-splitting, dashboard analytics, reports, user management, notifications, and settings — built on production-grade patterns (JWT + refresh tokens, MVC architecture, input validation, rate limiting, etc.) so you can extend it toward the remaining nice-to-have items (Cloudinary receipts, budgets/goals UI, activity-log UI, PDF/Excel export, sockets for real-time notifications) without restructuring anything.

---

## 1. Project Structure

```
finsync-pro/
├── backend/                 # Node.js + Express + MongoDB API
│   ├── config/               # DB connection
│   ├── controllers/          # Route handlers (business logic)
│   ├── middlewares/          # auth, error handling, validation
│   ├── models/                # Mongoose schemas
│   ├── routes/                # Express routers
│   ├── validators/           # express-validator rules
│   ├── jobs/                  # seedSuperAdmin.js
│   ├── app.js                 # Express app assembly
│   ├── server.js               # Entry point
│   └── .env.example
└── frontend/                 # React 19 + Vite
    ├── src/
    │   ├── components/        # Sidebar, Navbar, StatCard, ChartCard, Modal
    │   ├── context/            # AuthContext, ThemeContext
    │   ├── layouts/             # DashboardLayout
    │   ├── pages/                # Login, Register, Dashboard, Transactions, Community, Users, Reports, Notifications, Settings, Profile
    │   ├── routes/               # ProtectedRoute
    │   ├── services/             # api.js (axios + auto-refresh)
    │   ├── styles/                # variables.css (design tokens), global.css
    │   └── App.jsx / main.jsx
    └── .env.example
```

## 2. Roles & Permissions (as implemented)

There are two **platform-level** roles, and three **community-level** roles that only apply inside a specific community.

### Platform roles
| Capability | Super Admin | User |
|---|---|---|
| Registers via public form | ❌ (seeded once) | ✅ (active immediately) |
| Creates/joins communities | ✅ | ✅ |
| Suspends/activates/deletes any user | ✅ | ❌ |
| Views/deletes any community (oversight) | ✅ | only own communities |
| **Views another user's personal transactions** | ❌ — never | ❌ — never |

Personal transactions are private to their owner, full stop. No role — including Super Admin — can list, view, edit, or delete another user's personal transactions or personal dashboard. This is enforced server-side (every transaction/dashboard query is hard-scoped to `req.user._id`), not just hidden in the UI.

### Community roles (per-community, assigned via `CommunityMember.role`)
| Capability | Owner (creator) | Community Admin (promoted) | Member |
|---|---|---|---|
| Add / remove members | ✅ only | ❌ | ❌ |
| Promote/demote members to Community Admin | ✅ only | ❌ | ❌ |
| Delete the community | ✅ (or Super Admin) | ❌ | ❌ |
| Add a split expense (choosing who's involved) | ✅ | ✅ | ❌ |
| View community members, balance sheet & transactions | ✅ | ✅ | ✅ |

Whoever creates a community automatically becomes its **Owner**. The Owner can promote any member to **Community Admin**, who can then add split expenses too — but member/delete management always stays with the Owner alone. Super Admin can view any community and delete it for platform housekeeping, but cannot add, remove, or promote members in a community it doesn't own.

## 3. Local Setup

### Prerequisites
- Node.js 18+
- A MongoDB connection string (local MongoDB, or a free MongoDB Atlas cluster)

### Backend
```bash
cd backend
cp .env.example .env       # fill in MONGO_URI, JWT secrets, etc.
npm install
npm run seed:superadmin    # creates the one Super Admin from your .env values
npm run dev                # starts on http://localhost:5000
```

### Frontend
```bash
cd frontend
cp .env.example .env       # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev                # starts on http://localhost:5173
```

Log in with the Super Admin credentials from your `.env` (`SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`), or register a new Admin from `/register` and approve it from the Super Admin's **Users** page.

## 4. Environment Variables

See `backend/.env.example` and `frontend/.env.example` for the full list. Key ones:

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB Atlas (or local) connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Sign access/refresh tokens — set these to long random strings |
| `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` | Used only by the one-time seed script |
| `CLIENT_URL` | Used for CORS — your deployed frontend URL |
| `VITE_API_URL` (frontend) | Your deployed backend's `/api` base URL |

Cloudinary and Brevo SMTP variables are present in `.env.example` for receipt-upload and transactional-email features — wire them into `services/` as you extend the app (not required for the core app to run).

## 5. Deployment

### Database — MongoDB Atlas (free tier)
1. Create a free cluster at mongodb.com/atlas.
2. Add a database user and allow network access (0.0.0.0/0 for simplicity, or Render's IPs).
3. Copy the connection string into `MONGO_URI`.

### Backend — Render
1. Push `backend/` to a GitHub repo.
2. New Web Service on Render → connect the repo.
3. Build command: `npm install`. Start command: `npm start`.
4. Add all `backend/.env` variables in Render's Environment tab.
5. After first deploy, run `npm run seed:superadmin` once via Render's shell (or locally against the Atlas URI).

### Frontend — Vercel
1. Push `frontend/` to a GitHub repo (or same repo, different root).
2. Import into Vercel, framework preset **Vite**.
3. Set `VITE_API_URL` to your Render backend URL + `/api`.
4. Deploy. Update the backend's `CLIENT_URL` env var to match the Vercel domain (for CORS).

## 6. API Overview

Base URL: `/api`

- **Auth**: `POST /auth/register` (creates an active `user`), `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/forgot-password`, `POST /auth/reset-password`
- **Users**: `GET /users/search?q=` (any user — find people to invite into a community), `GET /users` (superadmin — oversight list), `GET/PUT /users/:id`, `DELETE /users/:id` (superadmin), `PATCH /users/:id/status` (superadmin)
- **Transactions** *(always scoped to the caller — never another user's)*: `GET/POST /transactions`, `GET/PUT/DELETE /transactions/:id`
- **Communities**: `GET/POST /communities`, `GET /communities/:id`, `DELETE /communities/:id` (owner or superadmin), `GET /communities/:id/transactions` (members or superadmin), `POST /communities/:id/members` (owner only), `DELETE /communities/:id/members/:userId` (owner only), `PATCH /communities/:id/members/:userId/role` (owner only — promote/demote Community Admin), `POST /communities/:id/split-expense` (owner or Community Admin), `POST /communities/:id/settle` (owner or Community Admin)
- **Dashboard** *(always scoped to the caller)*: `GET /dashboard`, `GET /dashboard/reports?groupBy=day|week|month|year|category`
- **Notifications**: `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`

All protected routes require `Authorization: Bearer <accessToken>`. The refresh token is stored in an httpOnly cookie and used transparently by the frontend's axios interceptor.

## 7. Recent Fixes & Additions

- **Contribution tracking fixed**: `totalContributed` on a community member now updates the moment they pay for a split expense (not just when they settle up later), so the "Contributed" column on the Members table reflects reality immediately.
- **Community Transactions section**: every community's detail page now lists all its expenses (description, category, amount, who paid, date) so every member can see exactly what each charge was for — not just the balance sheet.
- **Community tag on personal Transactions page**: any transaction linked to a community now shows a "Community" badge with the community's name, with a filter to view Personal-only / Community-only / both. Community-linked transactions can't be edited/deleted from this page (to avoid desyncing the community's balance sheet) — a "View in Community" link takes you to manage it properly.
- **Navbar search wired up**: the top search bar now actually searches your transactions (press Enter) instead of being a decorative, non-functional input.
- **Caret color fixed**: text inputs now use an explicit, theme-matched caret color instead of the browser default, which could look mismatched/jarring especially in dark mode.

## 8. What's Fully Built vs. What to Extend Next

**Fully functional now:** JWT auth with refresh rotation, 3-role RBAC end-to-end, admin approval workflow, transactions CRUD with filtering/pagination, community creation + equal-split expenses + balance sheet + settlements, dashboard with live Chart.js visualizations, CSV report export, notifications, profile/settings, glassmorphism UI with Framer Motion animations, dark/light mode, fully responsive layout (drawer sidebar + card-based tables on mobile).

**Scaffolded / straightforward to extend:** `Budget` and `ActivityLog` models exist but don't yet have controllers/UI — add a `budgetController.js` + `Budget Planner` page following the same pattern as Transactions. Receipt image upload needs a Cloudinary `multer` integration in `transactionController.js`. Real-time notifications need a `sockets/` Socket.IO layer. PDF/Excel export needs `pdfkit`/`exceljs` added to `dashboardController.js`'s report endpoint.

---

Questions or want a specific module (Budgets, Goals, Activity Log, real-time sockets, Cloudinary uploads) built out further? Just ask.
