import { supabase } from '../../lib/supabaseClient';

export const getDashboardData = async () => {
  const [
    { data: invoices },
    { data: receipts },
    { data: tasks },
    { data: items },
    { data: customers },
    { data: settings },
  ] = await Promise.all([
    supabase.from('sales_invoices').select('invoice_date, total_amount, amount_paid, status'),
    supabase.from('receipts').select('receipt_date, amount, mode'),
    supabase.from('job_cards').select('status'),
    supabase.from('items').select('name, current_stock, reorder_level, unit'),
    supabase.from('customers').select('customer_id', { count: 'exact', head: true }),
    supabase.from('company_settings').select('production_workflow').single(),
  ]);

  const activeInvoices = (invoices || []).filter((inv) => inv.status !== 'void');

  // 1. Revenue over time (Monthly)
  const monthlyRevenueMap = {};
  activeInvoices.forEach((inv) => {
    if (!inv.invoice_date) return;
    const date = new Date(inv.invoice_date);
    const monthKey = date.toLocaleString('default', { month: 'short', year: '2-digit' });
    monthlyRevenueMap[monthKey] = (monthlyRevenueMap[monthKey] || 0) + (parseFloat(inv.total_amount) || 0);
  });

  const revenueTrend = Object.keys(monthlyRevenueMap).map((month) => ({
    month,
    revenue: monthlyRevenueMap[month],
  }));

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

  // 4. Low stock inventory materials
  const inventoryStockData = (items || [])
    .slice(0, 8)
    .map((item) => ({
      name: item.name,
      stock: parseFloat(item.current_stock) || 0,
      reorder: parseFloat(item.reorder_level) || 0,
    }));

  return {
    customerCount: customers?.length || 0,
    activeInvoiceCount: activeInvoices.length,
    taskCount: (tasks || []).length,
    itemCount: (items || []).length,
    totalBilled,
    totalPaid,
    outstanding,
    revenueTrend,
    financialDistribution,
    pipelineData,
    inventoryStockData,
  };
};
