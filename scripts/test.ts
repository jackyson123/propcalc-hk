import { affordability, amortSchedule, balanceAfter, mipFor, mipTier, monthlyPayment, rates, rentalYield, rentVsBuy, stampDuty, upfront } from "../lib/calc";
import { DEFAULTS } from "../lib/constants";
import { decodeInputs, encodeInputs } from "../lib/state";
import type { Inputs } from "../lib/types";

let passed = 0;
const failures: string[] = [];

function check(name: string, condition: boolean, detail?: unknown) {
  if (condition) {
    passed += 1;
  } else {
    failures.push(`${name}${detail === undefined ? "" : ` → got ${JSON.stringify(detail)}`}`);
  }
}

function near(name: string, actual: number, expected: number, tolerance = 1) {
  check(name, Math.abs(actual - expected) <= tolerance, { actual, expected });
}

const base: Inputs = { ...DEFAULTS };

/* ── Stamp duty: boundaries and continuity across every band ── */
near("AVD $3.0M", stampDuty(3_000_000).amount, 100);
near("AVD $4.0M", stampDuty(4_000_000).amount, 100);
near("AVD $4,000,001", stampDuty(4_000_001).amount, 100);
near("AVD $4,323,780", stampDuty(4_323_780).amount, 64_856);
near("AVD $4,323,781", stampDuty(4_323_781).amount, 64_857);
near("AVD $4.5M", stampDuty(4_500_000).amount, 67_500);
near("AVD $4,935,480", stampDuty(4_935_480).amount, 111_048);
near("AVD $4,935,481", stampDuty(4_935_481).amount, 111_048);
near("AVD $6.0M", stampDuty(6_000_000).amount, 135_000);
near("AVD $6,642,860", stampDuty(6_642_860).amount, 199_286);
near("AVD $6,642,861", stampDuty(6_642_861).amount, 199_286);
near("AVD $9.0M", stampDuty(9_000_000).amount, 270_000);
near("AVD $10,080,000", stampDuty(10_080_000).amount, 378_000);
near("AVD $10,080,001", stampDuty(10_080_001).amount, 378_000);
near("AVD $20.0M", stampDuty(20_000_000).amount, 750_000);
near("AVD $21,739,120", stampDuty(21_739_120).amount, 923_912);
near("AVD $21,739,121", stampDuty(21_739_121).amount, 923_913);
near("AVD $100M", stampDuty(100_000_000).amount, 4_250_000);
near("AVD $109,574,471", stampDuty(109_574_471).amount, 7_122_341);

for (let price = 500_000; price <= 30_000_000; price += 500_000) {
  const here = stampDuty(price).amount;
  const next = stampDuty(price + 500_000).amount;
  check(`AVD monotonic at ${price}`, next >= here, { here, next });
  check(`AVD under 15% at ${price}`, here <= price * 0.15, { here });
}

/* ── Mortgage maths ── */
const loan = 4_000_000;
const rate = 3.25;
const term = 30;
const pay = monthlyPayment(loan, rate, term);
check("payment is positive", pay > 0, pay);
check("payment covers interest", pay > (loan * rate) / 100 / 12, pay);
near("zero-rate payment", monthlyPayment(120_000, 0, 10), 1_000, 0.01);

const schedule = amortSchedule(loan, rate, term);
check("schedule length", schedule.length === 360, schedule.length);
near("final balance zero", schedule[schedule.length - 1].balance, 0, 0.5);
const principalPaid = schedule.reduce((s, r) => s + r.principal, 0);
near("principal repaid equals loan", principalPaid, loan, 2);
near("first month interest", schedule[0].interest, (loan * rate) / 100 / 12, 0.01);
check("interest falls over time", schedule[0].interest > schedule[300].interest);
near("balanceAfter matches schedule", balanceAfter(loan, rate, term, 120), schedule[119].balance, 1);
near("balanceAfter full term", balanceAfter(loan, rate, term, 360), 0, 0.5);

/* ── Rate plans ── */
const hRate = rates({ ...base, hibor: 2.71, hSpread: 1.3, prime: 5, capSpread: 1.75 });
near("H plan raw rate", hRate.hPlanRate, 4.01, 0.0001);
near("H cap rate", hRate.capRate, 3.25, 0.0001);
near("H plan applied at cap", hRate.appliedRate, 3.25, 0.0001);
check("H plan flagged capped", hRate.capped);
const hLow = rates({ ...base, hibor: 0.5, hSpread: 1.3, prime: 5, capSpread: 1.75 });
near("H plan below cap", hLow.appliedRate, 1.8, 0.0001);
check("H plan not capped", !hLow.capped);
near("P plan rate", rates({ ...base, ratePlan: "P" }).appliedRate, 3.25, 0.0001);

/* ── Mortgage insurance ── */
const mip55 = mipFor(5_500_000, 90, 30, true, true);
check("90% allowed at $5.5M", mip55.allowedLtvPct === 90, mip55.allowedLtvPct);
near("premium rate for 90%/30y @ $5.5M", mip55.premiumRatePct, 2.16, 0.0001);
near("premium amount", mip55.premium, Math.round(4_950_000 * 0.0216), 1);
check("premium is required above bank cap", mip55.required);

const mip55NoFirst = mipTier(5_500_000, false, true);
check("no first-time caps at 80%", mip55NoFirst.allowedLtvPct === 80, mip55NoFirst.allowedLtvPct);

const mip105 = mipFor(10_500_000, 90, 30, true, true);
near("$10.5M cap is 85.71%", mip105.allowedLtvPct, (9_000_000 / 10_500_000) * 100, 0.01);
check("$10.5M band marked capped", mip105.rule === "90_capped", mip105.rule);
near("premium on capped loan", mip105.premium, Math.round(9_450_000 * 0.025), 1_000);

