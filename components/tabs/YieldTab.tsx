"use client";

import { useMemo } from "react";
import { NumberField } from "@/components/ui/NumberField";
import { Card, Note, Row, Stat } from "@/components/ui/Primitives";
import { rentalYield } from "@/lib/calc";
import { LIMITS } from "@/lib/constants";
import { hkd, pct } from "@/lib/format";
import type { TabProps } from "./types";

export function YieldTab({ inputs, update, t, lang }: TabProps) {
  const result = useMemo(() => rentalYield(inputs), [inputs]);

  const verdict =
    result.monthlyCashFlow < 0
      ? { label: t("yieldNegative"), tone: "badge-warn" as const }
      : result.netYieldPct >= 3.5
        ? { label: t("yieldGood"), tone: "badge-ok" as const }
        : { label: t("yieldThin"), tone: "" as const };

  return (
    <div className="panel-grid">
      <div className="stack">
        <Card title={t("yieldTitle")} sub={t("yieldLead")}>
          <NumberField
            label={t("price")}
            value={inputs.price}
            onChange={(price) => update({ price })}
            min={LIMITS.price.min}
            max={LIMITS.price.max}
            step={LIMITS.price.step}
            prefix="HK$"
            slider={false}
          />
          <NumberField
            label={t("ltv")}
            value={inputs.ltvPct}
            onChange={(ltvPct) => update({ ltvPct })}
            min={LIMITS.ltvPct.min}
            max={LIMITS.ltvPct.max}
            step={LIMITS.ltvPct.step}
            suffix="%"
          />
          <NumberField
            label={t("rent")}
            value={inputs.monthlyRent}
            onChange={(monthlyRent) => update({ monthlyRent })}
            min={LIMITS.monthlyRent.min}
            max={LIMITS.monthlyRent.max}
            step={LIMITS.monthlyRent.step}
            prefix="HK$"
          />
          <NumberField
            label={t("vacancy")}
            value={inputs.vacancyPct}
            onChange={(vacancyPct) => update({ vacancyPct })}
            min={LIMITS.vacancyPct.min}
            max={LIMITS.vacancyPct.max}
            step={LIMITS.vacancyPct.step}
            decimals={1}
            suffix="%"
          />
        </Card>

        <Card title={t("opex")}>
          <NumberField
            label={t("mgmtFee")}
            value={inputs.mgmtFee}
            onChange={(mgmtFee) => update({ mgmtFee })}
            min={LIMITS.mgmtFee.min}
            max={LIMITS.mgmtFee.max}
            step={LIMITS.mgmtFee.step}
            prefix="HK$"
            slider={false}
          />
          <NumberField
            label={t("ratesPct")}
            value={inputs.ratesPct}
            onChange={(ratesPct) => update({ ratesPct })}
            min={LIMITS.ratesPct.min}
            max={LIMITS.ratesPct.max}
            step={LIMITS.ratesPct.step}
            decimals={1}
            suffix="%"
          />
          <NumberField
            label={t("maintenancePct")}
            value={inputs.maintenancePct}
            onChange={(maintenancePct) => update({ maintenancePct })}
            min={LIMITS.maintenancePct.min}
            max={LIMITS.maintenancePct.max}
            step={LIMITS.maintenancePct.step}
            decimals={1}
            suffix="%"
          />
        </Card>
      </div>

      <div className="stack">
        <Card>
          <div className="stat-grid">
            <Stat label={t("grossYield")} value={pct(result.grossYieldPct, 2)} tone="gold" sub={hkd(result.annualRent) + " / " + (lang === "zh" ? "年" : "yr")} />
            <Stat label={t("netYield")} value={pct(result.netYieldPct, 2)} sub={hkd(result.netOperatingIncome)} />
            <Stat
              label={t("cashOnCash")}
              value={pct(result.cashOnCashPct, 2)}
              tone={result.cashOnCashPct >= 0 ? "pos" : "neg"}
              sub={t("cashInvested") + " " + hkd(result.cashInvested)}
            />
            <Stat
              label={t("monthlyCashFlow")}
              value={hkd(result.monthlyCashFlow)}
              tone={result.monthlyCashFlow >= 0 ? "pos" : "neg"}
              sub={result.monthlyCashFlow < 0 ? t("negativeNote") : t("perMonth")}
            />
          </div>
          <div style={{ marginTop: 16 }}>
            <span className={`badge ${verdict.tone}`}>{verdict.label}</span>
          </div>

          <div className="divider" />
          <div className="rows">
            <Row label={t("annualRent")} value={hkd(result.annualRent)} />
            <Row label={t("effectiveRent")} note={pct(inputs.vacancyPct, 1)} value={hkd(result.effectiveRent)} />
            <Row label={t("opex")} value={`− ${hkd(result.operatingExpenses)}`} />
            <Row label={t("noi")} value={hkd(result.netOperatingIncome)} />
            <Row label={t("debtService")} value={`− ${hkd(result.annualDebtService)}`} />
            <Row label={t("annualCashFlow")} value={hkd(result.annualCashFlow)} total />
          </div>

          <div className="divider" />
          <div className="rows">
            <Row label={t("cashInvested")} value={hkd(result.cashInvested)} />
            <Row label={t("loanAmount")} value={hkd((inputs.price * inputs.ltvPct) / 100)} />
          </div>

          <div style={{ marginTop: 16 }}>
            <Note>{t("yieldNote")}</Note>
          </div>
        </Card>

        <Card title={t("sensitivity")} sub={t("sensitivityLead")}>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("rentCase")}</th>
                  <th>{t("netYield")}</th>
                  <th>{t("monthlyCashFlow")}</th>
                </tr>
              </thead>
              <tbody>
                {[-10, -5, 0, 5, 10].map((delta) => {
                  const rent = Math.round(inputs.monthlyRent * (1 + delta / 100));
                  const scenario = rentalYield({ ...inputs, monthlyRent: rent });
                  return (
                    <tr key={delta} style={delta === 0 ? { color: "var(--text)" } : undefined}>
                      <td>
                        {delta > 0 ? "+" : ""}
                        {delta}% · {hkd(rent)}
                      </td>
                      <td>{pct(scenario.netYieldPct, 2)}</td>
                      <td style={{ color: scenario.monthlyCashFlow >= 0 ? "var(--pos)" : "var(--neg)" }}>
                        {hkd(scenario.monthlyCashFlow)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
