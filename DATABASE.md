# Database Specification

This document defines the database contract for the printing press business management application. It is intentionally documentation-only at this stage and should be treated as the source of truth for future schema and migration work.

## 1. Database Philosophy

The database is the authoritative system for financial correctness, inventory truth, and authorization. The frontend is a client of the database and must never be treated as the source of truth for balances, invoice status, or stock totals.

The design favors clarity over over-engineering. The system is intended for a small office environment and should remain simple to operate and maintain.

## 2. Core Principles

- Use PostgreSQL with Supabase.
- Use numeric(12,2) for all monetary values.
- Use UUID primary keys for user-facing business entities where practical.
- Every business table includes created_at and updated_at timestamps.
- Maintain auditability through transactional records and database-driven derivations.
- Use Row Level Security to enforce access at the database layer.

## 3. ER Diagram

```text
users ─< employees
users ─< customers
users ─< staff profiles (future if needed)

customers ─< job_cards
customers ─< sales_invoices
customers ─< receipts

job_cards ─< sales_invoices
job_cards ─< job_card_items
items ─< job_card_items

suppliers ─< purchase_bills
purchase_bills ─< purchase_bill_items
items ─< purchase_bill_items

items ─< stock_transactions
job_cards ─< stock_transactions
purchase_bills ─< stock_transactions
```

## 4. Core Tables

### users

Mirror the Supabase auth.users record with additional application-level metadata.

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key, references auth.users.id |
| role | text | SUPER_ADMIN or STAFF |
| name | text | Display name |
| email | text | Email address |
| active | boolean | Active state |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

### employees

| Column | Type | Notes |
|---|---|---|
| employee_id | uuid | Primary key |
| user_id | uuid | Nullable reference to users.id |
| name | text | Required |
| phone | text | Nullable |
| joined_date | date | Nullable |
| active | boolean | Default true |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

### customers

| Column | Type | Notes |
|---|---|---|
| customer_id | uuid | Primary key |
| user_id | uuid | Nullable, linked for customer portal access |
| name | text | Required |
| phone | text | Nullable |
| address | text | Nullable |
| opening_balance | numeric(12,2) | Default 0.00 |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

### suppliers

| Column | Type | Notes |
|---|---|---|
| supplier_id | uuid | Primary key |
| name | text | Required |
| phone | text | Nullable |
| address | text | Nullable |
| opening_balance | numeric(12,2) | Default 0.00 |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

### items

| Column | Type | Notes |
|---|---|---|
| item_id | uuid | Primary key |
| name | text | Required |
| unit | text | Example sheet, ream, kg |
| current_stock | numeric(12,2) | Cached stock quantity |
| reorder_level | numeric(12,2) | Optional threshold |
| unit_price | numeric(12,2) | Default price |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

### stock_transactions

| Column | Type | Notes |
|---|---|---|
| txn_id | uuid | Primary key |
| item_id | uuid | References items.item_id |
| type | text | in or out |
| quantity | numeric(12,2) | Positive for stock movement |
| reference_type | text | job_card, purchase, manual |
| reference_id | uuid | Nullable reference to the source entity |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

### job_cards

| Column | Type | Notes |
|---|---|---|
| job_id | uuid | Primary key |
| customer_id | uuid | References customers.customer_id |
| description | text | Required |
| status | text | pending, in_progress, completed, delivered |
| quantity | numeric(12,2) | Quantity of work |
| created_by | uuid | References users.id |
| due_date | date | Nullable |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

### job_card_items

| Column | Type | Notes |
|---|---|---|
| job_id | uuid | References job_cards.job_id |
| item_id | uuid | References items.item_id |
| quantity_used | numeric(12,2) | Required |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

### sales_invoices

| Column | Type | Notes |
|---|---|---|
| invoice_id | uuid | Primary key |
| customer_id | uuid | References customers.customer_id |
| job_id | uuid | Nullable reference to job_cards.job_id |
| invoice_no | text | Business number, unique |
| invoice_date | date | Required |
| total_amount | numeric(12,2) | Required |
| amount_paid | numeric(12,2) | Derived or managed by trigger |
| status | text | unpaid, partial, paid, void |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

