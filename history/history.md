# Social Media Command Center Dashboard - Project History

## BRD Reference
- **Document**: SMCD-BRD-2025-001
- **Project**: Social Media Command Center Dashboard ("Social Market")

## Overview
Unified publishing and management dashboard across X, TikTok, Instagram, Facebook, and Snapchat. The system enables content creation, scheduling, analytics tracking, and team collaboration from a single interface.

## Tech Stack
- **Frontend**: Next.js 16+ (App Router), React 19, React Server Components
- **Styling**: Tailwind CSS 4 + shadcn/ui component patterns
- **State Management**: Zustand 5 (client state) + React Query v5 / TanStack Query (server state)
- **Backend**: Next.js API Routes + tRPC 11
- **Database**: PostgreSQL (Supabase) + Prisma ORM 5.22
- **Job Queue**: BullMQ (Redis) with publish & analytics workers
- **File Storage**: Cloudflare R2 / S3-compatible via AWS SDK v3
- **Auth**: NextAuth.js v5 (Auth.js) with Google + GitHub OAuth
- **Deployment**: Vercel
- **Monitoring**: Sentry + Vercel Analytics

## Architecture Decisions
1. **Adapter Pattern** for platform integrations - each social platform has its own adapter implementing `IPublishAdapter`
2. **RBAC** with four roles: SuperAdmin, TeamManager, ContentCreator, Analyst
3. **AES-256-GCM** encryption for stored OAuth tokens
4. **BullMQ** for scheduled post publishing and analytics sync jobs
5. **tRPC** for type-safe API layer between frontend and backend
6. **AdapterFactory** singleton pattern for platform adapter resolution

## Phases (from BRD)
1. **Phase 0** (2 Weeks): Foundation & Infrastructure
2. **Phase 1** (4 Weeks): Core Publishing Engine
3. **Phase 2** (4 Weeks): Full Platform Integration
4. **Phase 3** (3 Weeks): Scheduling & Calendar
5. **Phase 4** (3 Weeks): Analytics Dashboard
6. **Phase 5** (2 Weeks): QA & Production Launch

## Project Setup
- Initialized: 2025-03-26
- Package manager: pnpm
- Node.js: v21+

## Completed Work

### Session 1 - Initial Scaffolding (2025-03-26)
- Next.js project setup with App Router
- All page routes defined (dashboard, compose, calendar, queue, analytics, settings)
- Prisma schema designed with all models
- tRPC router structure with 6 routers (stubs)
- Zustand stores (compose, ui, platform)
- Platform adapter interface + 5 adapters (stubs)
- TypeScript types and enums
- UI components with shadcn/ui
- Landing page

### Session 2 - Core Implementation (2026-03-26)
**Phase 0 completed + Phase 1 started**

#### Authentication System
- NextAuth v5 with Google + GitHub OAuth providers
- Auth middleware with real session checking (protected/auth routes)
- Centralized auth export (`src/server/auth/index.ts`)
- JWT session strategy with Prisma adapter

#### tRPC Routers (All 6 fully implemented with Prisma)
- **userRouter**: me, updateProfile, enableMfa, verifyMfa
- **postRouter**: list (cursor pagination), getById, create, update, delete, publishNow
- **accountRouter**: listConnected, connect, disconnect, refreshToken, getOAuthUrl
- **scheduleRouter**: getCalendar, reschedule, bulkSchedule
- **analyticsRouter**: overview, platformBreakdown, postPerformance, trends, export (CSV)
- **teamRouter**: get, create, invite, removeMember, updateMemberRole

#### Server Services
- **PublishService**: Multi-platform parallel publishing, schedulePost, cancelScheduledPost, retryFailedPost
- **MediaService**: S3 upload/delete with Cloudflare R2 (already implemented)
- **AnalyticsService**: getDashboardOverview, syncPlatformMetrics, exportAnalytics
- **QueueService**: BullMQ publish/analytics queues with workers, retry logic, fallback mode
- **Encryption**: AES-256-GCM encrypt/decrypt (already implemented)

#### Platform Adapters (All 5 implemented with real API calls)
- **XAdapter**: Twitter API v2 - publish, getMetrics, refreshToken, deletePost, validateContent, media upload
- **InstagramAdapter**: Instagram Graph API - single/carousel publish, insights, token refresh
- **FacebookAdapter**: Meta Graph API - text/photo/multi-photo/video publish, insights, token refresh
- **TikTokAdapter**: TikTok Content Posting API - video publish, metrics, token refresh
- **SnapchatAdapter**: Snap Marketing API - creative publish, metrics, token refresh

#### API Routes
- `/api/auth/[...nextauth]` - NextAuth handler (updated)
- `/api/trpc/[trpc]` - tRPC with session context
- `/api/cron/publish` - Cron job: finds & publishes scheduled posts
- `/api/upload` - Media upload endpoint with file validation
- `/api/webhooks` - Platform webhook handler (stub)

#### Frontend Wiring (tRPC + Real Data)
- TRPCProvider + QueryClient setup
- SessionProvider in root layout
- Login page: Real Google/GitHub OAuth sign-in with Suspense
- Dashboard: Real analytics overview + trend charts from tRPC
- Compose: Create post mutation, save draft, schedule, platform selection from connected accounts, file upload
- Queue: Post list with cursor pagination, delete, publish now, retry failed, status badges
- Analytics: Period selector, real metrics from tRPC, trend charts
- Settings: Profile update, MFA setup, account info from tRPC
- Connected Accounts: List connected platforms, disconnect, refresh token
- Header: User avatar + name from session, sign out button

#### Build Status
- TypeScript: 0 errors
- Next.js build: Passes (all 18 routes compile)
- All pages render correctly

## What's Next
- [ ] Run `pnpm db:push` or `pnpm db:migrate` to create database tables
- [ ] Set up OAuth credentials (Google, GitHub) in `.env`
- [ ] Set up platform API credentials (X, Instagram, etc.)
- [ ] Implement content calendar visual view
- [ ] Add approval workflow for team posts
- [ ] Implement webhook handlers for platform events
- [ ] Add real-time notifications
- [ ] Performance testing & optimization
- [ ] Security audit (OWASP Top 10)
