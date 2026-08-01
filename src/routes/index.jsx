import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthGuard } from './guards/AuthGuard';

// Layout and Feedback Pages
import AppShell from '../components/layout/AppShell';
import NotFoundPage from '../components/feedback/NotFoundPage';

// Feature Pages
import { LoginPage } from '../features/auth/page';
import { PublicHomePage } from '../features/public/page';
import { DashboardPage } from '../features/dashboard/page';
import { CustomersPage } from '../features/customers/page';
import { JobCardsPage } from '../features/jobCards/page';
import { SalesInvoicesPage } from '../features/salesInvoices/page';
import { ReceiptsPage } from '../features/receipts/page';
import { InventoryPage } from '../features/inventory/page';
import { SuppliersPage } from '../features/suppliers/page';
import { PurchaseBillsPage } from '../features/purchaseBills/page';
import { PaymentsPage } from '../features/payments/page';
import { EmployeesPage } from '../features/employees/page';
import { SettingsPage } from '../features/settings/page';

// Basic unauthorized page
const UnauthorizedPage = () => (
  <div style={{ padding: 48, textAlign: 'center', fontFamily: 'sans-serif' }}>
    <h2>Unauthorized Access</h2>
    <p>You do not have permission to view this resource.</p>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicHomePage />,
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
      <AuthGuard allowedRoles={['SUPER_ADMIN', 'STAFF']}>
        <AppShell />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'customers',
        element: <CustomersPage />,
      },
      {
        path: 'jobs',
        element: <JobCardsPage />,
      },
      {
        path: 'invoices',
        element: <SalesInvoicesPage />,
      },
      {
        path: 'receipts',
        element: <ReceiptsPage />,
      },
      {
        path: 'inventory',
        element: <InventoryPage />,
      },
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
      {
        path: 'employees',
        element: (
          <AuthGuard allowedRoles={['SUPER_ADMIN']}>
            <EmployeesPage />
          </AuthGuard>
        ),
      },
      {
        path: 'settings',
        element: (
          <AuthGuard allowedRoles={['SUPER_ADMIN']}>
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
]);
