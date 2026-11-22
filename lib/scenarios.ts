import { DEFAULTS } from "./constants";
import type { Inputs, Lang, TabId } from "./types";

export interface Scenario {
  id: string;
  name: Record<Lang, string>;
  blurb: Record<Lang, string>;
  values: Partial<Inputs>;
}

/** Realistic starter situations a Hong Kong buyer would recognise. */
export const SCENARIOS: Scenario[] = [
  {
    id: "shatin",
    name: { zh: "沙田兩房上車盤", en: "Sha Tin 2-bed starter" },
    blurb: { zh: "$550 萬 · 九成按保", en: "HK$5.5M · 90% MIP" },
    values: {
      price: 5_500_000,
      ltvPct: 90,
      firstTime: true,
      fixedIncome: true,
      monthlyIncome: 55_000,
      monthlyRent: 17_500,
      mgmtFee: 1_800,
    },
  },
  {
    id: "kaitak",
    name: { zh: "啟德三房換樓", en: "Kai Tak 3-bed upgrade" },
    blurb: { zh: "$980 萬 · 八成按揭", en: "HK$9.8M · 80% LTV" },
    values: {
      price: 9_800_000,
      ltvPct: 80,
      firstTime: false,
      fixedIncome: true,
      monthlyIncome: 95_000,
      monthlyRent: 26_000,
      mgmtFee: 3_400,
    },
  },
  {
    id: "taiwai",
    name: { zh: "大圍一房收租", en: "Tai Wai 1-bed for rent" },
    blurb: { zh: "$450 萬 · 六成按揭", en: "HK$4.5M · 60% LTV" },
    values: {
      price: 4_500_000,
      ltvPct: 60,
      firstTime: false,
      fixedIncome: true,
      monthlyIncome: 60_000,
      monthlyRent: 15_500,
      mgmtFee: 1_400,
      vacancyPct: 6,
    },
  },
  {
    id: "taikoo",
    name: { zh: "太古城三房自住", en: "Taikoo Shing 3-bed" },
    blurb: { zh: "$1,050 萬 · 八成按揭", en: "HK$10.5M · 80% LTV" },
    values: {
      price: 10_500_000,
      ltvPct: 80,
      firstTime: true,
      fixedIncome: true,
      monthlyIncome: 110_000,
      monthlyRent: 28_000,
      mgmtFee: 2_600,
    },
  },
];

export function scenarioInputs(scenario: Scenario): Inputs {
  return { ...DEFAULTS, ...scenario.values };
}

export const TABS: TabId[] = ["upfront", "mortgage", "rentbuy", "yield"];
