import { BANK_LTV, MIP_BANDS, PREMIUM_TABLES, PREMIUM_TERMS, STAMP_DUTY_BRACKETS } from "./constants";
import type {
  AffordabilityResult,
  AmortRow,
  Inputs,
  MipResult,
  RatePlan,
  RateResult,
  RentBuyPoint,
  RentBuyResult,
  StampDutyResult,
  UpfrontResult,
  YieldResult,
} from "./types";

/** Ad valorem stamp duty (Scale 2) for a residential property. */
export function stampDuty(price: number): StampDutyResult {
  const p = Math.max(0, price);
  for (let i = 0; i < STAMP_DUTY_BRACKETS.length; i += 1) {
    const b = STAMP_DUTY_BRACKETS[i];
    if (p <= b.upTo) {
      const amount =
        b.marginalRate === 0 ? b.flat : b.base + (p - b.marginalFrom) * (b.marginalRate / 100);
      return {
        amount: Math.round(amount),
        effectiveRatePct: p > 0 ? (amount / p) * 100 : 0,
        bracket: i,
      };
    }
  }
  return { amount: 0, effectiveRatePct: 0, bracket: STAMP_DUTY_BRACKETS.length - 1 };
}

/** HKMA ceiling on LTV for a self-use residential property without MIP. */
export function bankMaxLtvPct(price: number): number {
  if (price <= BANK_LTV.fullThreshold) return BANK_LTV.highLtvPct;
  if (price >= BANK_LTV.lowThreshold) return BANK_LTV.lowLtvPct;
  const span = BANK_LTV.lowThreshold - BANK_LTV.fullThreshold;
  const drop = (price - BANK_LTV.fullThreshold) / span;
  return BANK_LTV.highLtvPct - drop * (BANK_LTV.highLtvPct - BANK_LTV.lowLtvPct);
}

/** Premium rate as a percentage of the loan, interpolated by term. */
export function mipPremiumRate(price: number, ltvPct: number, termYears: number): number {
  if (ltvPct <= 70) return 0;
  const table = PREMIUM_TABLES.find((t) => price <= t.upTo);
  if (!table) return 0;
  const bandKey = ltvPct <= 80 ? 80 : ltvPct <= 85 ? 85 : 90;
  const rows = table.bands[bandKey] ?? table.bands[80];
  if (!rows) return 0;
  const term = Math.min(Math.max(termYears, PREMIUM_TERMS[0]), PREMIUM_TERMS[PREMIUM_TERMS.length - 1]);
  for (let i = 0; i < PREMIUM_TERMS.length; i += 1) {
    if (term === PREMIUM_TERMS[i]) return rows[i];
    if (term < PREMIUM_TERMS[i]) {
      const lo = PREMIUM_TERMS[i - 1];
      const hi = PREMIUM_TERMS[i];
      const w = (term - lo) / (hi - lo);
      return rows[i - 1] + (rows[i] - rows[i - 1]) * w;
    }
  }
  return rows[rows.length - 1];
}

/** Highest LTV the mortgage insurance programme allows for this property. */
export function mipTier(price: number, firstTime: boolean, fixedIncome: boolean): MipResult {
  const band = MIP_BANDS.find((b) => price <= b.upTo);
  if (!band) {
    return buildMipResult(bankMaxLtvPct(price), "none", false, false);
  }
  const canHigh = firstTime && fixedIncome;
  const target = canHigh ? band.highLtvPct : band.baseLtvPct;
  const capLtv = band.loanCap ? (band.loanCap / price) * 100 : Number.POSITIVE_INFINITY;
  const allowed = Math.min(target, capLtv);
  let rule: MipResult["rule"] = target >= 90 ? "90" : "80";
  if (band.loanCap && capLtv < target) rule = target >= 90 ? "90_capped" : "80_capped";
  return buildMipResult(allowed, rule, !canHigh && band.highLtvPct >= 90, true);
}

function buildMipResult(
  allowedLtvPct: number,
  rule: MipResult["rule"],
  requiresFirstTime: boolean,
  eligible: boolean,
): MipResult {
  return {
    allowedLtvPct,
    maxLtvPct: allowedLtvPct,
    rule,
    requiresFirstTime,
    eligible,
    premiumRatePct: 0,
    premium: 0,
    required: false,
  };
}

