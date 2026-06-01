/**
 * lib/gst.ts
 * GST calculation utilities for LavishOrganic.
 *
 * Rules:
 * - Intra-state sales (seller state == buyer state): CGST + SGST (split equally)
 * - Inter-state sales: IGST (full rate)
 * - LavishOrganic is registered in Gujarat (state code: 24)
 */

import type { GSTBreakdown, OrderItem } from '@/types';

// LavishOrganic seller state (from env)
const SELLER_STATE = process.env.GST_REGISTERED_STATE ?? 'Gujarat';
const SELLER_STATE_CODE = process.env.GST_REGISTERED_STATE_CODE ?? '24';

/**
 * Calculates GST breakdown for a given amount and rate.
 *
 * @param taxableAmount - Amount before tax (in INR)
 * @param gstRate - Total GST rate (e.g., 18 for 18%)
 * @param buyerState - Buyer's state (from shipping address)
 * @returns Full GST breakdown with CGST/SGST or IGST
 */
export function calculateGST(
  taxableAmount: number,
  gstRate: number,
  buyerState: string
): GSTBreakdown {
  const isInterstate = normalizeState(buyerState) !== normalizeState(SELLER_STATE);

  if (isInterstate) {
    // Inter-state: IGST only
    const igstAmount = roundToTwo(taxableAmount * (gstRate / 100));
    return {
      taxable_amount: taxableAmount,
      cgst_rate: 0,
      cgst_amount: 0,
      sgst_rate: 0,
      sgst_amount: 0,
      igst_rate: gstRate,
      igst_amount: igstAmount,
      total_gst: igstAmount,
      total_amount: roundToTwo(taxableAmount + igstAmount),
    };
  } else {
    // Intra-state: CGST + SGST (each = half of total GST rate)
    const halfRate = gstRate / 2;
    const cgstAmount = roundToTwo(taxableAmount * (halfRate / 100));
    const sgstAmount = roundToTwo(taxableAmount * (halfRate / 100));
    const totalGst = roundToTwo(cgstAmount + sgstAmount);

    return {
      taxable_amount: taxableAmount,
      cgst_rate: halfRate,
      cgst_amount: cgstAmount,
      sgst_rate: halfRate,
      sgst_amount: sgstAmount,
      igst_rate: 0,
      igst_amount: 0,
      total_gst: totalGst,
      total_amount: roundToTwo(taxableAmount + totalGst),
    };
  }
}

/**
 * Calculates the taxable amount from a GST-inclusive price.
 * Used when products are priced inclusive of GST.
 *
 * taxable = inclusive_price / (1 + gst_rate/100)
 */
export function extractTaxableAmount(
  inclusivePrice: number,
  gstRate: number
): number {
  return roundToTwo(inclusivePrice / (1 + gstRate / 100));
}

/**
 * Calculates total GST for an entire order.
 * Returns per-item breakdown for GST invoice.
 */
export function calculateOrderGST(
  items: OrderItem[],
  buyerState: string,
  gstEnabled: boolean = true
): {
  items: Array<OrderItem & { gst_breakdown: GSTBreakdown }>;
  total_taxable: number;
  total_cgst: number;
  total_sgst: number;
  total_igst: number;
  total_gst: number;
  is_interstate: boolean;
} {
  const isInterstate = normalizeState(buyerState) !== normalizeState(SELLER_STATE);
  let total_taxable = 0;
  let total_cgst = 0;
  let total_sgst = 0;
  let total_igst = 0;

  const itemsWithGST = items.map((item) => {
    const gstRate = gstEnabled ? (item.gst_rate ?? 18) : 0;
    const taxableAmount = gstEnabled ? extractTaxableAmount(item.total_price, gstRate) : item.total_price;
    const gst_breakdown = gstEnabled 
      ? calculateGST(taxableAmount, gstRate, buyerState)
      : {
          taxable_amount: item.total_price,
          cgst_rate: 0, cgst_amount: 0,
          sgst_rate: 0, sgst_amount: 0,
          igst_rate: 0, igst_amount: 0,
          total_gst: 0, total_amount: item.total_price
        };

    total_taxable += taxableAmount;
    total_cgst += gst_breakdown.cgst_amount;
    total_sgst += gst_breakdown.sgst_amount;
    total_igst += gst_breakdown.igst_amount;

    return { ...item, gst_breakdown };
  });

  return {
    items: itemsWithGST,
    total_taxable: roundToTwo(total_taxable),
    total_cgst: roundToTwo(total_cgst),
    total_sgst: roundToTwo(total_sgst),
    total_igst: roundToTwo(total_igst),
    total_gst: roundToTwo(total_cgst + total_sgst + total_igst),
    is_interstate: isInterstate,
  };
}

/**
 * Returns the seller state and state code for invoice headers.
 */
export function getSellerGSTInfo(): {
  state: string;
  state_code: string;
  gstin: string;
  business_name: string;
  address: string;
} {
  return {
    state: SELLER_STATE,
    state_code: SELLER_STATE_CODE,
    gstin: process.env.GSTIN ?? 'NOT_SET',
    business_name: process.env.GST_BUSINESS_NAME ?? 'LavishOrganic',
    address: process.env.GST_REGISTERED_ADDRESS ?? '',
  };
}

// ============================================================
// HELPERS
// ============================================================

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeState(state: string): string {
  return state.trim().toLowerCase().replace(/\s+/g, '');
}

/**
 * Indian state code mapping for GST invoice.
 */
export const INDIAN_STATES: Record<string, string> = {
  'Andhra Pradesh': '37',
  'Arunachal Pradesh': '12',
  Assam: '18',
  Bihar: '10',
  Chhattisgarh: '22',
  Goa: '30',
  Gujarat: '24',
  Haryana: '06',
  'Himachal Pradesh': '02',
  'Jammu and Kashmir': '01',
  Jharkhand: '20',
  Karnataka: '29',
  Kerala: '32',
  Ladakh: '38',
  'Madhya Pradesh': '23',
  Maharashtra: '27',
  Manipur: '14',
  Meghalaya: '17',
  Mizoram: '15',
  Nagaland: '13',
  Odisha: '21',
  Punjab: '03',
  Rajasthan: '08',
  Sikkim: '11',
  'Tamil Nadu': '33',
  Telangana: '36',
  Tripura: '16',
  'Uttar Pradesh': '09',
  Uttarakhand: '05',
  'West Bengal': '19',
  'Delhi': '07',
  Chandigarh: '04',
};

export function getStateCode(stateName: string): string {
  return INDIAN_STATES[stateName] ?? '00';
}
