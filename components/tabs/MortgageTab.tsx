"use client";

import { useMemo } from "react";
import { AmortChart } from "@/components/charts/AmortChart";
import { NumberField } from "@/components/ui/NumberField";
import { Segmented } from "@/components/ui/Controls";
import { Card, Note, Row, Stat } from "@/components/ui/Primitives";
import { affordability, amortSchedule, monthlyPayment, rates, upfront } from "@/lib/calc";
import { LIMITS } from "@/lib/constants";
import { hkd, num, pct, shortHkd } from "@/lib/format";
import type { TabProps } from "./types";

export function MortgageTab({ inputs, update, t, lang }: TabProps) {
  const rate = rates(inputs);
  const u = upfront(inputs);
  const aff = affordability(inputs, rate);
  const schedule = useMemo(
    () => amortSchedule(u.loan, rate.appliedRate, inputs.termYears),
    [u.loan, rate.appliedRate, inputs.termYears],
  );

  const hPayment = monthlyPayment(u.loan, rate.hPlanRate, inputs.termYears);
  const hCappedPayment = monthlyPayment(u.loan, Math.min(rate.hPlanRate, rate.capRate), inputs.termYears);
  const pPayment = monthlyPayment(u.loan, rate.pPlanRate, inputs.termYears);
  const hTotal = hCappedPayment * inputs.termYears * 12 - u.loan;
  const pTotal = pPayment * inputs.termYears * 12 - u.loan;
  const totalInterest = aff.monthlyPayment * inputs.termYears * 12 - u.loan;
  const principalShare = aff.monthlyPayment > 0 ? (aff.firstMonthPrincipal / aff.monthlyPayment) * 100 : 0;

  const yearRows = useMemo(() => {
    const wanted = [1, 2, 3, 5, 7, 10, 15, 20, 25, 30].filter((y) => y <= inputs.termYears);
    return wanted
      .map((year) => {
        const slice = schedule.filter((r) => Math.ceil(r.month / 12) === year);
        if (slice.length === 0) return null;
        return {
          year,
          payment: slice[0].payment,
          interest: slice.reduce((s, r) => s + r.interest, 0),
          principal: slice.reduce((s, r) => s + r.principal, 0),
          balance: slice[slice.length - 1].balance,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
  }, [schedule, inputs.termYears]);

  return (
    <div className="panel-grid">
      <div className="stack">
        <Card title={t("mortgageTitle")} sub={t("mortgageLead")}>
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
            label={t("term")}
            value={inputs.termYears}
            onChange={(termYears) => update({ termYears })}
            min={LIMITS.termYears.min}
            max={LIMITS.termYears.max}
            step={LIMITS.termYears.step}
            suffix={lang === "zh" ? "年" : "yrs"}
          />
          <Row label={t("loanAmount")} value={hkd(u.loan)} />
        </Card>

        <Card title={t("ratePlan")}>
          <Segmented
            value={inputs.ratePlan}
            ariaLabel={t("ratePlan")}
            onChange={(ratePlan) => update({ ratePlan })}
            options={[
              { value: "H", label: t("hPlan") },
              { value: "P", label: t("pPlan") },
            ]}
          />
          {inputs.ratePlan === "H" ? (
            <>
              <NumberField
                label={t("hibor")}
                value={inputs.hibor}
                onChange={(hibor) => update({ hibor })}
                min={LIMITS.hibor.min}
                max={LIMITS.hibor.max}
                step={LIMITS.hibor.step}
                decimals={2}
                suffix="%"
              />
              <NumberField
                label={t("hSpread")}
                value={inputs.hSpread}
                onChange={(hSpread) => update({ hSpread })}
                min={LIMITS.hSpread.min}
                max={LIMITS.hSpread.max}
                step={LIMITS.hSpread.step}
                decimals={2}
                suffix="%"
              />
              <NumberField
                label={t("capSpread")}
                value={inputs.capSpread}
                onChange={(capSpread) => update({ capSpread })}
                min={LIMITS.capSpread.min}
                max={LIMITS.capSpread.max}
                step={LIMITS.capSpread.step}
                decimals={2}
                suffix="%"
              />
            </>
          ) : (
            <NumberField
              label={t("pSpread")}
              value={inputs.pSpread}
              onChange={(pSpread) => update({ pSpread })}
              min={LIMITS.pSpread.min}
              max={LIMITS.pSpread.max}
              step={LIMITS.pSpread.step}
              decimals={2}
              suffix="%"
            />
          )}
          <NumberField
            label={t("prime")}
            value={inputs.prime}
            onChange={(prime) => update({ prime })}
            min={LIMITS.prime.min}
            max={LIMITS.prime.max}
            step={LIMITS.prime.step}
            decimals={2}
            suffix="%"
          />
          <div className="divider" />
          <div className="rows">
            <Row
              label={t("hRateLine", { spread: pct(inputs.hSpread, 2), rate: pct(rate.hPlanRate, 2) })}
              value={rate.hPlanRate <= rate.capRate ? t("notCapped") : t("capped")}
            />
            <Row label={t("capLine", { rate: pct(rate.capRate, 2) })} value="" />
            <Row label={t("pRateLine", { spread: pct(inputs.pSpread, 2), rate: pct(rate.pPlanRate, 2) })} value="" />
          </div>
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
            <span className="stat-label">{t("appliedRate")}</span>
            <span className="stat-value" style={{ marginTop: 0, color: "var(--gold)" }}>
              {pct(rate.appliedRate, 2)}
            </span>
            <span className={`badge ${rate.capped ? "badge-gold" : ""}`}>
              {rate.capped ? t("capped") : t("notCapped")}
            </span>
          </div>
        </Card>

        <Card title={t("incomeTitle")} sub={t("incomeLead")}>
          <NumberField
            label={t("monthlyIncome")}
            value={inputs.monthlyIncome}
            onChange={(monthlyIncome) => update({ monthlyIncome })}
            min={LIMITS.monthlyIncome.min}
            max={LIMITS.monthlyIncome.max}
            step={LIMITS.monthlyIncome.step}
            prefix="HK$"
            slider={false}
          />
          <NumberField
            label={t("otherDebts")}
            value={inputs.otherDebts}
            onChange={(otherDebts) => update({ otherDebts })}
            min={LIMITS.otherDebts.min}
            max={LIMITS.otherDebts.max}
            step={LIMITS.otherDebts.step}
            prefix="HK$"
            slider={false}
          />
          <div className="divider" />
          <div className="rows">
            <Row label={t("requiredIncome")} value={hkd(aff.requiredIncome)} total />
            <Row label={t("dti")} note={t("dtiNote")} value={pct(aff.dtiPct, 1)} warn={aff.dtiPct > 50} />
            <Row label={t("buffer")} value={hkd(aff.bufferSixMonths)} />
          </div>
          <div style={{ marginTop: 12 }}>
            {aff.incomeGap > 0 ? (
              <Note tone="warn">
                {t("incomeGap")} {hkd(aff.incomeGap)}
              </Note>
            ) : (
              <Note tone="gold">{t("incomeOk")}</Note>
            )}
          </div>
        </Card>
      </div>

      <div className="stack">
        <Card>
          <div className="stat-grid">
            <Stat label={t("monthlyPayment")} value={hkd(aff.monthlyPayment)} tone="gold" sub={pct(rate.appliedRate, 2)} />
            <Stat label={t("firstMonthInterest")} value={hkd(aff.firstMonthInterest)} />
            <Stat label={t("firstMonthPrincipal")} value={hkd(aff.firstMonthPrincipal)} />
            <Stat label={t("totalInterest")} value={hkd(totalInterest)} />
          </div>

          <div className="rows" style={{ marginTop: 14 }}>
            <Row label={t("totalRepayment")} value={hkd(totalInterest + u.loan)} />
          </div>

          <div style={{ marginTop: 14 }}>
            <div className="field-head">
              <span className="field-label">{t("interestShare")}</span>
              <span className="field-value">
                {pct(100 - principalShare, 1)} / {pct(principalShare, 1)}
              </span>
            </div>
            <div className="progress" role="img" aria-label={`${t("firstMonth")}: ${t("interest")} ${pct(100 - principalShare, 1)}, ${t("principal")} ${pct(principalShare, 1)}`}>
              <span className="progress-seg progress-seg--principal" style={{ width: `${principalShare}%` }} />
              <span className="progress-seg progress-seg--interest" style={{ width: `${100 - principalShare}%` }} />
            </div>
            <div className="progress-legend">
              <span>
                <i className="legend-dot" style={{ background: "var(--gold)" }} />
                {t("principal")} {hkd(aff.firstMonthPrincipal)}
              </span>
              <span>
                <i className="legend-dot" style={{ background: "var(--rent)" }} />
                {t("interest")} {hkd(aff.firstMonthInterest)}
              </span>
            </div>
          </div>
        </Card>

        <Card title={t("compareTitle")} sub={t("compareLead")}>
          <div className="compare-grid">
            <div className={`plan-card${inputs.ratePlan === "H" ? " is-active" : ""}`}>
              <div className="plan-card-head">
                <span>{t("hPlan")}</span>
                {inputs.ratePlan === "H" ? <span className="badge badge-gold">{t("total")}</span> : null}
              </div>
              <div className="plan-rate">{pct(Math.min(rate.hPlanRate, rate.capRate), 2)}</div>
              <div className="plan-meta">
                {t("hRateLine", { spread: pct(inputs.hSpread, 2), rate: pct(rate.hPlanRate, 2) })} · {t("capLine", { rate: pct(rate.capRate, 2) })}
              </div>
              <div className="plan-lines">
                <div className="plan-line">
                  <span>{t("compareMonthly")}</span>
                  <b>{hkd(hCappedPayment)}</b>
                </div>
                <div className="plan-line">
                  <span>{t("compareInterest")}</span>
                  <b>{hkd(hTotal)}</b>
                </div>
                <div className="plan-line">
                  <span>{t("uncappedPayment")}</span>
                  <b>{hkd(hPayment)}</b>
                </div>
              </div>
            </div>

            <div className={`plan-card${inputs.ratePlan === "P" ? " is-active" : ""}`}>
              <div className="plan-card-head">
                <span>{t("pPlan")}</span>
                {inputs.ratePlan === "P" ? <span className="badge badge-gold">{t("total")}</span> : null}
              </div>
              <div className="plan-rate">{pct(rate.pPlanRate, 2)}</div>
              <div className="plan-meta">{t("pRateLine", { spread: pct(inputs.pSpread, 2), rate: pct(rate.pPlanRate, 2) })}</div>
              <div className="plan-lines">
                <div className="plan-line">
                  <span>{t("compareMonthly")}</span>
                  <b>{hkd(pPayment)}</b>
                </div>
                <div className="plan-line">
                  <span>{t("compareInterest")}</span>
                  <b>{hkd(pTotal)}</b>
                </div>
                <div className="plan-line">
                  <span>{t("compareDiff")}</span>
                  <b style={{ color: pPayment <= hCappedPayment ? "var(--pos)" : "var(--neg)" }}>
                    {hkd(Math.abs(pPayment - hCappedPayment))}
                  </b>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card
          title={t("amortTitle")}
          sub={t("amortLead")}
          action={
            <div className="legend" style={{ marginTop: 12 }}>
              <span className="legend-item">
                <i className="legend-swatch" style={{ background: "var(--gold)" }} />
                {t("principal")}
              </span>
              <span className="legend-item">
                <i className="legend-swatch" style={{ background: "var(--rent)" }} />
                {t("interest")}
              </span>
              <span className="legend-item">
                <i className="legend-swatch" style={{ background: "var(--text-2)", opacity: 0.7 }} />
                {t("balanceLine")}
              </span>
            </div>
          }
        >
          <AmortChart
            rows={schedule}
            lang={lang}
            labels={{
              interest: t("interest"),
              principal: t("principal"),
              balance: t("balanceLine"),
              year: t("yearLabel", { n: "{n}" }),
              aria: `${t("amortTitle")} — ${t("yearLabel", { n: inputs.termYears })}`,
            }}
          />
          <div className="table-wrap" style={{ marginTop: 18 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("tableYear")}</th>
                  <th>{t("tablePayment")}</th>
                  <th>{t("tableInterest")}</th>
                  <th>{t("tablePrincipal")}</th>
                  <th>{t("tableBalance")}</th>
                </tr>
              </thead>
              <tbody>
                {yearRows.map((r) => (
                  <tr key={r.year}>
                    <td>
                      {r.year} {lang === "zh" ? "年" : "yr"}
                    </td>
                    <td>{num(r.payment, 0)}</td>
                    <td>{num(r.interest, 0)}</td>
                    <td>{num(r.principal, 0)}</td>
                    <td>{shortHkd(r.balance, lang)}</td>
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
