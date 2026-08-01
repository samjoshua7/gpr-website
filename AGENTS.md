# Printing Press Business Management App — Development Constitution

This document is the implementation constitution for the repository. It defines the product intent, the technical guardrails, the delivery order, and the rules that future implementation work must follow.

## Human Terminal Rule

The AI agent must NEVER wait for long-running terminal processes.

Examples:

- npm install
- npm run dev
- npm run build
- npx ...
- supabase ...

Instead:

1. Print the exact command.
2. Ask the user to run it.
3. Continue after confirmation.

Never poll timers.
Never repeatedly wait.
Never enter waiting loops.

## 1. Project Vision

The project replaces a legacy PHP/MySQL office workflow with a focused business management system for a family printing press. The application supports the core daily operations of a small print shop: job management, customer invoicing, receipts, purchasing, inventory, and employee records.

The system is intentionally scoped to a local office workflow for roughly 10 to 15 users. It prioritizes financial correctness, auditability, and maintainability over breadth.

## 2. Business Rules

- The application is a lightweight ERP-style tool for a printing press, not a general-purpose accounting platform.
- The primary business objects are jobs, customers, invoices, receipts, suppliers, purchase bills, payments, inventory, and employees.
- No file attachments, document storage, payroll processing, or multi-company features are required in the first release.
- Backups remain outside the application through database export tooling such as pg_dump.
- Financial records must remain consistent even when the frontend is unavailable or misused.
- Finalized financial documents must not be silently deleted; they must be voided or cancelled instead.

## 3. Product Scope and Phase Order

Phase 1: authentication, roles, job cards, customers, sales invoices, receipts, and basic inventory.

Phase 2: suppliers, purchase bills, payments, employee records, and job-to-stock consumption.

Phase 3: reporting views and dashboard metrics over the stabilized core tables.

The implementation order is fixed. Do not build reporting before the core accounting and inventory tables are reliable.

## 4. Roles and Access

| Role | Description | Access |
|---|---|---|
| SUPER_ADMIN | Owner or administrator | Full CRUD across the application, including employee records, settings, and financial correction actions |
| STAFF | Office staff | CRUD for operational and financial records, excluding user management and employee salary data |
| CUSTOMER | Optional portal user | Read-only access to their own invoices, receipts, and outstanding balance |

Implementation assumption for the initial phase: staff users operate with shared visibility and no per-staff data isolation.

## 5. Technical Stack

The stack is fixed and must not be replaced during implementation.

| Layer | Choice |
|---|---|
| Frontend | React with Vite |
| UI library | Material UI |
| Database | PostgreSQL |
| Backend/auth | Supabase Auth and Supabase Postgres |
| Database client | @supabase/supabase-js |
| Hosting | Vercel |

No Firebase, no custom backend service, and no service-role key in the browser.

## 6. Coding Standards

- Use functional React components and hooks only.
- Prefer small, focused components and feature-level modules.
- Keep business logic close to the relevant feature. Avoid sprawling shared helpers unless the logic is genuinely reusable.
- Place Supabase queries in feature-level api.js modules rather than inline inside components.
- Keep comments rare and only use them for financial calculations, inventory synchronization logic, and RLS rules.
- Favor clarity over clever abstractions.
- Do not introduce state libraries or form libraries unless the implementation absolutely requires them.

## 7. React Standards

- Use React Router for navigation and route-level composition.
- Use Material UI primitives as the default UI building blocks.
- Prefer controlled inputs and simple validation over complex form frameworks.
- Maintain clear loading, empty, and error states for every list and detail view.
- Keep dialogs and drawers lightweight and focused on a single task.
- Use context for application-wide state only when it is truly shared, such as authentication and company settings.

## 8. Supabase Standards

- Use a single shared Supabase client module for browser access.
- Keep data-access code in feature api modules.
- Treat Row Level Security as part of the product contract, not as an afterthought.
- Use role-based claims in the JWT whenever possible rather than repeatedly querying user metadata in RLS.
- Do not expose service-role credentials in frontend code, environment bundles, or deployment configuration.

## 9. Database Standards

- Use PostgreSQL and keep the schema explicit and relational.
- Use numeric(12,2) for all monetary values; never use floating point types.
- Add created_at and updated_at columns to every business table.
- Prefer database-enforced integrity over frontend-only checks for financial correctness.
- Keep stock movement data authoritative in transactional tables and use denormalized stock caches only when required by performance or UI needs.
- Use triggers or database functions for derived financial values and stock updates rather than relying on UI state.

