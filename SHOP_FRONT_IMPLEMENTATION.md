# 🚀 GPR WEBSITE — ONLINE STORE / E-COMMERCE SYSTEM

## SUPER IMPLEMENTATION SPECIFICATION

You are working on the existing **GPR Website** project.

You have filesystem access to the complete current project. **DO NOT assume the architecture, database schema, routes, components, authentication flow, styling system, or Supabase structure. Inspect the existing project first.**

The goal is to add a complete **customer-facing online storefront + product customization + cart + online ordering system + admin order management** while preserving the existing GPR application.

---

# ⚠️ MOST IMPORTANT DEVELOPMENT RULE

DO NOT immediately start coding.

This is a large feature touching:

* Existing React/Vite frontend
* Existing Supabase database
* Existing authentication
* Existing admin dashboard
* Existing design system
* Existing routing
* Existing RLS policies
* Existing performance optimizations
* Existing deployment architecture

Therefore follow this workflow:

### STEP 1 — FULL PROJECT AUDIT

Inspect the entire existing project and understand:

* Project structure
* React architecture
* Routing
* Layouts
* Existing components
* Existing design system/theme
* Existing authentication
* Supabase client configuration
* Existing database schema
* Existing Supabase tables
* Existing RLS policies
* Existing Storage buckets
* Existing admin roles/permissions
* Existing customer/user model
* Existing loading/caching patterns
* Existing reusable UI components
* Existing responsive/mobile implementation
* Existing environment variables
* Vercel deployment configuration
* Existing API/server-side functions if any

Do not duplicate functionality that already exists.

Reuse existing components, utilities, hooks and patterns wherever appropriate.

---

# STEP 2 — ARCHITECTURE DESIGN

Before modifying anything, design the complete architecture for the following system:

## CUSTOMER STOREFRONT

A clean, modern e-commerce experience inspired by Amazon's information architecture but **NOT visually copied from Amazon**.

The design must use the existing GPR visual identity/theme.

The target is:

> Amazon-like usability + clean modern GPR branding + minimal visual clutter.

The current website should NOT become visually overloaded.

---

# 🏠 HOMEPAGE

Create a proper customer-facing homepage.

Approximate structure:

```text
Header
│
├── GPR Logo
├── Search
├── Account
└── Cart

Navigation / Categories

Hero Banner Carousel

Shop by Category

Featured / Popular Products

All Products

Footer
```

The layout must be responsive and mobile-first.

---

# 🖼️ HERO BANNER SYSTEM

The homepage must have an automatically rotating hero carousel.

Do NOT hardcode individual banners into JSX.

Create a dedicated banner asset mechanism.

Preferred concept:

```text
/public/hero-banners/
```

The system should allow additional banner images to be added without requiring the developer to rewrite the homepage component.

However:

### IMPORTANT

First inspect the existing Vite/Vercel deployment architecture and determine the safest production-compatible way to automatically discover/display these assets.

Do not implement a filesystem-dependent solution that works locally but breaks after Vercel deployment.

Support:

* Multiple banners
* Automatic scrolling
* Previous/next controls
* Indicator dots
* Pause/interaction behavior
* Responsive images
* Proper image loading
* Accessible controls
* Lazy loading where appropriate

Avoid causing unnecessary network requests.

---

# 🛍️ PRODUCT CATALOG ARCHITECTURE

The initial product categories are:

## Calendars

* Monthly Calendars
* Daily Sheet Calendars

## Bookmarks

* Bookmarks

## Cards

* Pocket Promise Cards
* Promise Cards

  * A4
  * Crown

These should NOT simply be hardcoded into the homepage.

The system must be **database-driven**.

The hierarchy should conceptually support:

```text
Category
    ↓
Sub-product
    ↓
Product
    ↓
Available customization options
    ↓
Pricing rules
```

The exact database structure should be determined after auditing the existing Supabase architecture.

---

# ⚙️ PRODUCT MANAGEMENT

Create a new Admin page:

> **Products Management**

Products must be manageable from the admin panel.

The administrator should be able to manage:

### Basic information

* Product name
* Category
* Sub-category
* Description
* Short description
* Product images
* Main image
* Gallery images
* Active/inactive status
* Display order
* Featured/popular status

