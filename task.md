# Online Storefront Implementation Tasks

## Phase 1: Database Foundation & Admin Product Management
- [x] Create SQL Migration `032_online_store_schema.sql` (12 tables, storage buckets, RLS, triggers, seed data) <!-- id: 0 -->
- [x] User executes Migration `032_online_store_schema.sql` in Supabase SQL Editor <!-- id: 1 -->
- [x] Build `src/features/productManagement/api.js` (Supabase CRUD for categories, products, options, values, tiers, images) <!-- id: 2 -->
- [x] Build `src/features/productManagement/components/ProductFormDialog.jsx` <!-- id: 3 -->
- [x] Build `src/features/productManagement/components/ProductOptionsEditor.jsx` <!-- id: 4 -->
- [x] Build `src/features/productManagement/components/PricingTiersEditor.jsx` <!-- id: 5 -->
- [x] Build `src/features/productManagement/components/CategoryFormDialog.jsx` <!-- id: 6 -->
- [x] Build `src/features/productManagement/page.jsx` (High-density admin table, filters, search, toggle status) <!-- id: 7 -->
- [x] Register `/dashboard/products` route and add to AppShell sidebar under "Storefront" <!-- id: 8 -->

## Phase 2: Storefront Catalog & Live Customizer
- [x] Build `src/features/store/api.js` (Public catalog fetching, active products, options, quantity pricing) <!-- id: 9 -->
- [x] Build `src/features/store/components/StoreHeader.jsx` & `StoreFooter.jsx` <!-- id: 10 -->
- [x] Build `src/features/store/components/HeroCarousel.jsx` (using Swiper) <!-- id: 11 -->
- [x] Build `src/features/store/components/CategoryGrid.jsx` & `ProductCard.jsx` <!-- id: 12 -->
- [x] Build `src/features/store/components/PricingCalculator.jsx` (Live unit price and line subtotal calculation) <!-- id: 13 -->
- [x] Rebuild `src/features/public/page.jsx` (Dynamic DB-driven homepage) <!-- id: 14 -->
- [x] Build `src/features/store/pages/ProductCatalogPage.jsx` (`/products` - search, category filters, sorting) <!-- id: 15 -->
- [x] Build `src/features/store/pages/ProductDetailPage.jsx` (`/products/:slug` - gallery, options selector, quantity slider/input, live price breakdown) <!-- id: 16 -->

## Phase 3: Cart System (Guest + Synced)
- [x] Build Cart Context / Hook `src/features/store/context/CartContext.jsx` <!-- id: 17 -->
- [x] Build `src/features/store/pages/CartPage.jsx` (`/cart` - quantity modifier, delete, price summary) <!-- id: 18 -->

## Phase 4: Customer Auth & Checkout Flow
- [x] Verify Google Auth self-provisioning in `AuthProvider.jsx` <!-- id: 19 -->
- [x] Build `src/features/store/pages/CheckoutPage.jsx` (`/checkout` - billing address, GSTIN, order review, place order) <!-- id: 20 -->
- [x] Build `src/features/store/pages/OrderConfirmationPage.jsx` (`/order-confirmation/:orderId`) <!-- id: 21 -->

## Phase 5: Customer Portal
- [x] Build `src/features/store/pages/CustomerAccountPage.jsx` (`/account` - profile, address book) <!-- id: 22 -->
- [x] Build `src/features/store/pages/CustomerOrdersPage.jsx` (`/account/orders` - order history & status tracking) <!-- id: 23 -->
- [x] Build `src/features/store/pages/CustomerOrderDetailPage.jsx` (`/account/orders/:orderId` - item snapshots, print invoice summary) <!-- id: 24 -->

## Phase 6: Admin Online Orders & Customers
- [x] Build `src/features/onlineOrders/api.js` & `page.jsx` (`/dashboard/online-orders` - status update, details dialog) <!-- id: 25 -->
- [x] Build `src/features/onlineCustomers/api.js` & `page.jsx` (`/dashboard/online-customers` - customer list, orders count) <!-- id: 26 -->
- [x] Register admin routes and add nav links in AppShell <!-- id: 27 -->

## Phase 7: Verification & Handover
- [x] Run `npm run lint` <!-- id: 28 -->
- [ ] Run `npm run build` <!-- id: 29 -->
- [x] Update `HANDOVER.md` <!-- id: 30 -->