## 10. Folder Conventions

The repository should follow a feature-first structure:

src/
  app/                 # theme, providers, app shell
  lib/                 # shared clients and utilities
  routes/              # route declarations and guards
  features/            # domain modules
  components/          # reusable UI building blocks
  hooks/               # shared hooks

Each feature should contain:
- api.js for Supabase access
- page components for main routes
- feature components for local UI composition
- feature-specific helpers only when necessary

## 11. Naming Conventions

- Use camelCase for JavaScript and TypeScript variables and functions.
- Use PascalCase for React component names.
- Use snake_case for database objects and PostgreSQL columns.
- Use descriptive names for business concepts such as jobCard, salesInvoice, stockTransaction, and purchaseBill.
- Avoid abbreviations that hide intent.

## 12. Security Rules

- Never commit secrets or credentials.
- Use only VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the browser environment.
- Keep Row Level Security enabled for all user-facing tables.
- Deny access by default whenever a table is not explicitly meant to be accessible to a role.
- Do not allow direct client-side editing of balances, totals, or stock values that should be derived in the database.

## 13. Git Workflow

- Create a short-lived branch for each implementation task.
- Keep commits atomic and focused on one concern at a time.
- Use descriptive commit messages that reflect user-visible changes or architectural decisions.
- Prefer small pull requests with clear validation notes.

## 14. Definition of Done

A feature is considered complete when:
- the database contract and RLS rules are defined,
- the UI and API work for the requested flow are implemented,
- validation and error handling are present,
- the feature works for at least one permitted and one prohibited role path,
- the documentation remains consistent with the implementation,
- and the change does not break adjacent workflows.

## 15. Development Workflow

1. Confirm the business requirement and the relevant database contract.
2. Define or update the schema and RLS policy before implementing UI.
3. Implement feature-level API modules.
4. Build the UI flow with clear loading and error handling.
5. Verify the flow against the intended role and the expected denial path.
6. Update documentation when the implementation changes the architecture or product rules.

## 16. Feature Workflow

For each feature, complete the following sequence:
- define the user story,
- define the relevant data model and validation rules,
- implement the API layer,
- implement the UI and interaction flow,
- verify role restrictions and financial safety rules,
- document any new assumptions.

## 17. Performance Rules

- Keep list queries efficient and avoid unnecessary joins.
- Prefer pagination or server-side filtering for larger datasets.
- Avoid loading large datasets into memory when a small subset is sufficient.
- Maintain responsive UI states and avoid blocking the first render with heavy data work.

## 18. Accessibility

- All interactive controls must be keyboard accessible.
- Provide visible focus states and meaningful labels.
- Ensure form errors and validation messages are announced clearly.
- Use semantic markup and avoid relying on color alone to communicate state.

## 19. Error Handling

- Handle network, authentication, and permission errors explicitly.
- Surface actionable messages rather than raw technical failures.
- Distinguish between user error, system error, and authorization error.
- Avoid silently swallowing failures in financial or inventory flows.

## 20. Validation Rules

- Required fields must be enforced.
- Positive quantities and positive amounts must be validated.
- Financial and inventory updates must be guarded by database rules where possible.
- Do not trust the frontend as the sole source of truth for totals, balances, or stock levels.

## 21. Financial Safety Rules

- Monetary values must be stored as numeric(12,2).
- Invoice balances and payment status must be derived or enforced in the database.
- Finalized invoices must not be hard-deleted; they must be voided.
- Inventory movement must be recorded and traceable.
- Receipts and payments must remain linked to the correct business object.

## 22. AI Agent Rules

- Preserve the existing architecture unless a change is explicitly required.
- Do not introduce speculative patterns or alternate stacks.
- When changing documentation, keep the useful parts of the current guidance and remove contradictions.
- If a requirement is ambiguous, document the chosen assumption and keep it consistent.
- Prefer the simplest implementation path that satisfies the current phase.

## 23. Never-Do Rules

- Do not replace the chosen stack.
- Do not build a custom backend when Supabase already covers the required needs.
- Do not place secrets in the frontend bundle or source control.
- Do not hard-delete finalized financial records.
- Do not let the UI calculate balances or stock totals that should be enforced by the database.
- Do not skip Row Level Security.
- Do not build Phase 3 reporting before the core transactional tables are stable.