### Product customization options

This is VERY IMPORTANT.

Different products have different options.

Do NOT assume every product has:

* Size
* Paper
* Thickness
* Lamination

For example:

Monthly Calendar may support:

```text
Size
Paper
Thickness
```

while Promise Cards may support:

```text
Size
Paper
Thickness
Lamination
```

Therefore the product architecture must support **dynamic configurable options**.

The admin should be able to define which options are available for each product.

Do not hardcode product-specific option logic throughout the frontend.

---

# 🎨 DESIGN PROVISION

Products can be customized by the customer, but customers cannot currently upload files directly because of the current Supabase Storage limitations.

Therefore provide a product option:

```text
Design Provision

○ Self-supplied design
○ Design by GPR
```

This does NOT require file upload in V1.

When an order is placed:

* Self-supplied → GPR contacts customer through WhatsApp/email and obtains design.
* Design by GPR → GPR contacts customer and collects requirements.

Store the selected design provision as part of the order item.

---

# 🖼️ PRODUCT PREVIEW

Do NOT attempt to build a sophisticated dynamic 3D/product mockup system in V1.

Products will have administrator-uploaded images.

For example:

```text
Product Gallery

Main image
Additional image
Sample image
```

When the customer changes:

* Size
* Paper
* Lamination
* Thickness
* Quantity

the displayed product image can remain the same.

The configuration affects:

* Selected values
* Price
* Order information

not the physical image.

A sophisticated dynamic preview can be added later.

---

# 💰 PRICING ENGINE

The pricing architecture must support:

```text
Base price
+
Size surcharge
+
Paper surcharge
+
Thickness surcharge
+
Lamination surcharge
+
Quantity pricing
```

However, pricing is NOT simply linear.

Example:

```text
100 copies   → ₹15 each
500 copies   → ₹12 each
1000 copies  → ₹10 each
```

Therefore implement quantity-based pricing tiers.

Example conceptual structure:

```text
Quantity Tier

minimum_quantity
maximum_quantity
price_per_unit
```

The exact database structure should be determined during architecture planning.

---

# 🔢 QUANTITY

Customers can manually enter their quantity.

However:

### NEVER allow quantity below the product's minimum quantity.

Example:

```text
Minimum quantity: 100

Customer enters: 50

→ Reject
→ Show clear validation
```

Quantity changes must immediately update pricing.

Avoid unnecessary database requests while changing quantity.

Price calculations should happen efficiently on the client where appropriate, while final order totals must be validated server-side / through trusted database logic before order creation.

Never trust client-submitted prices.

---

# 🧮 GST

GST is REQUIRED.

The checkout/order system must support:

```text
Subtotal
GST
Grand Total
```

The GST implementation must be designed so that the rate can be changed later without rewriting the entire checkout system.

Do not hardcode GST logic in multiple components.

---

# 🛒 CART

Customers must be able to add products to cart without logging in.

Example:

```text
Monthly Calendar
A4
100 GSM
No Lamination
500 quantity

+

Monthly Calendar
A3
120 GSM
500 quantity
```

These MUST be treated as separate cart items.

The cart item identity should depend on the selected configuration.

For example:

```text
Product ID
+
Selected options
+
Design provision
```

Two identical products with different configurations must remain separate cart items.

---

# 💾 CART PERSISTENCE

Guest users:

Use an appropriate client-side persistence mechanism such as localStorage.

Logged-in customers:

Persist cart appropriately using the database if that aligns with the existing architecture.

When a guest logs in:

Attempt to merge the guest cart with the customer's persistent cart intelligently.

Avoid duplicate products where configurations are identical.

---

# 👤 ONLINE CUSTOMER SYSTEM

Online customers are separate from the existing internal/admin user management concept.

Use Google Authentication only.

The customer flow should be:

```text
Browse
 ↓
Configure product
 ↓
Add to cart
 ↓
Continue shopping
 ↓
Cart
 ↓
Checkout
 ↓
Login required
 ↓
Google Sign-In
 ↓
Customer details
 ↓
Place Order
```

Before login, the customer should be able to build their cart.