const mip16 = mipTier(16_000_000, true, true);
near("$16M cap is 75%", mip16.allowedLtvPct, 75, 0.01);
check("$16M band marked capped", mip16.rule === "80_capped", mip16.rule);

const mip20 = mipTier(20_000_000, true, true);
check("$20M has no MIP", mip20.rule === "none" && !mip20.eligible, mip20.rule);
near("$20M bank cap 70%", mip20.allowedLtvPct, 70, 0.01);

const mip32 = mipTier(32_000_000, true, true);
near("$32M bank cap tapers to 66%", mip32.allowedLtvPct, 66, 0.01);

near("no premium at 60% LTV", mipFor(5_000_000, 60, 30, true, true).premium, 0);
near("premium interpolated at 27y", mipFor(5_000_000, 80, 27, true, true).premiumRatePct, 0.98 + (1.07 - 0.98) * (2 / 5), 0.0001);

/* ── Upfront cash ── */
const u = upfront(base);
near("down payment", u.downPayment, 1_100_000);
near("stamp duty on $5.5M", u.stampDuty, 123_750);
near("agent fee 1%", u.agentFee, 55_000);
near("cash needed", u.cashNeeded, 1_100_000 + 123_750 + 55_000 + 8_000 + 5_000);
check("financed loan exceeds mortgage", u.loan > 4_400_000, u.loan);
near("total cost includes premium", u.totalCost, 5_500_000 + 123_750 + 55_000 + 8_000 + 5_000 + u.mip.premium, 1);

const uCash = upfront({ ...base, mipFinanced: false });
near("cash premium paid upfront", uCash.cashNeeded, u.cashNeeded + uCash.mip.premium, 1);
near("loan without premium", uCash.loan, 4_400_000);

/* ── Affordability ── */
const aff = affordability(base);
check("payment positive", aff.monthlyPayment > 0);
near("required income is double payment", aff.requiredIncome, aff.monthlyPayment * 2, 0.5);
near("first month split adds up", aff.firstMonthInterest + aff.firstMonthPrincipal, aff.monthlyPayment, 1);
near("six month buffer", aff.bufferSixMonths, aff.monthlyPayment * 6, 0.5);
check("DTI under 50% at $60k income", aff.dtiPct < 50, aff.dtiPct);

/* ── Buy vs rent ── */
const rvb = rentVsBuy(base);
check("points cover horizon", rvb.points.length === base.horizonYears + 1, rvb.points.length);
near("renter starts with upfront cash", rvb.points[0].renter, rvb.upfrontCash, 1);
check("buyer starts below renter after costs", rvb.points[0].buyer < rvb.points[0].renter);
check("buyer equity grows", rvb.points[30].buyer > rvb.points[0].buyer);
check("rent paid positive", rvb.totalRentPaid > 0);
check("interest paid positive", rvb.totalInterestPaid > 0);
if (rvb.breakEvenYear !== null) {
  const crossed = rvb.points[rvb.breakEvenYear];
  check("break-even year buyer >= renter", crossed.buyer >= crossed.renter, crossed);
  if (rvb.breakEvenYear > 1) {
    const before = rvb.points[rvb.breakEvenYear - 1];
    check("year before break-even buyer behind", before.buyer < before.renter, before);
  }
}
const rvbShort = rentVsBuy({ ...base, horizonYears: 5, priceGrowth: 8, investReturn: 0 });
check("short horizon produces 6 points", rvbShort.points.length === 6, rvbShort.points.length);
check("strong growth improves buyer", rvbShort.points[5].buyer > rvb.points[5].buyer);

/* ── Rental yield ── */
const y = rentalYield(base);
near("gross yield", y.grossYieldPct, (17_500 * 12 * 100) / 5_500_000, 0.001);
const expectedOpex = 1_800 * 12 + 210_000 * 0.08 + 210_000 * 0.05;
near("operating expenses", y.operatingExpenses, expectedOpex, 1);
near("net operating income", y.netOperatingIncome, 210_000 * 0.96 - expectedOpex, 1);
near("net yield", y.netYieldPct, ((210_000 * 0.96 - expectedOpex) / 5_500_000) * 100, 0.001);
near("monthly cash flow", y.monthlyCashFlow, y.annualCashFlow / 12, 0.01);

/* ── Share link round trip ── */
const token = encodeInputs({ ...base, price: 8_800_000, ltvPct: 85, ratePlan: "P", firstTime: false, horizonYears: 25 });
const restored = decodeInputs(token);
check("share token restores price", restored.price === 8_800_000, restored.price);
check("share token restores ltv", restored.ltvPct === 85, restored.ltvPct);
check("share token restores plan", restored.ratePlan === "P", restored.ratePlan);
check("share token restores flag", restored.firstTime === false);
check("share token restores horizon", restored.horizonYears === 25, restored.horizonYears);
check("token is url safe", /^[A-Za-z0-9_-]+$/.test(token), token.slice(0, 24));
check("empty token falls back to defaults", decodeInputs(null).price === DEFAULTS.price);
check("garbage token falls back", decodeInputs("!!!not-base64!!!").price === DEFAULTS.price);
const clamped = decodeInputs(encodeInputs({ ...base, ltvPct: 150 }));
check("decoder clamps ltv", clamped.ltvPct === 90, clamped.ltvPct);

console.log(`\n${passed} checks passed, ${failures.length} failed`);
if (failures.length > 0) {
  failures.forEach((f) => console.log(`  ✗ ${f}`));
  process.exit(1);
}
