/**
 * Tax calculation utilities for orders
 */

export interface TaxConfig {
  enabled: boolean;
  type: string;
  rate: number;
  inclusive: boolean;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
}

export interface TaxBreakdown {
  subtotal: number;
  taxAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  taxType: string;
  isInterState: boolean;
}

/**
 * Calculate tax breakdown for an order
 * @param amount The order amount (product total)
 * @param config Tax configuration from settings
 * @param isInterState Whether the order is inter-state (for IGST vs CGST+SGST)
 * @returns Tax breakdown with all components
 */
export function calculateTax(
  amount: number,
  config: TaxConfig,
  isInterState: boolean = false,
): TaxBreakdown {
  if (!config.enabled) {
    return {
      subtotal: amount,
      taxAmount: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      total: amount,
      taxType: config.type,
      isInterState,
    };
  }

  let subtotal: number;
  let taxAmount: number;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (config.inclusive) {
    // Price includes tax - extract tax from the amount
    if (isInterState) {
      // IGST calculation (inter-state)
      const igstRate = config.igstRate / 100;
      subtotal = amount / (1 + igstRate);
      igst = amount - subtotal;
      taxAmount = igst;
    } else {
      // CGST + SGST calculation (intra-state)
      const totalRate = (config.cgstRate + config.sgstRate) / 100;
      subtotal = amount / (1 + totalRate);
      taxAmount = amount - subtotal;
      cgst = taxAmount / 2;
      sgst = taxAmount / 2;
    }
  } else {
    // Price excludes tax - add tax to the amount
    subtotal = amount;
    if (isInterState) {
      // IGST calculation (inter-state)
      igst = subtotal * (config.igstRate / 100);
      taxAmount = igst;
    } else {
      // CGST + SGST calculation (intra-state)
      cgst = subtotal * (config.cgstRate / 100);
      sgst = subtotal * (config.sgstRate / 100);
      taxAmount = cgst + sgst;
    }
  }

  return {
    subtotal: roundToTwo(subtotal),
    taxAmount: roundToTwo(taxAmount),
    cgst: roundToTwo(cgst),
    sgst: roundToTwo(sgst),
    igst: roundToTwo(igst),
    total: roundToTwo(subtotal + taxAmount),
    taxType: config.type,
    isInterState,
  };
}

/**
 * Calculate shipping charges based on settings
 */
export function calculateShipping(
  orderAmount: number,
  shippingConfig: {
    enabled: boolean;
    freeThreshold: number;
    flatRate: number;
    expressRate: number;
  },
  isExpress: boolean = false,
): number {
  if (!shippingConfig.enabled) {
    return 0;
  }

  // Free shipping if order amount exceeds threshold
  if (
    shippingConfig.freeThreshold > 0 &&
    orderAmount >= shippingConfig.freeThreshold
  ) {
    return 0;
  }

  return isExpress ? shippingConfig.expressRate : shippingConfig.flatRate;
}

/**
 * Calculate complete order totals
 */
export function calculateOrderTotals(
  productAmount: number,
  taxConfig: TaxConfig,
  shippingConfig: {
    enabled: boolean;
    freeThreshold: number;
    flatRate: number;
    expressRate: number;
  },
  discountAmount: number = 0,
  isInterState: boolean = false,
  isExpressShipping: boolean = false,
): {
  subtotal: number;
  discount: number;
  tax: TaxBreakdown;
  shipping: number;
  grandTotal: number;
} {
  // Calculate subtotal after discount
  const subtotalAfterDiscount = Math.max(0, productAmount - discountAmount);

  // Calculate tax on discounted amount
  const tax = calculateTax(subtotalAfterDiscount, taxConfig, isInterState);

  // Calculate shipping based on subtotal
  const shipping = calculateShipping(
    subtotalAfterDiscount,
    shippingConfig,
    isExpressShipping,
  );

  // Calculate grand total
  const grandTotal = tax.total + shipping;

  return {
    subtotal: roundToTwo(productAmount),
    discount: roundToTwo(discountAmount),
    tax,
    shipping: roundToTwo(shipping),
    grandTotal: roundToTwo(grandTotal),
  };
}

/**
 * Format currency amount
 */
export function formatCurrency(
  amount: number,
  currencySymbol: string = "₹",
  locale: string = "en-IN",
): string {
  return `${currencySymbol}${amount.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Round to two decimal places
 */
function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Generate tax invoice number
 */
export function generateInvoiceNumber(
  prefix: string = "INV",
  orderId: string,
): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const shortId = orderId.slice(0, 8).toUpperCase();
  return `${prefix}-${year}${month}-${shortId}`;
}

/**
 * Generate order number
 */
export function generateOrderNumber(
  prefix: string = "ORD",
  sequenceNumber?: number,
): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const timestamp = Date.now().toString().slice(-6);

  if (sequenceNumber !== undefined) {
    return `${prefix}${year}${month}${day}${sequenceNumber.toString().padStart(4, "0")}`;
  }

  return `${prefix}${year}${month}${day}${timestamp}`;
}