/** Full mortgage-insurance picture for a chosen LTV. */
export function mipFor(price: number, ltvPct: number, termYears: number, firstTime: boolean, fixedIncome: boolean): MipResult {
  const tier = mipTier(price, firstTime, fixedIncome);
  const loan = (price * ltvPct) / 100;
  const bankCeiling = (price * bankMaxLtvPct(price)) / 100;
  const required = loan > bankCeiling * 1.0005;
  const rate = required && tier.eligible ? mipPremiumRate(price, ltvPct, termYears) : 0;
  return {
    ...tier,
    required,
    premiumRatePct: rate,
    premium: Math.round((loan * rate) / 100),
  };
}

/** Effective H-plan / P-plan / capped rates for the current market inputs. */
export function rates(inputs: Inputs): RateResult {
  const hPlanRate = inputs.hibor + inputs.hSpread;
  const capRate = inputs.prime - inputs.capSpread;
  const pPlanRate = inputs.prime - inputs.pSpread;
  const applied = inputs.ratePlan === "H" ? Math.min(hPlanRate, capRate) : pPlanRate;
  return {
    hPlanRate,
    capRate,
    pPlanRate,
    appliedRate: Math.max(0, applied),
    capped: inputs.ratePlan === "H" && hPlanRate > capRate,
    plan: inputs.ratePlan,
  };
}