At checkout, clearly communicate:

> **Login to Place Order**

Do NOT force login merely to browse products.

---

# 👤 CUSTOMER ACCOUNT

Create a customer account experience.

At minimum support:

```text
My Account

Profile
My Orders
Cart
Logout
```

Customer information should include appropriate fields such as:

* Name
* Email
* Phone
* Company/business name if applicable
* Billing information
* GSTIN if applicable
* Saved address/details if appropriate

Do not collect unnecessary personal information.

The exact schema should be designed after inspecting the existing authentication architecture.

---

# 📦 CHECKOUT

The current system does NOT require:

* Online payment
* Razorpay
* UPI integration
* Automatic delivery tracking
* Automated production tracking

Keep checkout intentionally simple.

Customer should review:

```text
Customer information

Products

Each product configuration

Quantity

Unit price

Subtotal

GST

Grand total

Design provision
```

Then:

> **Place Order**

---

# 🚚 DELIVERY / FULFILLMENT

For V1, fulfillment is manually handled by GPR.

Do not build a complicated delivery tracking system.

If delivery/pickup information is already supported by the existing architecture, reuse it.

Otherwise keep the structure extensible for future implementation.

---

# 🧾 ONLINE ORDER CREATION

When customer clicks:

> Place Order

create a permanent order record.

The order MUST preserve a snapshot of the order at the time of purchase.

Do not depend entirely on the current product configuration after the order is created.

For example, if an administrator changes a product's price tomorrow, yesterday's order must still show yesterday's price.

Therefore order items should store snapshots of relevant information such as:

```text
Product name
Product ID
Selected options
Quantity
Unit price
Subtotal
Design provision
Applicable GST
Total
```

---

# 📊 ADMIN — ONLINE ORDERS

Create a new Admin page:

> **Online Orders**

This page should clearly show all online orders.

Suggested list view:

```text
Order ID
Customer
Date
Items
Total
Status
Actions
```

Clicking an order should open a detailed order view.

---

# 🔎 ORDER DETAIL VIEW

Show:

## Order Information

```text
Order ID
Order date
Order status
```

## Customer

```text
Name
Email
Phone
Company
```

## Billing

```text
Billing details
GSTIN
```

## Items

For EVERY item display:

```text
Product
Selected size
Paper
Thickness
Lamination
Quantity
Design provision
Unit price
Subtotal
GST
Total
```

Only show configuration fields that actually apply to that product.

Do NOT display irrelevant fields such as:

```text
Lamination: N/A
```

unless there is a good UI reason.

---

# 📌 ORDER STATUS

Design the order status system to be extensible.

Initial statuses can include:

```text
Pending
Confirmed
Processing
Ready
Completed
Cancelled
```

However, do not build a complicated production workflow yet.

The order will currently be handled manually by phone/WhatsApp/email.

---

# 🚫 CONVERT TO JOB CARD

The future workflow will eventually be:

```text
Online Order
 ↓
Convert to Job Card
 ↓
Existing GPR Job Card system
```

BUT THIS IS NOT PART OF THIS IMPLEMENTATION.

For now:

### DO NOT IMPLEMENT CONVERSION.

If appropriate, show:

```text
Convert to Job Card
Coming Soon
```

as disabled.

Do not create partial/broken Job Card integration.

---

# 👥 ADMIN — ONLINE CUSTOMERS

Create another Admin page:

> **Online Customers**

This should be separate from internal GPR users.

Show useful information such as:

```text
Customer
Email
Phone
Registration date
Number of orders
Total order value
Last order
Status
```

Customer detail view should allow admin to inspect:

```text
Customer information
Order history
Total orders
Total spent
```

Do not expose sensitive authentication internals.

---

# 🔍 SEARCH / FILTER

Homepage should support product search.

Example:

```text
Search: calendar

→ Monthly Calendar
→ Daily Sheet Calendar
```

Design appropriate filters based on the actual product option architecture.

Do not build useless filters that don't correspond to available product attributes.

---

# ❤️ FUTURE FEATURES

DO NOT implement these unless they already exist:

* Wishlist
* Reviews
* Coupons
* Automated order tracking
* Online payment
* Customer file uploads
* Automatic WhatsApp communication
* Automatic email communication
* Job Card conversion

