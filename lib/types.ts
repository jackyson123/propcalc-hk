export type Lang = "zh" | "en";

export type TabId = "upfront" | "mortgage" | "rentbuy" | "yield";

export type RatePlan = "H" | "P";

export interface Inputs {
  /** Property price in HKD. */
  price: number;
  /** Mortgage LTV chosen by the user, in percent (e.g. 80). */
  ltvPct: number;
  /** Mortgage term in years. */
  termYears: number;
  ratePlan: RatePlan;
  /** 1-month HIBOR, percent. */
  hibor: number;
  /** H plan spread over HIBOR, percent. */
  hSpread: number;
  /** Bank best lending rate, percent. */
  prime: number;
  /** Cap = prime - capSpread, percent. */
  capSpread: number;
  /** P plan = prime - pSpread, percent. */
  pSpread: number;
  /** Estate agent commission, percent of price. */
  agentPct: number;
  /** Solicitor fee, HKD. */
  legalFee: number;
  /** Miscellaneous disbursements, HKD. */
  miscFee: number;
  /** Buyer holds no other HK residential property and is a first-time buyer. */
  firstTime: boolean;
  /** All applicants are salaried (fixed income) — a condition for 90% MIP. */
  fixedIncome: boolean;
  /** Mortgage insurance premium added to the loan instead of paid in cash. */
  mipFinanced: boolean;
  /** Gross monthly household income, HKD. */
  monthlyIncome: number;
  /** Other monthly debt repayments, HKD. */
  otherDebts: number;
  /** Current monthly rent of a comparable flat, HKD. */
  monthlyRent: number;
  /** Monthly management fee, HKD. */
  mgmtFee: number;
  /** Rates + government rent, percent of annual rent (rateable value proxy). */
  ratesPct: number;
  /** Maintenance provision, percent of annual rent. */
  maintenancePct: number;
  /** Vacancy allowance, percent of annual rent. */
  vacancyPct: number;
  /** Annual rent growth, percent. */
  rentGrowth: number;
  /** Annual property price growth, percent. */
  priceGrowth: number;
  /** Annual investment return on the renter's portfolio, percent. */
  investReturn: number;
  /** Selling costs (agent + legal), percent of sale price. */
  sellCostPct: number;
  /** Comparison horizon in years. */
  horizonYears: number;
}

export interface AmortRow {
  month: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
}

export interface StampDutyResult {
  amount: number;
  effectiveRatePct: number;
  bracket: number;
}

export interface MipTier {
  maxLtvPct: number;
  loanCap?: number;
  /** Key for the rule description shown in the UI. */
  rule:
    | "90"
    | "90_capped"
    | "80"
    | "80_capped"
    | "none";
  requiresFirstTime: boolean;
}

export interface MipResult extends MipTier {
  /** LTV actually allowed after the loan cap is applied. */
  allowedLtvPct: number;
  premiumRatePct: number;
  premium: number;
  required: boolean;
  eligible: boolean;
}

export interface RateResult {
  hPlanRate: number;
  capRate: number;
  pPlanRate: number;
  appliedRate: number;
  capped: boolean;
  plan: RatePlan;
}

export interface UpfrontResult {
  downPayment: number;
  stampDuty: number;
  agentFee: number;
  legalFee: number;
  miscFee: number;
  mipPremiumCash: number;
  cashNeeded: number;
  totalCost: number;
  loan: number;
  ltvPct: number;
  mip: MipResult;
}

export interface AffordabilityResult {
  monthlyPayment: number;
  firstMonthInterest: number;
  firstMonthPrincipal: number;
  requiredIncome: number;
  dtiPct: number;
  bufferSixMonths: number;
  incomeGap: number;
}

export interface RentBuyPoint {
  year: number;
  buyer: number;
  renter: number;
  propertyValue: number;
  balance: number;
  saleCost: number;
  portfolio: number;
}

export interface RentBuyResult {
  points: RentBuyPoint[];
  breakEvenYear: number | null;
  upfrontCash: number;
  monthlyPayment: number;
  monthlyHolding: number;
  finalBuyer: number;
  finalRenter: number;
  finalDiff: number;
  totalRentPaid: number;
  totalInterestPaid: number;
}

export interface YieldResult {
  grossYieldPct: number;
  netYieldPct: number;
  cashOnCashPct: number;
  annualRent: number;
  effectiveRent: number;
  operatingExpenses: number;
  netOperatingIncome: number;
  annualDebtService: number;
  annualCashFlow: number;
  monthlyCashFlow: number;
  cashInvested: number;
}
