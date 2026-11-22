"use client";

import { useMemo } from "react";
import { BalanceChart } from "@/components/charts/BalanceChart";
import { NumberField } from "@/components/ui/NumberField";
import { Card, Note, Row, Stat } from "@/components/ui/Primitives";
import { rentVsBuy } from "@/lib/calc";
import { LIMITS } from "@/lib/constants";
import { hkd, pct, shortHkd } from "@/lib/format";
import type { TabProps } from "./types";

export function RentBuyTab({ inputs, update, t, lang }: TabProps) {
  const result = useMemo(() => rentVsBuy(inputs), [inputs]);

  const breakEvenText =
    result.breakEvenYear !== null
      ? t("breakEven", { year: result.breakEvenYear })
      : t("noBreakEven");

  return (
    <div className="panel-grid">
      <div className="stack">
        <Card title={t("sectionRent")} sub={t("rentBuyLead")}>
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
            label={t("rentGrowth")}
            value={inputs.rentGrowth}
            onChange={(rentGrowth) => update({ rentGrowth })}
            min={LIMITS.rentGrowth.min}
            max={LIMITS.rentGrowth.max}
            step={LIMITS.rentGrowth.step}
            decimals={1}
            suffix="%"
          />
          <NumberField
            label={t("priceGrowth")}
            value={inputs.priceGrowth}
            onChange={(priceGrowth) => update({ priceGrowth })}
            min={LIMITS.priceGrowth.min}
            max={LIMITS.priceGrowth.max}
            step={LIMITS.priceGrowth.step}
            decimals={1}
            suffix="%"
          />
          <NumberField
            label={t("investReturn")}
            value={inputs.investReturn}
            onChange={(investReturn) => update({ investReturn })}
            min={LIMITS.investReturn.min}
            max={LIMITS.investReturn.max}
            step={LIMITS.investReturn.step}
            decimals={1}
            suffix="%"
          />
          <NumberField
            label={t("horizon")}
            value={inputs.horizonYears}
            onChange={(horizonYears) => update({ horizonYears })}
            min={LIMITS.horizonYears.min}
            max={LIMITS.horizonYears.max}
            step={LIMITS.horizonYears.step}
            suffix={lang === "zh" ? "年" : "yrs"}
          />
        </Card>

        <Card title={t("holdCost")}>
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
          <NumberField
            label={t("sellCostPct")}
            value={inputs.sellCostPct}
            onChange={(sellCostPct) => update({ sellCostPct })}
            min={LIMITS.sellCostPct.min}
            max={LIMITS.sellCostPct.max}
            step={LIMITS.sellCostPct.step}
            decimals={1}
            suffix="%"
          />
          <div className="divider" />
          <div className="rows">
            <Row label={t("cashNeeded")} value={hkd(result.upfrontCash)} />
            <Row label={t("monthlyPayment")} value={hkd(result.monthlyPayment)} />
            <Row label={t("holdCost")} value={hkd(result.monthlyHolding)} />
          </div>
        </Card>
      </div>

      <div className="stack">
        <Card
          title={t("chartTitle")}
          sub={t("rentBuyLead")}
          action={
            <div className="legend" style={{ marginTop: 14 }}>
              <span className="legend-item">
                <i className="legend-swatch" style={{ background: "var(--buy)" }} />
                {t("legendBuyer")}
              </span>
              <span className="legend-item">
                <i className="legend-swatch" style={{ background: "var(--rent)" }} />
                {t("legendRenter")}
              </span>
              <span className={`badge ${result.breakEvenYear !== null ? "badge-gold" : ""}`}>{breakEvenText}</span>
            </div>
          }
        >
          <BalanceChart
            points={result.points}
            breakEvenYear={result.breakEvenYear}
            lang={lang}
            labels={{
              buyer: t("legendBuyer"),
              renter: t("legendRenter"),
              year: t("yearLabel", { n: "{n}" }),
              diff: t("diffNow"),
              breakEven: t("breakEven", { year: result.breakEvenYear ?? "" }),
              noBreakEven: t("noBreakEven"),
              aria: t("chartTitle"),
            }}
          />
          <p className="field-hint" style={{ marginTop: 8 }}>
            {t("chartHint")}
          </p>

          <div className="stat-grid" style={{ marginTop: 18 }}>
            <Stat
              label={`${t("buyerNow")} · ${result.points.length > 0 ? result.points[result.points.length - 1].year : 0}${lang === "zh" ? "年" : "y"}`}
              value={hkd(result.finalBuyer)}
              tone="gold"
              sub={t("buyBreakdown")}
            />
            <Stat
              label={t("renterNow")}
              value={hkd(result.finalRenter)}
              sub={t("rentBreakdown")}
            />
            <Stat
              label={t("diffNow")}
              value={hkd(result.finalDiff)}
              tone={result.finalDiff >= 0 ? "pos" : "neg"}
              sub={result.finalDiff >= 0 ? t("legendBuyer") : t("legendRenter")}
            />
          </div>

          <div className="divider" />
          <div className="rows">
            <Row label={t("totalRentPaid")} value={hkd(result.totalRentPaid)} />
            <Row label={t("totalInterestPaid")} value={hkd(result.totalInterestPaid)} />
            <Row label={t("monthlyPayment")} value={hkd(result.monthlyPayment)} note={pct(inputs.ltvPct, 0)} />
          </div>

          <div style={{ marginTop: 16 }}>
            <Note>
              {t("buyBreakdown")}
              <br />
              {t("rentBreakdown")}
              <br />
              {t("noteRateFixed")}
            </Note>
          </div>
        </Card>

        <Card title={t("yearlyTitle")}>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("tableYear")}</th>
                  <th>{t("legendBuyer")}</th>
                  <th>{t("legendRenter")}</th>
                  <th>{t("diffNow")}</th>
                </tr>
              </thead>
              <tbody>
                {result.points
                  .filter((p) => p.year % 5 === 0 || p.year === inputs.horizonYears)
                  .map((p) => (
                    <tr key={p.year}>
                      <td>{p.year === 0 ? (lang === "zh" ? "今日" : "Now") : `${p.year} ${lang === "zh" ? "年" : "yr"}`}</td>
                      <td>{shortHkd(p.buyer, lang)}</td>
                      <td>{shortHkd(p.renter, lang)}</td>
                      <td style={{ color: p.buyer - p.renter >= 0 ? "var(--pos)" : "var(--neg)" }}>
                        {shortHkd(p.buyer - p.renter, lang)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
