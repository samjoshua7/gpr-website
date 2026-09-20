import { supabase } from '../../lib/supabaseClient';

let cachedDashboardData = null;
let lastFetchTimeDashboard = null;
let dashboardCacheGeneration = 0;
const DASHBOARD_CACHE_TTL = 2 * 60 * 1000; // 2 minutes — shorter for aggregate metrics

export const getCachedDashboardData = () => cachedDashboardData;

export const invalidateDashboardCache = () => {
  dashboardCacheGeneration++;
  lastFetchTimeDashboard = null;
};

export const getDashboardData = async (forceRefresh = false) => {
  const fetchGen = dashboardCacheGeneration;
  if (!forceRefresh && cachedDashboardData && lastFetchTimeDashboard && (Date.now() - lastFetchTimeDashboard < DASHBOARD_CACHE_TTL)) {
    return cachedDashboardData;
  }

  const [
    { data: invoices },
    { data: tasks },
    { data: items },
    { count: customerCount },
    { data: settings },
  ] = await Promise.all([
    supabase.from('sales_invoices').select('invoice_date, total_amount, amount_paid, status'),
    supabase.from('job_cards').select('status'),
    supabase.from('items').select('name, current_stock, reorder_level, unit'),
    supabase.from('customers').select('customer_id', { count: 'exact', head: true }),
    supabase.from('company_settings').select('production_workflow').single(),
  ]);

  const activeInvoices = (invoices || []).filter((inv) => inv.status !== 'void');

  // Revenue trend is ordered chronologically and limited to the latest 12 active months.
  const monthlyRevenueMap = new Map();
  activeInvoices.forEach((invoice) => {
    if (!invoice.invoice_date) return;
    const date = new Date(`${invoice.invoice_date}T00:00:00`);
    if (Number.isNaN(date.getTime())) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const current = monthlyRevenueMap.get(key) || {
      key,
      month: date.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
      revenue: 0,
    };
    current.revenue += parseFloat(invoice.total_amount) || 0;
    monthlyRevenueMap.set(key, current);
  });

  const revenueTrend = [...monthlyRevenueMap.values()]
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(-12)
    .map(({ month, revenue }) => ({ month, revenue }));
  // 2. Receivables vs Collected
  let totalBilled = 0;
  let totalPaid = 0;
  activeInvoices.forEach((inv) => {
    totalBilled += parseFloat(inv.total_amount) || 0;
    totalPaid += parseFloat(inv.amount_paid) || 0;
  });
  const outstanding = Math.max(0, totalBilled - totalPaid);

  const financialDistribution = [
    { name: 'Collected', value: totalPaid, color: '#10b981' },
    { name: 'Outstanding', value: outstanding, color: '#ef4444' },
  ];

  // 3. Production Pipeline distribution across workflow stages
  const workflow = settings?.production_workflow || [
    'New Orders',
    'Designing',
    'Proof',
    'Printing',
    'Additional works',
    'Cutting',
    'Packing',
    'Out for Delivery',
    'Delivered',
  ];

  const taskCountsByStage = {};
  workflow.forEach((stage) => {
    taskCountsByStage[stage] = 0;
  });

  (tasks || []).forEach((t) => {
    if (t.status && taskCountsByStage[t.status] !== undefined) {
      taskCountsByStage[t.status] += 1;
    }
  });

  const pipelineData = workflow.map((stage) => ({
    stage,
    count: taskCountsByStage[stage] || 0,
  }));

  const normalizedItems = (items || []).map((item) => ({
    name: item.name,
    stock: parseFloat(item.current_stock) || 0,
    reorder: parseFloat(item.reorder_level) || 0,
  }));
  const lowStockCount = normalizedItems.filter((item) => item.reorder > 0 && item.stock <= item.reorder).length;
  const inventoryStockData = normalizedItems
    .sort((a, b) => (a.stock - a.reorder) - (b.stock - b.reorder))
    .slice(0, 8);
  const result = {
    customerCount: customerCount || 0,
    activeInvoiceCount: activeInvoices.length,
    taskCount: (tasks || []).length,
    itemCount: (items || []).length,
    lowStockCount,
    totalBilled,
    totalPaid,
    outstanding,
    revenueTrend,
    financialDistribution,
    pipelineData,
    inventoryStockData,
  };

  if (dashboardCacheGeneration === fetchGen) {
    cachedDashboardData = result;
    lastFetchTimeDashboard = Date.now();
  }

  return result;
};
