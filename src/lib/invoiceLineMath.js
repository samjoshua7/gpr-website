/**
 * Invoice line item calculation module (forward and reverse calculations)
 */

export function forwardLineTotal({ quantity = 1, unitPrice = 0, gstRate = 0, isGst = false }) {
  const qty = parseFloat(quantity) || 0;
  const rate = parseFloat(unitPrice) || 0;
  const gst = isGst ? (parseFloat(gstRate) || 0) : 0;

  const lineSubtotal = qty * rate;
  const taxAmount = (lineSubtotal * gst) / 100;
  const lineTotal = lineSubtotal + taxAmount;

  const roundedUnitPrice = Math.round(rate * 100) / 100;
  const roundedTaxAmount = Math.round(taxAmount * 100) / 100;
  const roundedAmount = Math.round(lineTotal * 100) / 100;

  return {
    quantity: qty,
    unitPrice: roundedUnitPrice,
    taxAmount: roundedTaxAmount,
    amount: roundedAmount,
  };
}

export function reverseFromLineTotal({ lineTotal = 0, quantity = 1, gstRate = 0, isGst = false }) {
  const total = parseFloat(lineTotal) || 0;
  const qty = parseFloat(quantity) || 0;
  const gst = isGst ? (parseFloat(gstRate) || 0) : 0;

  if (qty <= 0) {
    return {
      quantity: qty,
      unitPrice: 0,
      taxAmount: 0,
      amount: 0,
    };
  }

  let rawUnitPrice = 0;
  let taxAmount = 0;
  if (isGst && gst > 0) {
    const baseAmount = total / (1 + gst / 100);
    rawUnitPrice = baseAmount / qty;
    taxAmount = Math.round((total - baseAmount) * 100) / 100;
  } else {
    rawUnitPrice = total / qty;
    taxAmount = 0;
  }

  const roundedUnitPrice = Math.round(rawUnitPrice * 100) / 100;

  return {
    quantity: qty,
    unitPrice: roundedUnitPrice,
    taxAmount,
    amount: Math.round(total * 100) / 100,
  };
}

export default {
  forwardLineTotal,
  reverseFromLineTotal,
};