### sales_invoice_items

| Column | Type | Notes |
|---|---|---|
| invoice_item_id | uuid | Primary key |
| invoice_id | uuid | References sales_invoices.invoice_id |
| description | text | Required |
| quantity | numeric(12,2) | Required |
| unit_price | numeric(12,2) | Required |
| amount | numeric(12,2) | Required |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

### receipts

| Column | Type | Notes |
|---|---|---|
| receipt_id | uuid | Primary key |
| customer_id | uuid | References customers.customer_id |
| invoice_id | uuid | Nullable reference to sales_invoices.invoice_id |
| amount | numeric(12,2) | Required |
| receipt_date | date | Required |
| mode | text | cash, upi, bank |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

### purchase_bills

| Column | Type | Notes |
|---|---|---|
| bill_id | uuid | Primary key |
| supplier_id | uuid | References suppliers.supplier_id |
| bill_no | text | Business number, unique |
| bill_date | date | Required |
| total_amount | numeric(12,2) | Required |
| amount_paid | numeric(12,2) | Derived or managed by trigger |
| status | text | unpaid, partial, paid, void |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

### purchase_bill_items

| Column | Type | Notes |
|---|---|---|---|
| bill_item_id | uuid | Primary key |
| bill_id | uuid | References purchase_bills.bill_id |
| item_id | uuid | References items.item_id |
| quantity | numeric(12,2) | Required |
| unit_price | numeric(12,2) | Required |
| amount | numeric(12,2) | Required |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

### payments

| Column | Type | Notes |
|---|---|---|
| payment_id | uuid | Primary key |
| supplier_id | uuid | References suppliers.supplier_id |
| bill_id | uuid | Nullable reference to purchase_bills.bill_id |
| amount | numeric(12,2) | Required |
| payment_date | date | Required |
| mode | text | cash, upi, bank |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

### company_settings

| Column | Type | Notes |
|---|---|---|
| setting_id | uuid | Primary key |
| company_name | text | Required |
| address | text | Nullable |
| gstin | text | Nullable |
| invoice_prefix | text | Default INV |
| financial_year_start | date | Required |
| default_invoice_paper_size | text | Default A4 (A4 or A5) |
| logo_url | text | Storage bucket URL for logo |
| signatory_image_url | text | Storage bucket URL for signature |
| signatory_name | text | Default Authorized Signatory |
| upi_enabled | boolean | Default true |
| upi_mode | text | Default upi_id (upi_id or bank_account) |
| upi_id | text | Virtual Payment Address (e.g. 9876543210@upi) |
| upi_phone | text | Phone number for UPI |
| bank_name | text | Bank Name |
| bank_account_no | text | Bank Account Number |
| bank_ifsc | text | Bank IFSC Code |
| bank_branch | text | Bank Branch Name |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

## 5. Relationships

- One customer may have many job cards, invoices, and receipts.
- One job card may be linked to one sales invoice, but the relationship remains nullable because not every job must be invoiced immediately.
- One invoice may have many invoice items and many receipts.
- One supplier may have many purchase bills and payments.
- One item may appear in many stock transactions and many bill or job line items.
- The stock_transactions table is the source of truth for inventory movement.

## 6. Enums and Controlled Values

Use text columns with explicit validation rules rather than custom enum types unless the team later adopts a migration workflow that supports them comfortably.

Suggested values:

- job card status: pending, in_progress, completed, delivered
- invoice and bill status: unpaid, partial, paid, void
- receipt and payment mode: cash, upi, bank
- stock transaction type: in, out

## 7. Indexes

Recommended indexes:

- customers(name)
- suppliers(name)
- items(name)
- job_cards(customer_id, status, due_date)
- sales_invoices(customer_id, invoice_date, status)
- receipts(customer_id, receipt_date)
- purchase_bills(supplier_id, bill_date, status)
- payments(supplier_id, payment_date)
- stock_transactions(item_id, created_at)
- sales_invoice_items(invoice_id)
- purchase_bill_items(bill_id)

