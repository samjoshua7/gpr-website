# Implementation Roadmap

This roadmap orders the work so the core financial and inventory behavior is reliable before reporting and broader workflow enhancements are added.

## Phase 0 — Foundation

### Features
- repository documentation and architecture baseline
- environment variable contract
- local development and deployment conventions

### Database work
- define core tables and naming conventions
- document numbering and fiscal year rules
- define RLS principles

### Frontend work
- create the application shell and route structure
- implement authentication layout and protected routes

### Backend work
- configure Supabase project and environment variables
- define initial auth roles and claims

### Acceptance criteria
- documentation is aligned with implementation intent
- the team can start building without conflicting architecture choices

### Definition of Done
- architecture, database, and rollout guidance are consistent
- the repository contains no contradictory stack or workflow guidance

### Testing checklist
- confirm the environment variable contract is documented
- confirm the role model is understood by the implementation team

### Recommended commit names
- docs: establish architecture baseline
- docs: codify database contract

### Milestones
- project constitution and implementation blueprint are approved

## Phase 1 — Core Operations

### Features
- authentication and roles
- customer management
- job card management
- sales invoices
- receipts
- basic inventory

### Database work
- create the core tables and constraints
- add triggers for invoice/payment and stock updates
- implement RLS policies for SUPER_ADMIN and STAFF
- define customer-facing access rules

### Frontend work
- implement login and protected navigation
- implement list/detail/create flows for jobs, customers, invoices, receipts, and inventory
- add loading, error, and empty states

### Backend work
- configure Supabase auth and policies
- ensure financial values are derived in the database

### Acceptance criteria
- a staff user can create and review core operational records
- a customer user can access only their own balance-related records
- inventory movement and invoice balance updates are consistent

### Definition of Done
- the core transactional workflows are implemented and protected by RLS
- database-driven financial and inventory updates are verified

### Testing checklist
- verify permitted and prohibited role paths
- verify invoices and inventory update correctly after receipts and job events
- verify finalized financial records cannot be silently deleted

### Recommended commit names
- feat: add auth and role guards
- feat: add job card workflow
- feat: add invoice and receipt flows
- feat: add inventory tracking

### Milestones
- Phase 1 core office workflow is usable

## Phase 2 — Purchases and People

### Features
- supplier management
- purchase bills
- payments
- employee records
- job-to-stock consumption

### Database work
- add supplier, purchase, payment, and employee tables
- add job-to-stock consumption rules and triggers
- extend RLS to cover purchase and employee workflows

### Frontend work
- implement supplier and purchase flows
- implement payment posting and employee record management
- connect job consumption to inventory changes

### Backend work
- ensure purchase and payment balances are derived consistently

### Acceptance criteria
- purchase bills and payments can be created and tracked
- inventory consumption from jobs is reflected in stock movement
- employee records are available to authorized staff only

### Definition of Done
- the purchasing and people workflows are implemented without bypassing database safety rules

### Testing checklist
- verify purchase bill status updates correctly
- verify stock changes follow the approved inventory logic
- verify salary-related employee data remains restricted

### Recommended commit names
- feat: add supplier and purchase bill flow
- feat: add payment workflow
- feat: add employee records

### Milestones
- purchasing and employee records are operational

## Phase 3 — Reporting and Insight

### Features
- dashboard metrics
- outstanding receivable and payable summaries
- stock summary and sales views

### Database work
- add reporting views and summary functions
- keep the reporting layer read-only

### Frontend work
- add dashboard and reporting screens
- keep reporting filtered to the stable core tables

### Backend work
- verify reporting queries perform well enough for the expected data volume

### Acceptance criteria
- reporting screens reflect the core transactional data accurately
- reporting does not introduce write-path complexity into the core model

### Definition of Done
- reporting is implemented on top of stable transactional data

### Testing checklist
- verify reports reflect the same data as the transactional tables
- verify access restrictions remain appropriate

### Recommended commit names
- feat: add dashboard metrics
- feat: add reporting views

### Milestones
- leadership can review operational summaries from the system
