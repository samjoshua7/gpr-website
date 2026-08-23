# Handover Summary — 4-Tier RBAC & Mobile Operator Experience

## 1. Objective
Implement an enterprise 4-Tier Role-Based Access Control (RBAC) system with tailored workflows for Super Admin (`SUPER_ADMIN`), Accounts Staff (`ACCOUNTS`), Shop-Floor Operators (`STAFF`), and Stakeholders (`STAKEHOLDER`), featuring mobile operator department filtering, financial confidentiality, and 1-click stage advancement.

## 2. Key Decisions & Architecture
- **Auth & Profile Merging**: `AuthProvider.jsx` loads user records and merges assigned `departments` and role from `public.employees`, ensuring real-time role updates without manual re-login.
- **Route & UI Guards**:
  - `STAFF`: Automatically redirected to `/dashboard/jobs`. Only assigned department columns are rendered in Kanban. Invoice/billing data is completely hidden.
  - `ACCOUNTS`: Unrestricted billing, invoice, quotation, receipt, customer ledger, and inventory operations. Blocked from Company Settings and Employee management.
  - `STAKEHOLDER`: Full read-only observation across all pages including Company Settings, Invoices, Quotations, and Employees, with all write/mutation actions suppressed.
  - `SUPER_ADMIN`: Full CRUD across all tables and settings.
- **1-Click Stage Advancement**: In `JobCardDetailsModal`, staff can complete tasks in their department and advance cards to the next stage via a confirmation modal.

## 3. Files Modified
- `supabase/migrations/029_user_roles_and_permissions.sql` [NEW]
- `src/app/providers/AuthProvider.jsx`
- `src/components/layout/AppShell.jsx`
- `src/routes/index.jsx`
- `src/features/dashboard/page.jsx`
- `src/features/employees/components/EmployeeDialog.jsx`
- `src/features/employees/page.jsx`
- `src/features/jobCards/page.jsx`
- `src/features/jobCards/components/JobCardDetailsModal.jsx`
- `src/features/settings/page.jsx`
- `src/features/salesInvoices/components/InvoiceDetailsDialog.jsx`
- `src/features/quotations/components/QuotationDetailsDialog.jsx`

## 4. Database Changes & SQL Migrations
- Migration `029_user_roles_and_permissions.sql`:
  - Updated `users_role_check` constraint: `('SUPER_ADMIN', 'STAFF', 'ACCOUNTS', 'STAKEHOLDER', 'CUSTOMER')`.
  - Added `departments text[]` to `public.users`.
  - Created auto-sync trigger `trg_sync_employee_to_user` on `public.employees`.
  - Updated RLS policies across `users`, `employees`, `company_settings`, `customers`, `sales_invoices`, `receipts`, `quotations`, `job_cards`.

## 5. Next Task for Following Agent
- Support custom role definitions or fine-grained permission toggles if requested.
- Monitor production logs for any RLS policy denials.
