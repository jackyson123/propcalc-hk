import type { Inputs } from "./types";

/**
 * Ad valorem stamp duty ("AVD"), Scale 2 — the rate that applies to every
 * residential property transaction in Hong Kong since the demand-side
 * measures were withdrawn on 2024-02-28.
 *
 * Source: IRD, "從價印花稅" FAQ (Scale 2 / Scale 1 Part 1 table for
 * residential instruments), in force from 2025-02-26 (2025-26 Budget raised
 * the flat $100 cap from $3M to $4M).
 * https://www.ird.gov.hk/chi/faq/avd.htm
 */
export interface StampDutyBracket {
  /** Upper bound of the band (inclusive), HKD. Use Infinity for the top band. */
  upTo: number;
  /** Fixed amount at the start of the band, or 0 for a pure percentage band. */
  base: number;
  /** Amount above this threshold is charged at marginalRate. */
  marginalFrom: number;
  /** Marginal rate in percent (0 for the flat $100 band). */
  marginalRate: number;
  /** Flat amount applied when marginalRate is 0. */
  flat: number;
}

export const STAMP_DUTY_BRACKETS: StampDutyBracket[] = [
  { upTo: 4_000_000, base: 0, marginalFrom: 0, marginalRate: 0, flat: 100 },
  { upTo: 4_323_780, base: 100, marginalFrom: 4_000_000, marginalRate: 20, flat: 0 },
  { upTo: 4_500_000, base: 0, marginalFrom: 0, marginalRate: 1.5, flat: 0 },
  { upTo: 4_935_480, base: 67_500, marginalFrom: 4_500_000, marginalRate: 10, flat: 0 },
  { upTo: 6_000_000, base: 0, marginalFrom: 0, marginalRate: 2.25, flat: 0 },
  { upTo: 6_642_860, base: 135_000, marginalFrom: 6_000_000, marginalRate: 10, flat: 0 },
  { upTo: 9_000_000, base: 0, marginalFrom: 0, marginalRate: 3, flat: 0 },
  { upTo: 10_080_000, base: 270_000, marginalFrom: 9_000_000, marginalRate: 10, flat: 0 },
  { upTo: 20_000_000, base: 0, marginalFrom: 0, marginalRate: 3.75, flat: 0 },
  { upTo: 21_739_120, base: 750_000, marginalFrom: 20_000_000, marginalRate: 10, flat: 0 },
  { upTo: 100_000_000, base: 0, marginalFrom: 0, marginalRate: 4.25, flat: 0 },
  { upTo: 109_574_470, base: 4_250_000, marginalFrom: 100_000_000, marginalRate: 30, flat: 0 },
  { upTo: Number.POSITIVE_INFINITY, base: 0, marginalFrom: 0, marginalRate: 6.5, flat: 0 },
];

/**
 * Mortgage insurance programme (MIP / 按保) LTV caps set by HKMC Insurance
 * for applications with a provisional sale and purchase agreement signed on
 * or after 2024-10-16.
 * https://www.hkmc.com.hk/chi/our_business/mortgage_insurance_programme.html
 */
export interface MipBand {
  upTo: number;
  /** Highest LTV without the "no other property + salaried" conditions. */
  baseLtvPct: number;
  /** Highest LTV allowed for first-time buyers who are salaried. */
  highLtvPct: number;
  /** Maximum loan amount in HKD. */
  loanCap?: number;
}

export const MIP_BANDS: MipBand[] = [
  { upTo: 10_000_000, baseLtvPct: 80, highLtvPct: 90 },
  { upTo: 11_250_000, baseLtvPct: 80, highLtvPct: 90, loanCap: 9_000_000 },
  { upTo: 15_000_000, baseLtvPct: 80, highLtvPct: 80 },
  { upTo: 17_150_000, baseLtvPct: 80, highLtvPct: 80, loanCap: 12_000_000 },
];

/**
 * Single premium as a percentage of the loan, floating-rate plan, by property
 * price band, LTV band and term. Terms not listed are interpolated linearly.
 * Source: HKMCI premium rate sheets (October 2024), already net of the
 * standard discount.
 * https://www.hkmc.com.hk/files/product_file/3/1398/Premium%20Rate%20Sheet_Chi_clean_16102024.pdf
 */
export const PREMIUM_TERMS = [10, 15, 20, 25, 30];

