# G.P.R. Offset Printers — Business Management System

## Overview

This repository will contain a lightweight ERP for a family-owned printing press. It replaces a legacy PHP/MySQL office application with a focused system for jobs, customers, billing, receipts, purchasing, inventory, and employee records. It is intentionally not a general accounting package.

The system is designed for a shared office workflow with fewer than 15 concurrent users. Financial correctness, clear auditability, and maintainability take priority over feature breadth.

## Architecture

The browser application is a React single-page application built with Vite and Material UI, deployed to Vercel. It talks directly to Supabase using the anonymous key. Supabase Auth authenticates users, PostgreSQL stores data, and Row Level Security (RLS) enforces access in the database.

No backend server, service-role key, Firebase service, file storage, or in-app backup system is permitted. Database backups are performed outside this application with `pg_dump`.

Read [ARCHITECTURE.md](ARCHITECTURE.md) for the application structure, [DATABASE.md](DATABASE.md) for the complete data design, [AGENTS.md](AGENTS.md) for implementation rules, and [ROADMAP.md](ROADMAP.md) for delivery order.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| UI | Material UI |
| Backend / database / auth | Supabase + PostgreSQL + Supabase Auth |
| Database client | `@supabase/supabase-js` |
| Hosting | Vercel |

## Getting Started

Prerequisites: current Node.js LTS, npm, access to the project Supabase instance, and a Vercel project for deployment.

1. Clone the repository and install dependencies after the frontend scaffold has been added.
2. Copy `.env.example` to `.env.local`.
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the Supabase project settings.
4. Apply database migrations in the order documented in [DATABASE.md](DATABASE.md).
5. Run the local development command defined by the Vite scaffold.

Never commit `.env.local`, a service-role key, or production credentials.

## Planned Folder Structure

```
src/
  app/                 # theme, providers, app shell
  lib/                 # Supabase client and cross-cutting utilities
  routes/              # route declarations and guards
  features/            # domain modules; queries remain in each api.js
  components/          # reusable, domain-neutral UI
  hooks/               # reusable React hooks
```

Each feature owns `api.js`, page components, feature-specific components, and small feature-only helpers. See [ARCHITECTURE.md](ARCHITECTURE.md) for the exact boundary rules.

## Development Workflow

Implement in roadmap order. Start with schema migrations and RLS, then feature APIs, then UI. Every financial or inventory change must be verified against trigger-driven database behavior; the client is never authoritative for totals, balances, or stock.

Before submitting a change, run the relevant lint, build, and feature tests; verify both a permitted and prohibited role path where RLS changes; and update these documents when a lasting architectural decision changes.

## Deployment

Vercel hosts the static frontend. Configure only the two public Vite environment variables in each Vercel environment. Configure Supabase Auth redirect URLs for the deployed domain and local development URL. Deploy database migrations through the approved Supabase migration workflow before deploying UI that depends on them.

## Environment Variables

| Variable | Required | Meaning |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Public anonymous API key |

The anonymous key is safe to expose only because RLS is mandatory. A `service_role` key must never enter the repository, browser bundle, Vercel frontend environment, or client code.

## Coding Rules

Use functional React components and hooks, Material UI for interface primitives, `numeric(12,2)` for monetary database values, UUID primary keys, and feature-local `api.js` files for all Supabase calls. Respect the detailed rules in [AGENTS.md](AGENTS.md).

## Contributing

Keep commits small and single-purpose. Do not mix schema, unrelated refactoring, and UI changes. Add migrations rather than editing applied migrations. Do not alter financial records by direct client-side recalculation. Review [AGENTS.md](AGENTS.md) before beginning work.

## Future Plans

Phase 1 covers authentication, jobs, customers, sales invoices, receipts, and basic inventory. Phase 2 adds suppliers, purchase bills, payments, job-material consumption, and employees. Phase 3 adds read-only reports and a dashboard after the core data model has stabilized.
