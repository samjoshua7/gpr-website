# Architecture Guide

This document explains the software architecture for the printing press business management application. It is intended to guide implementation and future maintenance without introducing a different stack or a custom backend.

## 1. Application Architecture

The application is a React single-page application built with Vite and Material UI, hosted on Vercel. It uses Supabase for authentication, PostgreSQL storage, and Row Level Security. All business data is stored in PostgreSQL, and the browser interacts with Supabase using the public anonymous key.

The architecture is intentionally simple:

- the browser renders the UI,
- React routes define the feature entry points,
- feature-level API modules call Supabase,
- database triggers and RLS enforce financial and inventory safety.

No custom backend layer is required for this phase.

## 2. Architectural Principles

- Keep the database authoritative for financial state.
- Keep feature logic close to the feature module.
- Use shared components only for truly reusable UI patterns.
- Keep the routing layer thin and explicit.
- Treat authentication and authorization as first-class concerns.

## 3. Folder Structure

```text
src/
  app/
    App.jsx
    providers/
    theme/
  lib/
    supabaseClient.js
    constants.js
  routes/
    index.jsx
    guards/
  features/
    auth/
    jobCards/
    customers/
    salesInvoices/
    receipts/
    suppliers/
    purchaseBills/
    inventory/
    employees/
    dashboard/
  components/
    layout/
    tables/
    forms/
    feedback/
  hooks/
    useAuth.js
    usePermissions.js
```

## 4. Feature Architecture

Each feature should follow the same internal structure:

```text
features/<feature>/
  api.js
  page.jsx
  components/
  hooks/ (only if needed)
  utils/ (only if needed)
```

This keeps data-access logic, presentation, and feature-specific helpers in one place.

## 5. Component Architecture

The UI should be composed from small, purpose-driven components.

### Layout hierarchy

```text
AppShell
  ├─ AppHeader
  ├─ SidebarNavigation
  └─ MainContent
       ├─ PageHeader
       ├─ FeaturePage
       │    ├─ ListView
       │    ├─ DetailView
       │    └─ DialogForm
       └─ Feedback / Empty / Error states
```

Shared UI should live in the top-level components folder. Feature-specific presentation should remain inside the feature module.

## 6. Authentication Flow

1. The user signs in through Supabase Auth.
2. The application loads the authenticated session from the browser client.
3. The app resolves the user role from the JWT or from application metadata.
4. Route guards enforce whether the user may view or edit a feature.
5. Database RLS enforces the final authorization boundary.

The frontend should never assume that UI visibility alone is sufficient protection. RLS remains mandatory.

## 7. Routing

Routes should be organized by role and feature.

Suggested routing structure:

- /login
- /dashboard
- /jobs
- /customers
- /invoices
- /receipts
- /inventory
- /suppliers
- /purchase-bills
- /payments
- /employees
- /settings

Protected routes should use route-level guards that verify the session and role before rendering the feature page.

## 8. API Layer

Feature API modules should own Supabase queries and mutations.

Each API module should provide a small, explicit surface:

- list operations,
- retrieve by id,
- create/update/delete or void operations,
- and any role-specific or business-specific logic.

The API layer should not contain large UI concerns such as dialog state or form validation logic. It should focus on data access and domain rules that are safe to express in the client.

## 9. React Hooks

Reusable hooks should stay small and focused. Suggested hooks:

- useAuth for session and role state,
- usePermissions for role-based UI gates,
- useAsyncList for loading and error states,
- useFormState for simple form state management if needed.

Do not introduce a global state library for this project.

## 10. Reusable Components

Reusable components should be generic enough to be used by multiple features. Examples:

- DataTable
- StatusChip
- ConfirmDialog
- EmptyState
- ErrorAlert
- PageHeader
- FormField
- NumberField

Feature-specific UI should remain within the feature module.

## 11. State Management

The application should use a combination of:

- React local state for form and dialog state,
- context for shared user/session/settings state,
- and server state from Supabase for entities and lists.

No Redux or other external state library is required.

## 12. Supabase Interaction

Supabase access should be centralized in a shared client module:

```text
src/lib/supabaseClient.js
```

This module should expose the initialized client and any reusable helper functions. Feature modules call it rather than constructing their own clients.

## 13. Error Handling

The UI should distinguish between:

- network errors,
- authentication errors,
- authorization errors,
- validation errors,
- and business-rule violations.

Each feature should provide clear empty, loading, and error states. Financial operations should never silently fail.

## 14. Loading Strategy

The initial experience should remain responsive. The application should render shell UI quickly and load data progressively.

Recommended approach:

- show skeletons or simple placeholders on initial data queries,
- display empty states when no records exist,
- keep lists lightweight and paginated where needed,
- avoid loading excessive data into memory for simple list views.

## 15. Caching

Caching should stay minimal. The current scale does not require a complex caching layer.

Recommended defaults:

- rely on Supabase query results for current data,
- use React state for transient UI state,
- avoid aggressive client-side caching for financial data.

## 16. Pagination and Large Lists

For larger lists or later growth, the UI should use server-side filtering and pagination rather than loading all records at once.

The first implementation may use simple list views with modest dataset sizes, but the architecture should remain compatible with later pagination.

## 17. Dialogs and Forms

Dialogs should be lightweight and focused on a single action, such as creating a receipt or editing a customer.

Forms should use controlled inputs and simple validation rules. Avoid introducing a large form framework unless the UI later becomes much more complex.

## 18. Validation

Validation should be implemented in two layers:

- UI validation for usability,
- database constraints and triggers for correctness.

The database is the final authority for financial and inventory integrity.

## 19. Data Flow Diagrams

### Create invoice flow

```text
Staff -> UI Form -> Feature API -> Supabase -> PostgreSQL
                                   -> Trigger updates invoice status
                                   -> UI refreshes list
```

### Receipt posting flow

```text
Staff -> Receipt Form -> Feature API -> Supabase -> PostgreSQL
                                      -> Trigger updates invoice balance/status
                                      -> UI refreshes invoice and receipt views
```

### Inventory movement flow

```text
Job or purchase event -> Feature API -> Supabase -> PostgreSQL
                                      -> Trigger updates stock cache
                                      -> Inventory view refreshes
```

## 20. Module Dependency Diagram

```text
AppShell
  -> AuthProvider
  -> Router
  -> Feature Pages
       -> Feature API modules
       -> Shared UI components
       -> Shared hooks
       -> Supabase client
```

## 21. Future Scalability

The current architecture is appropriate for a small office team and a small relational data model. As the business grows, the project can evolve by adding:

- more explicit audit tables,
- richer reporting views,
- approval workflows,
- and stronger separation between domain services and UI modules.

That growth should be handled incrementally rather than by introducing a different architecture upfront.