## 8. Constraints

- Monetary values must be non-negative.
- Quantity values must be positive for stock movement and line items.
- Invoice and bill numbers must be unique within the relevant business scope.
- A receipt or payment cannot reference a nonexistent invoice or bill.
- Finalized financial documents must not be hard-deleted.

## 9. Triggers and Derived Data

The following should be enforced through database triggers or stored functions:

- Update invoice amount_paid and status when receipts are inserted or updated.
- Update bill amount_paid and status when payments are inserted or updated.
- Update items.current_stock from stock_transactions.
- Ensure inventory movement cannot create negative stock unless explicitly allowed with a controlled business rule.

## 10. Views

Recommended read-only views for Phase 3:

- outstanding_receivables
- outstanding_payables
- stock_summary
- sales_summary_by_day

These views are informational and should not be used as the primary write path.

## 11. Functions

Suggested server-side functions:

- recalculate_invoice_status(invoice_id)
- recalculate_bill_status(bill_id)
- sync_item_stock(item_id)
- generate_invoice_number()
- generate_bill_number()

These functions should remain simple and explicit. Avoid over-abstracting them.

## 12. RLS Philosophy

Row Level Security must protect user-facing tables according to role. The database should enforce the same rules the application expects.

The implementation should follow a simple three-tier pattern:

- SUPER_ADMIN: full access
- STAFF: read/write access for operational tables and financial tables, no hard-delete on finalized financial records
- CUSTOMER: read-only access to their own invoices, receipts, and balance-related data

Tables without customer relevance should be restricted by default and not exposed to customer roles.

## 13. Audit Logging

The system should preserve enough information to understand who changed what and when. For the initial implementation, this can be done through:

- created_at and updated_at columns,
- created_by and updated_by references where practical,
- and a later extension to a dedicated audit table if the business needs stronger traceability.

## 14. Soft Delete and Void Strategy

- Do not hard-delete finalized financial documents.
- Use a status such as void or cancelled instead.
- Keep the original document intact so the audit trail remains clear.
- If soft-delete is introduced later, keep it explicit and documented.

## 15. Numbering Strategy

The application should define a clear numbering convention before implementation begins.

Suggested rules:

- invoice numbering should be sequential and should follow the financial year or a clearly defined prefix,
- bill numbering should follow a similar pattern,
- job numbering should be explicit and traceable for internal operations.

The final decision should be implemented in the database layer or through a controlled service so that numbers remain unique and consistent.

## 16. Financial Year and Periods

The company_settings table should store a financial_year_start date. This value should be used by any numbering or reporting logic that depends on a fiscal boundary.

## 17. Inventory Rules

- stock_transactions is the authoritative inventory ledger.
- items.current_stock is a cached value derived from stock movements.
- Negative stock should be prevented unless a specific approved exception exists.
- Inventory movement must be traceable to a job, purchase, or manual action.

## 18. Receipt and Payment Rules

- Receipts reduce customer outstanding balances and update invoice payment status.
- Payments reduce supplier outstanding balances and update bill payment status.
- A receipt or payment can be posted on account when no specific invoice or bill is yet linked.
- The exact balance calculation should remain consistent with the database-driven rules, not a frontend assumption.

## 19. Migration Order

The recommended migration order is:

1. base tables for users, employees, customers, suppliers, items, and company_settings,
2. transactional tables for job_cards, sales_invoices, receipts, purchase_bills, payments, and stock_transactions,
3. child tables such as line items and job_card_items,
4. triggers and derived value functions,
5. RLS policies,
6. reporting views.

## 20. Future Scalability

The current design is sufficient for a single-office deployment. Future growth should be handled through:

- clearer audit tables,
- modular reporting views,
- stronger approval flows,
- optional multi-branch expansion,
- and a more formal accounting model if the business later requires it.