export function monthlyPayment(principal: number, annualRatePct: number, termYears: number): number {
  const n = Math.max(1, Math.round(termYears * 12));
  const r = annualRatePct / 100 / 12;
  if (principal <= 0) return 0;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

export function amortSchedule(
  principal: number,
  annualRatePct: number,
  termYears: number,
): AmortRow[] {
  const n = Math.max(1, Math.round(termYears * 12));
  const r = annualRatePct / 100 / 12;
  const payment = monthlyPayment(principal, annualRatePct, termYears);
  const rows: AmortRow[] = [];
  let balance = principal;
  for (let m = 1; m <= n; m += 1) {
    const interest = balance * r;
    let principalPart = payment - interest;
    if (principalPart > balance) principalPart = balance;
    balance = Math.max(0, balance - principalPart);
    rows.push({
      month: m,
      payment: principalPart + interest,
      interest,
      principal: principalPart,
      balance,
    });
    if (balance <= 0.01) break;
  }
  return rows;
}

export function upfront(inputs: Inputs): UpfrontResult {
  const loan = (inputs.price * inputs.ltvPct) / 100;
  const duty = stampDuty(inputs.price);
  const mip = mipFor(inputs.price, inputs.ltvPct, inputs.termYears, inputs.firstTime, inputs.fixedIncome);
  const downPayment = inputs.price - loan;
  const agentFee = (inputs.price * inputs.agentPct) / 100;
  const premiumCash = inputs.mipFinanced ? 0 : mip.premium;
  const cashNeeded = downPayment + duty.amount + agentFee + inputs.legalFee + inputs.miscFee + premiumCash;
  const totalCost = inputs.price + duty.amount + agentFee + inputs.legalFee + inputs.miscFee + mip.premium;
  return {
    downPayment,
    stampDuty: duty.amount,
    agentFee,
    legalFee: inputs.legalFee,
    miscFee: inputs.miscFee,
    mipPremiumCash: premiumCash,
    cashNeeded,
    totalCost,
    loan: inputs.mipFinanced ? loan + mip.premium : loan,
    ltvPct: inputs.ltvPct,
    mip,
  };
}

export function affordability(inputs: Inputs, rate: RateResult = rates(inputs)): AffordabilityResult {
  const u = upfront(inputs);
  const payment = monthlyPayment(u.loan, rate.appliedRate, inputs.termYears);
  const firstMonthInterest = (u.loan * rate.appliedRate) / 100 / 12;
  const requiredIncome = (payment + inputs.otherDebts) / 0.5;
  return {
    monthlyPayment: payment,
    firstMonthInterest,
    firstMonthPrincipal: Math.max(0, payment - firstMonthInterest),
    requiredIncome,
    dtiPct: inputs.monthlyIncome > 0 ? ((payment + inputs.otherDebts) / inputs.monthlyIncome) * 100 : 0,
    bufferSixMonths: payment * 6,
    incomeGap: Math.max(0, requiredIncome - inputs.monthlyIncome),
  };
}

/**
 * Buy vs rent over the horizon. The buyer puts the same cash in as the
 * renter would invest, and the renter invests the monthly difference.
 */
export function rentVsBuy(inputs: Inputs, rate: RateResult = rates(inputs)): RentBuyResult {
  const u = upfront(inputs);
  const payment = monthlyPayment(u.loan, rate.appliedRate, inputs.termYears);
  const annualRent = inputs.monthlyRent * 12;
  const holdingMonthly =
    inputs.mgmtFee + (annualRent * inputs.ratesPct) / 100 / 12 + (annualRent * inputs.maintenancePct) / 100 / 12;

  const monthlyMortgageRate = rate.appliedRate / 100 / 12;
  const monthlyInvest = Math.pow(1 + inputs.investReturn / 100, 1 / 12) - 1;
  const monthlyGrowth = Math.pow(1 + inputs.priceGrowth / 100, 1 / 12) - 1;
  const monthlyRentGrowth = Math.pow(1 + inputs.rentGrowth / 100, 1 / 12) - 1;
  const months = Math.round(inputs.horizonYears * 12);

  let balance = u.loan;
  let portfolio = u.cashNeeded;
  let rent = inputs.monthlyRent;
  let totalRent = 0;
  let totalInterest = 0;
  const points: RentBuyPoint[] = [];

  const snapshot = (year: number): RentBuyPoint => {
    const propertyValue = (inputs.price * Math.pow(1 + monthlyGrowth, year * 12));
    const saleCost = (propertyValue * inputs.sellCostPct) / 100;
    return {
      year,
      buyer: propertyValue - balance - saleCost,
      renter: portfolio,
      propertyValue,
      balance,
      saleCost,
      portfolio,
    };
  };

  points.push(snapshot(0));

  for (let m = 1; m <= months; m += 1) {
    const interest = balance * monthlyMortgageRate;
    let principalPart = payment - interest;
    if (principalPart > balance) principalPart = balance;
    if (principalPart < 0) principalPart = 0;
    balance = Math.max(0, balance - principalPart);
    totalInterest += interest;

    const surplus = payment + holdingMonthly - rent;
    portfolio = portfolio * (1 + monthlyInvest) + surplus;
    totalRent += rent;
    rent = rent * (1 + monthlyRentGrowth);

    if (m % 12 === 0) points.push(snapshot(m / 12));
  }

  let breakEvenYear: number | null = null;
  for (const p of points) {
    if (p.year > 0 && p.buyer >= p.renter) {
      breakEvenYear = p.year;
      break;
    }
  }

  const last = points[points.length - 1];
  return {
    points,
    breakEvenYear,
    upfrontCash: u.cashNeeded,
    monthlyPayment: payment,
    monthlyHolding: holdingMonthly,
    finalBuyer: last ? last.buyer : 0,
    finalRenter: last ? last.renter : 0,
    finalDiff: last ? last.buyer - last.renter : 0,
    totalRentPaid: totalRent,
    totalInterestPaid: totalInterest,
  };
}

export function rentalYield(inputs: Inputs, rate: RateResult = rates(inputs)): YieldResult {
  const u = upfront(inputs);
  const annualRent = inputs.monthlyRent * 12;
  const effectiveRent = annualRent * (1 - inputs.vacancyPct / 100);
  const operatingExpenses =
    inputs.mgmtFee * 12 + (annualRent * inputs.ratesPct) / 100 + (annualRent * inputs.maintenancePct) / 100;
  const noi = effectiveRent - operatingExpenses;
  const payment = monthlyPayment(u.loan, rate.appliedRate, inputs.termYears);
  const annualDebtService = payment * 12;
  const cashFlow = noi - annualDebtService;
  return {
    grossYieldPct: inputs.price > 0 ? (annualRent / inputs.price) * 100 : 0,
    netYieldPct: inputs.price > 0 ? (noi / inputs.price) * 100 : 0,
    cashOnCashPct: u.cashNeeded > 0 ? (cashFlow / u.cashNeeded) * 100 : 0,
    annualRent,
    effectiveRent,
    operatingExpenses,
    netOperatingIncome: noi,
    annualDebtService,
    annualCashFlow: cashFlow,
    monthlyCashFlow: cashFlow / 12,
    cashInvested: u.cashNeeded,
  };
}

/** Outstanding balance after a number of months of payments. */
export function balanceAfter(principal: number, annualRatePct: number, termYears: number, months: number): number {
  const n = Math.max(1, Math.round(termYears * 12));
  const r = annualRatePct / 100 / 12;
  const payment = monthlyPayment(principal, annualRatePct, termYears);
  if (months >= n) return 0;
  if (r === 0) return Math.max(0, principal - payment * months);
  return Math.max(0, principal * Math.pow(1 + r, months) - payment * ((Math.pow(1 + r, months) - 1) / r));
}

export function planLabel(plan: RatePlan): string {
  return plan;
}
