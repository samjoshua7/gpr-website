import React from 'react';
import { createBrowserRouter, Outlet } from 'react-router-dom';
import { AuthGuard } from './guards/AuthGuard';
import { ScrollToTop } from '../features/store/components/ScrollToTop';

// Layout and Feedback Pages
import AppShell from '../components/layout/AppShell';
import NotFoundPage from '../components/feedback/NotFoundPage';
import RouteErrorPage from '../components/feedback/RouteErrorPage';

// Feature Pages
import { LoginPage } from '../features/auth/page';
import { PublicHomePage } from '../features/public/page';
import { DashboardPage } from '../features/dashboard/page';
import { CustomersPage } from '../features/customers/page';
import { CustomerLedgerPage } from '../features/customers/CustomerLedgerPage';
import { JobCardsPage } from '../features/jobCards/page';
import { QuotationsPage } from '../features/quotations/page';
import { SalesInvoicesPage } from '../features/salesInvoices/page';
import { ReceiptsPage } from '../features/receipts/page';
import { InventoryPage } from '../features/inventory/page';
// import { SuppliersPage } from '../features/suppliers/page';
// import { PurchaseBillsPage } from '../features/purchaseBills/page';
// import { PaymentsPage } from '../features/payments/page';
import { StatementsPage } from '../features/statements/page';
import { EmployeesPage } from '../features/employees/page';
import { SettingsPage } from '../features/settings/page';
import { ProductManagementPage } from '../features/productManagement/page';
import { ProductCatalogPage } from '../features/store/pages/ProductCatalogPage';
import { ProductDetailPage } from '../features/store/pages/ProductDetailPage';
import { CartPage } from '../features/store/pages/CartPage';
import { CheckoutPage } from '../features/store/pages/CheckoutPage';
import { OrderConfirmationPage } from '../features/store/pages/OrderConfirmationPage';
import { CustomerAccountPage } from '../features/store/pages/CustomerAccountPage';
import { CustomerOrdersPage } from '../features/store/pages/CustomerOrdersPage';
import { CustomerOrderDetailPage } from '../features/store/pages/CustomerOrderDetailPage';
import { OnlineOrdersPage } from '../features/onlineOrders/page';
import { OnlineCustomersPage } from '../features/onlineCustomers/page';
import { HeroBannersPage } from '../features/heroBanners/page';
import { AboutPage } from '../features/store/pages/AboutPage';

// Basic unauthorized page
const UnauthorizedPage = () => (
  <div style={{ padding: 48, textAlign: 'center', fontFamily: 'sans-serif' }}>
    <h2>Unauthorized Access</h2>
    <p>You do not have permission to view this resource.</p>
  </div>
);

const RootLayout = () => (
  <>
    <ScrollToTop />
    <Outlet />
  </>
);

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/',
        element: <PublicHomePage />,
      },
  {
    path: '/about',
    element: <AboutPage />,
  },
  {
    path: '/products',
    element: <ProductCatalogPage />,
  },
  {
    path: '/products/:slug',
    element: <ProductDetailPage />,
  },
  {
    path: '/cart',
    element: <CartPage />,
  },
  {
    path: '/checkout',
    element: <CheckoutPage />,
  },
  {
    path: '/order-confirmation/:orderId',
    element: <OrderConfirmationPage />,
  },
  {
    path: '/account',
    element: <CustomerAccountPage />,
  },
  {
    path: '/account/orders',
    element: <CustomerOrdersPage />,
  },
  {
    path: '/account/orders/:orderId',
    element: <CustomerOrderDetailPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },
  {
    path: '/dashboard',
    element: (
      <AuthGuard allowedRoles={['SUPER_ADMIN', 'ACCOUNTS', 'STAFF', 'STAKEHOLDER']}>
        <AppShell />
      </AuthGuard>
    ),
    errorElement: <RouteErrorPage />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'customers',
        element: (
          <AuthGuard allowedRoles={['SUPER_ADMIN', 'ACCOUNTS', 'STAKEHOLDER']}>
            <CustomersPage />
          </AuthGuard>
        ),
      },
      {
        path: 'customers/:customerId',
        element: (
          <AuthGuard allowedRoles={['SUPER_ADMIN', 'ACCOUNTS', 'STAKEHOLDER']}>
            <CustomerLedgerPage />
          </AuthGuard>
        ),
      },
      {
        path: 'jobs',
        element: (
          <AuthGuard allowedRoles={['SUPER_ADMIN', 'ACCOUNTS', 'STAFF', 'STAKEHOLDER']}>
            <JobCardsPage />
          </AuthGuard>
        ),
      },
      {
        path: 'quotations',
        element: (
          <AuthGuard allowedRoles={['SUPER_ADMIN', 'ACCOUNTS', 'STAKEHOLDER']}>
            <QuotationsPage />
          </AuthGuard>
        ),
      },
      {
        path: 'invoices',
        element: (
          <AuthGuard allowedRoles={['SUPER_ADMIN', 'ACCOUNTS', 'STAKEHOLDER']}>
            <SalesInvoicesPage />
          </AuthGuard>
        ),
      },
      {
        path: 'receipts',
        element: (
          <AuthGuard allowedRoles={['SUPER_ADMIN', 'ACCOUNTS', 'STAKEHOLDER']}>
            <ReceiptsPage />
          </AuthGuard>
        ),
      },
      {
        path: 'inventory',
        element: (
          <AuthGuard allowedRoles={['SUPER_ADMIN', 'ACCOUNTS', 'STAKEHOLDER']}>
            <InventoryPage />
          </AuthGuard>
        ),
      },
      {
        path: 'products',
        element: (
          <AuthGuard allowedRoles={['SUPER_ADMIN']}>
            <ProductManagementPage />
          </AuthGuard>
        ),
      },
      {
        path: 'hero-banners',
        element: (
          <AuthGuard allowedRoles={['SUPER_ADMIN']}>
            <HeroBannersPage />
          </AuthGuard>
        ),
      },
      {
        path: 'online-orders',
        element: (
          <AuthGuard allowedRoles={['SUPER_ADMIN', 'ACCOUNTS', 'STAKEHOLDER']}>
            <OnlineOrdersPage />
          </AuthGuard>
        ),
      },
      {
        path: 'online-customers',
        element: (
          <AuthGuard allowedRoles={['SUPER_ADMIN', 'ACCOUNTS', 'STAKEHOLDER']}>
            <OnlineCustomersPage />
          </AuthGuard>
        ),
      },
      {
        path: 'statements',
        element: (
          <AuthGuard allowedRoles={['SUPER_ADMIN', 'ACCOUNTS', 'STAKEHOLDER']}>
            <StatementsPage />
          </AuthGuard>
        ),
      },
      /* Skipped Phase 2 Routes
      {
        path: 'suppliers',
        element: <SuppliersPage />,
      },
      {
        path: 'purchase-bills',
        element: <PurchaseBillsPage />,
      },
      {
        path: 'payments',
        element: <PaymentsPage />,
      },
      */
      {
        path: 'employees',
        element: (
          <AuthGuard allowedRoles={['SUPER_ADMIN', 'STAKEHOLDER']}>
            <EmployeesPage />
          </AuthGuard>
        ),
      },
      {
        path: 'settings',
        element: (
          <AuthGuard allowedRoles={['SUPER_ADMIN', 'STAKEHOLDER']}>
            <SettingsPage />
          </AuthGuard>
        ),
      },
    ],
  },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
