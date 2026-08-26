import { supabase } from './supabaseClient';

const DEPENDENCY_CONFIG = {
  customers: [
    {
      table: 'sales_invoices',
      foreignKey: 'customer_id',
      label: 'Sales Invoices',
      displayField: 'invoice_no',
      formatLabel: (val) => val,
    },
    {
      table: 'receipts',
      foreignKey: 'customer_id',
      label: 'Receipts',
      displayField: 'receipt_id',
      formatLabel: (val) => `RCP-${val.substring(0, 8).toUpperCase()}`,
    },
    {
      table: 'job_cards',
      foreignKey: 'customer_id',
      label: 'Job Cards',
      displayField: 'job_number',
      formatLabel: (val) => `JC-${String(val).padStart(4, '0')}`,
    },
  ],
  suppliers: [
    {
      table: 'purchase_bills',
      foreignKey: 'supplier_id',
      label: 'Purchase Bills',
      displayField: 'bill_no',
      formatLabel: (val) => val,
    },
    {
      table: 'payments',
      foreignKey: 'supplier_id',
      label: 'Payments',
      displayField: 'payment_id',
      formatLabel: (val) => `PMT-${val.substring(0, 8).toUpperCase()}`,
    },
  ],
  items: [
    {
      table: 'job_card_items',
      foreignKey: 'item_id',
      label: 'Job Material Consumption',
      displayField: 'job_id',
      formatLabel: (val) => `JC-ID-${val.substring(0, 8).toUpperCase()}`, // fallback since job_card_items only has job_id
    },
    {
      table: 'purchase_bill_items',
      foreignKey: 'item_id',
      label: 'Purchase Bill Lines',
      displayField: 'bill_id',
      formatLabel: (val) => `BILL-${val.substring(0, 8).toUpperCase()}`,
    },
    {
      table: 'stock_transactions',
      foreignKey: 'item_id',
      label: 'Stock Transactions',
      displayField: 'txn_id',
      formatLabel: (val) => `TXN-${val.substring(0, 8).toUpperCase()}`,
    },
  ],
  employees: [
    // Currently no operational child tables, but can be added in Phase 2
  ],
  job_cards: [
    {
      table: 'sales_invoices',
      foreignKey: 'job_id',
      label: 'Sales Invoices',
      displayField: 'invoice_no',
      formatLabel: (val) => val,
    },
    {
      table: 'stock_transactions',
      foreignKey: 'reference_id',
      label: 'Stock Transactions',
      displayField: 'txn_id',
      formatLabel: (val) => `TXN-${val.substring(0, 8).toUpperCase()}`,
    },
  ],
  sales_invoices: [
    {
      table: 'receipts',
      foreignKey: 'invoice_id',
      label: 'Receipts',
      displayField: 'receipt_id',
      formatLabel: (val) => `RCP-${val.substring(0, 8).toUpperCase()}`,
    },
  ],
};

/**
 * Checks if a master record has active references in operational or financial tables.
 * @param {string} type - The master record type ('customers', 'suppliers', 'items', 'employees')
 * @param {string} id - The primary key ID of the master record
 * @returns {Promise<{hasReferences: boolean, details: Array<{label: string, count: number, examples: string[]}>}>}
 */
export const checkReferences = async (type, id) => {
  const rules = DEPENDENCY_CONFIG[type];
  if (!rules || !id) {
    return { hasReferences: false, details: [] };
  }

  const results = await Promise.all(
    rules.map(async (rule) => {
      try {
        const { data, error, count } = await supabase
          .from(rule.table)
          .select(rule.displayField, { count: 'exact' })
          .eq(rule.foreignKey, id);

        if (error) {
          console.error(`Error checking dependency in ${rule.table}:`, error.message);
          return null;
        }

        if (count > 0) {
          const examples = (data || []).slice(0, 3).map((row) => {
            const rawValue = row[rule.displayField];
            return rule.formatLabel ? rule.formatLabel(rawValue) : rawValue;
          });

          return {
            label: rule.label,
            count: count,
            examples: examples,
          };
        }
      } catch (err) {
        console.error(`Failed querying references in ${rule.table}:`, err);
      }
      return null;
    })
  );

  const validDetails = results.filter(Boolean);

  return {
    hasReferences: validDetails.length > 0,
    details: validDetails,
  };
};