The architecture should remain extensible for these features later.

---

# 🗄️ SUPABASE DATABASE DESIGN

Before implementation, inspect the current database.

Then propose a clean relational architecture.

Potential conceptual entities may include:

```text
product_categories
products
product_images
product_options
product_option_values
product_pricing_rules
customers
carts
cart_items
online_orders
online_order_items
```

BUT:

### DO NOT blindly create these exact tables.

Determine the best schema based on the existing project.

Avoid unnecessary tables.

Avoid duplicated data.

Use proper foreign keys.

Use timestamps.

Use indexes for frequently queried fields.

Use appropriate constraints.

Use database-side integrity where appropriate.

---

# 🔐 SECURITY / RLS

This is CRITICAL.

Do not leave new tables with:

```sql
allow read, write: true
```

Customer access must be properly restricted.

Customers should only be able to access their own:

* Cart
* Profile
* Orders

Public storefront data should only expose information intended for public viewing.

Admin functionality must respect existing GPR authorization.

Do not weaken existing RLS policies.

Before changing RLS, inspect the current role/permission architecture.

---

# ⚡ PERFORMANCE

The existing GPR website has previously experienced visible skeleton loading and unnecessary repeated requests.

Therefore this feature MUST NOT introduce another performance problem.

Pay particular attention to:

* Product fetching
* Product images
* Cart updates
* Search
* Category filtering
* Customer data
* Order data
* Admin tables

Use:

* Appropriate caching
* Stable query patterns
* Memoization where useful
* Pagination for admin lists
* Lazy loading
* Image optimization
* Debouncing search
* Batched queries where appropriate

DO NOT blindly refetch the entire homepage after every interaction.

Changing:

```text
Quantity
Size
Paper
Lamination
```

should NOT trigger unnecessary full-page loading.

The customer experience should feel instant.

---

# 📱 RESPONSIVE DESIGN

This storefront must be properly responsive.

Prioritize:

### Mobile

### Tablet

### Desktop

Do not simply shrink the desktop layout.

The mobile experience should have:

```text
Compact header
Search
Category navigation
2-column product grid where appropriate
Touch-friendly controls
Bottom/cart accessibility
Responsive product detail UI
```

Product customization must remain comfortable on mobile.

---

# 🎨 DESIGN DIRECTION

The design should be:

* Clean
* Modern
* Professional
* GPR-branded
* Spacious
* Product-focused
* Mobile-friendly

Avoid:

* Excessive gradients
* Excessive shadows
* Overloaded cards
* Huge unnecessary text
* Amazon visual copying
* Generic template appearance
* Placeholder-looking UI

Use the existing GPR design language wherever possible.

The storefront should feel like a **real printing business's online catalog**, not a generic AI-generated e-commerce template.

---

# 🧩 PRODUCT DETAIL EXPERIENCE

Clicking a product should open a detailed product experience.

Depending on the existing routing architecture, this can be:

* Modal/dialog
* Dedicated product route
* Responsive drawer

Choose the approach that provides the best UX and SEO/URL behavior.

The view should contain:

```text
Product images

Product name

Description

Available customization options

Quantity

Design provision

Live price

Add to Cart
```

Price should update immediately when options change.

---

# 🛒 CART EXPERIENCE

Cart should clearly show:

```text
Product image
Product name

Configuration summary

Quantity controls

Unit price

Item total

Remove
```

Then:

```text
Subtotal
GST
Grand Total

[ Continue Shopping ]
[ Proceed to Checkout ]
```

Do not make the cart unnecessarily complicated.

---

# 🧾 ORDER CONFIRMATION

After successful order creation:

Show a clear confirmation screen:

```text
Order placed successfully 🎉

Order ID: XXXXX

We'll contact you shortly regarding
design / confirmation / fulfillment.

[ View My Orders ]
[ Continue Shopping ]
```

Do not claim automated delivery/payment/tracking if those systems do not exist.

---

# 🧪 VALIDATION

Before declaring implementation complete, test:

## Customer