export interface PremiumTable {
  /** Property price upper bound this sheet applies to. */
  upTo: number;
  /** Keyed by LTV band ceiling: 80, 85 or 90. */
  bands: Record<number, number[]>;
}

export const PREMIUM_TABLES: PremiumTable[] = [
  {
    upTo: 6_000_000,
    bands: {
      80: [0.65, 0.75, 0.91, 0.98, 1.07],
      85: [0.86, 1.02, 1.25, 1.35, 1.41],
      90: [1.25, 1.48, 1.79, 2.03, 2.16],
    },
  },
  {
    upTo: 15_000_000,
    bands: {
      80: [0.6, 0.71, 0.9, 0.97, 1.09],
      85: [1.01, 1.2, 1.46, 1.57, 1.64],
      90: [1.46, 1.72, 2.08, 2.35, 2.5],
    },
  },
  {
    upTo: 17_150_000,
    bands: {
      80: [0.75, 0.86, 1.05, 1.12, 1.24],
    },
  },
];

/** HKMA maximum LTV for a self-use residential property (no MIP). */
export const BANK_LTV = {
  /** Up to this price, 70% is available. */
  fullThreshold: 30_000_000,
  /** From this price, 60% is the ceiling. */
  lowThreshold: 35_000_000,
  highLtvPct: 70,
  lowLtvPct: 60,
};

export const DEFAULTS: Inputs = {
  price: 5_500_000,
  ltvPct: 80,
  termYears: 30,
  ratePlan: "H",
  hibor: 2.71,
  hSpread: 1.3,
  prime: 5,
  capSpread: 1.75,
  pSpread: 1.75,
  agentPct: 1,
  legalFee: 8_000,
  miscFee: 5_000,
  firstTime: true,
  fixedIncome: true,
  mipFinanced: true,
  monthlyIncome: 60_000,
  otherDebts: 0,
  monthlyRent: 17_500,
  mgmtFee: 1_800,
  ratesPct: 8,
  maintenancePct: 5,
  vacancyPct: 4,
  rentGrowth: 3,
  priceGrowth: 2,
  investReturn: 5,
  sellCostPct: 1.5,
  horizonYears: 30,
};

export interface FieldLimit {
  min: number;
  max: number;
  step: number;
}

export const LIMITS: Record<
  "price" | "ltvPct" | "termYears" | "hibor" | "hSpread" | "prime" | "capSpread" |
  "pSpread" | "agentPct" | "legalFee" | "miscFee" | "monthlyIncome" | "otherDebts" |
  "monthlyRent" | "mgmtFee" | "ratesPct" | "maintenancePct" | "vacancyPct" |
  "rentGrowth" | "priceGrowth" | "investReturn" | "sellCostPct" | "horizonYears",
  FieldLimit
> = {
  price: { min: 1_000_000, max: 60_000_000, step: 10_000 },
  ltvPct: { min: 10, max: 90, step: 1 },
  termYears: { min: 10, max: 30, step: 1 },
  hibor: { min: 0, max: 10, step: 0.01 },
  hSpread: { min: 0, max: 4, step: 0.05 },
  prime: { min: 3, max: 10, step: 0.05 },
  capSpread: { min: 0, max: 4, step: 0.05 },
  pSpread: { min: 0, max: 4, step: 0.05 },
  agentPct: { min: 0, max: 3, step: 0.05 },
  legalFee: { min: 0, max: 50_000, step: 500 },
  miscFee: { min: 0, max: 100_000, step: 500 },
  monthlyIncome: { min: 0, max: 1_000_000, step: 1_000 },
  otherDebts: { min: 0, max: 200_000, step: 500 },
  monthlyRent: { min: 0, max: 300_000, step: 500 },
  mgmtFee: { min: 0, max: 30_000, step: 100 },
  ratesPct: { min: 0, max: 15, step: 0.5 },
  maintenancePct: { min: 0, max: 20, step: 0.5 },
  vacancyPct: { min: 0, max: 20, step: 0.5 },
  rentGrowth: { min: -5, max: 10, step: 0.1 },
  priceGrowth: { min: -5, max: 10, step: 0.1 },
  investReturn: { min: 0, max: 15, step: 0.1 },
  sellCostPct: { min: 0, max: 5, step: 0.1 },
  horizonYears: { min: 5, max: 40, step: 1 },
};

export const LTV_PRESETS = [60, 70, 80, 85, 90];
