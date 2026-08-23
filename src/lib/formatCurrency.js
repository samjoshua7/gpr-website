/**
 * Standard Indian Rupee currency formatter (e.g. ₹ 1,250.00)
 */
const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0.00';
  return currencyFormatter.format(amount);
};

export default formatCurrency;