* Homepage
* Hero carousel
* Categories
* Product search
* Product details
* Every product option
* Quantity validation
* Pricing tiers
* GST
* Add to cart
* Multiple configurations of same product
* Guest cart persistence
* Google login
* Cart merge after login
* Checkout
* Order creation
* Order history

## Admin

* Product creation
* Product editing
* Product activation/deactivation
* Product images
* Product options
* Pricing rules
* Online customers
* Customer details
* Online orders
* Order detail
* Status changes
* Disabled Job Card button

## Security

Test that:

* Customer A cannot access Customer B's cart
* Customer A cannot access Customer B's orders
* Customer cannot modify trusted prices
* Customer cannot modify another customer's profile
* Public users cannot access admin data
* Existing admin permissions remain intact

## Responsive

Test:

* Mobile
* Tablet
* Desktop

---

# 🚦 IMPLEMENTATION PROCESS

After the initial audit and architecture proposal, implement in phases.

## PHASE 1

Database architecture + Product Management

## PHASE 2

Customer Homepage + Categories + Product Catalog

## PHASE 3

Product Detail + Dynamic Configuration + Pricing Engine

## PHASE 4

Cart + Persistence

## PHASE 5

Google Customer Authentication + Customer Profile

## PHASE 6

Checkout + GST + Order Creation

## PHASE 7

Online Customers Admin

## PHASE 8

Online Orders Admin

## PHASE 9

Performance + Responsive Polish + Security Audit

---

# 🚨 STRICT RULES FOR ANTIGRAVITY

1. **Do not rewrite the entire application.**

2. **Do not replace the existing design system unnecessarily.**

3. **Do not create duplicate authentication systems if the current architecture can be extended safely.**

4. **Do not hardcode product-specific configuration logic.**

5. **Do not hardcode prices inside React components.**

6. **Do not trust client-submitted prices when creating orders.**

7. **Do not expose Supabase service-role credentials to the browser.**

8. **Do not weaken existing RLS policies.**

9. **Do not introduce unnecessary dependencies.**

10. **Do not create giant monolithic components.**

11. **Reuse existing components/hooks/utilities whenever possible.**

12. **Do not implement future features prematurely.**

13. **Do not break existing GPR modules.**

14. **Do not remove existing functionality to make the new feature easier.**

15. **Do not blindly follow this specification if the existing architecture provides a better established pattern. Explain the deviation first.**

16. **Do not modify code during the initial audit.**

---

# 📋 REQUIRED FIRST RESPONSE

Before making ANY code changes, return a detailed report containing:

### 1. Current architecture summary

### 2. Existing relevant database tables

### 3. Existing authentication architecture

### 4. Existing admin authorization architecture

### 5. Existing Supabase Storage architecture

### 6. Existing frontend routing architecture

### 7. Components/hooks/utilities that can be reused

### 8. Proposed product architecture

### 9. Proposed Supabase schema

### 10. Proposed RLS strategy

### 11. Proposed customer storefront architecture

### 12. Proposed cart architecture

### 13. Proposed pricing architecture

### 14. Proposed online order architecture

### 15. Proposed admin pages

### 16. Hero banner implementation strategy compatible with Vercel

### 17. Performance considerations

### 18. Security considerations

### 19. Risks / conflicts with existing application

### 20. Exact phased implementation plan

For every proposed database modification, clearly show:

```text
Table
Purpose
Important columns
Relationships
Indexes
RLS considerations
```

For every new frontend route/page, clearly show:

```text
Route
Purpose
Access
Components
Data required
```

---

# ⛔ STOP AFTER THE REPORT

After completing the audit and architecture report:

**STOP.**

Do NOT create tables.

Do NOT modify files.

Do NOT modify routes.

Do NOT write components.

Do NOT run migrations.

Do NOT implement anything.

Wait for my explicit approval.

Once I approve, implement only the approved phase.

After each phase:

1. Explain what was changed.
2. List files changed.
3. Explain database changes.
4. Explain security/RLS changes.
5. Test the implementation.
6. Report any issues.
7. Wait for approval before moving to the next phase.

The final goal is a production-quality GPR online storefront that integrates cleanly with the existing application rather than becoming a separate disconnected system.

**Start with the complete audit and architecture report now.**