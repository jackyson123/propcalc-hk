"use client";

import { NumberField } from "@/components/ui/NumberField";
import { Segmented, Switch } from "@/components/ui/Controls";
import { Card, Note, Row, Stat } from "@/components/ui/Primitives";
import { mipTier, stampDuty, upfront } from "@/lib/calc";
import { LTV_PRESETS, LIMITS, STAMP_DUTY_BRACKETS } from "@/lib/constants";
import { hkd, num, pct } from "@/lib/format";
import type { T } from "@/lib/i18n";
import type { TabProps } from "./types";

function bandLabel(index: number): string {
  const bracket = STAMP_DUTY_BRACKETS[index];
  const from = index === 0 ? 0 : STAMP_DUTY_BRACKETS[index - 1].upTo + 1;
  const to = bracket.upTo === Number.POSITIVE_INFINITY ? null : bracket.upTo;
  if (to === null) return `${hkd(from)}+`;
  if (index === 0) return `≤ ${hkd(to)}`;
  return `${hkd(from)} – ${hkd(to)}`;
}

function bandRate(index: number, t: T): string {
  const b = STAMP_DUTY_BRACKETS[index];
  if (b.marginalRate === 0) return t("stampFormulaFlat");
  if (b.base === 0) return t("stampFormulaRate", { rate: b.marginalRate });
  return t("stampFormulaMixed", {
    base: hkd(b.base),
    from: hkd(b.marginalFrom),
    rate: b.marginalRate,
  });
}

export function UpfrontTab({ inputs, update, t, lang }: TabProps) {
  const u = upfront(inputs);
  const duty = stampDuty(inputs.price);
  const tierByPrice = mipTier(inputs.price, inputs.firstTime, inputs.fixedIncome);
  const allowed = u.mip.allowedLtvPct;
  const overshoot = inputs.ltvPct > allowed + 0.01;

  const ruleText =
    tierByPrice.rule === "90"
      ? t("rule90")
      : tierByPrice.rule === "90_capped"
        ? t("rule90capped")
        : tierByPrice.rule === "80"
          ? t("rule80")
          : tierByPrice.rule === "80_capped"
            ? t("rule80capped")
            : t("ruleNone");

  const rules = [
    { key: "90", text: t("rule90") },
    { key: "90_capped", text: t("rule90capped") },
    { key: "80", text: t("rule80") },
    { key: "80_capped", text: t("rule80capped") },
    { key: "none", text: t("ruleNone") },
  ];

  return (
    <div className="panel-grid">
      <div className="stack">
        <Card title={t("property")} sub={t("propertyHint")}>
          <NumberField
            label={t("price")}
            value={inputs.price}
            onChange={(price) => update({ price })}
            min={LIMITS.price.min}
            max={LIMITS.price.max}
            step={LIMITS.price.step}
            prefix="HK$"
          />
          <NumberField
            label={t("ltv")}
            value={inputs.ltvPct}
            onChange={(ltvPct) => update({ ltvPct })}
            min={LIMITS.ltvPct.min}
            max={LIMITS.ltvPct.max}
            step={LIMITS.ltvPct.step}
            suffix="%"
            hint={t("ltvHint")}
          />
          <Segmented
            value={String(inputs.ltvPct)}
            ariaLabel={t("ltv")}
            onChange={(v) => update({ ltvPct: Number(v) })}
            options={LTV_PRESETS.map((v) => ({ value: String(v), label: `${v}%` }))}
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
        </Card>

        <Card title={t("transactionCosts")}>
          <NumberField
            label={t("agentFee")}
            value={inputs.agentPct}
            onChange={(agentPct) => update({ agentPct })}
            min={LIMITS.agentPct.min}
            max={LIMITS.agentPct.max}
            step={LIMITS.agentPct.step}
            decimals={2}
            suffix="%"
            hint={t("hintAgent")}
          />
          <NumberField
            label={t("legalFee")}
            value={inputs.legalFee}
            onChange={(legalFee) => update({ legalFee })}
            min={LIMITS.legalFee.min}
            max={LIMITS.legalFee.max}
            step={LIMITS.legalFee.step}
            prefix="HK$"
            slider={false}
            hint={t("hintLegal")}
          />
          <NumberField
            label={t("miscFee")}
            value={inputs.miscFee}
            onChange={(miscFee) => update({ miscFee })}
            min={LIMITS.miscFee.min}
            max={LIMITS.miscFee.max}
            step={LIMITS.miscFee.step}
            prefix="HK$"
            slider={false}
          />
        </Card>

        <Card title={t("mipRequirement")} sub={t("mipLead")}>
          <Switch
            label={lang === "zh" ? "首次置業／無其他香港住宅物業" : "First-time buyer / no other HK home"}
            checked={inputs.firstTime}
            onChange={(firstTime) => update({ firstTime })}
          />
          <Switch
            label={lang === "zh" ? "固定受薪人士" : "Salaried (fixed income)"}
            checked={inputs.fixedIncome}
            onChange={(fixedIncome) => update({ fixedIncome })}
          />
          <Switch label={t("mipFinanced")} checked={inputs.mipFinanced} onChange={(v) => update({ mipFinanced: v })} />
          <div className="divider" />
          <div className={`badge ${inputs.ltvPct > 70 ? "badge-gold" : ""}`}>
            {u.mip.required && u.mip.eligible
              ? `${t("mipPremiumRate")} ${pct(u.mip.premiumRatePct, 3)} · ${hkd(u.mip.premium)}`
              : t("mipNoNeed")}
          </div>
          <p className="field-hint" style={{ marginTop: 10 }}>
            {t("mipFinancedHint")}
          </p>
        </Card>
      </div>

      <div className="stack">
        <Card title={t("upfrontTitle")} sub={t("upfrontLead")}>
          <div className="rows">
            <Row label={t("downPayment")} note={t("downPaymentNote")} value={hkd(u.downPayment)} />
            <Row label={t("stampDuty")} value={hkd(u.stampDuty)} note={pct(duty.effectiveRatePct, 3)} />
            <Row label={t("agentFee")} value={hkd(u.agentFee)} note={pct(inputs.agentPct, 2)} />
            <Row label={t("legalFee")} value={hkd(u.legalFee)} />
            <Row label={t("miscFee")} value={hkd(u.miscFee)} />
            <Row
              label={inputs.mipFinanced ? t("mipPremiumFinanced") : t("mipPremiumCash")}
              value={hkd(u.mip.premium)}
              muted={inputs.mipFinanced}
              note={u.mip.required ? pct(u.mip.premiumRatePct, 3) : undefined}
            />
            <Row label={t("cashNeeded")} value={hkd(u.cashNeeded)} total />
          </div>

          {overshoot && u.mip.eligible ? (
            <div style={{ marginTop: 16 }}>
              <Note tone="warn">{t("mipWarnAbove", { chosen: num(inputs.ltvPct), max: pct(allowed, 1) })}</Note>
            </div>
          ) : null}
          {!u.mip.eligible ? (
            <div style={{ marginTop: 16 }}>
              <Note tone="warn">{t("mipWarnNone", { max: pct(allowed, 0) })}</Note>
            </div>
          ) : null}

          <div className="divider" />
          <div className="rows">
            <Row label={t("loanAmount")} value={hkd(u.loan)} note={pct(inputs.ltvPct, 0)} />
            <Row label={t("totalCost")} value={hkd(u.totalCost)} />
          </div>
        </Card>

        <Card title={t("stampDutyTitle")} sub={t("stampDutyLead")}>
          <div className="stat-grid">
            <Stat label={t("stampDuty")} value={hkd(duty.amount)} tone="gold" sub={t("stampBracketValue", { n: duty.bracket + 1 })} />
            <Stat label={t("stampEffective")} value={pct(duty.effectiveRatePct, 3)} sub={bandLabel(duty.bracket)} />
          </div>
          <div className="duty-list" role="list" aria-label={t("stampDutyTitle")}>
            {STAMP_DUTY_BRACKETS.map((b, i) => (
              <div key={`${b.upTo}-${i}`} className={`duty-item${i === duty.bracket ? " is-active" : ""}`} role="listitem">
                <span>{bandLabel(i)}</span>
                <span>{bandRate(i, t)}</span>
              </div>
            ))}
          </div>
          <p className="field-hint" style={{ marginTop: 10 }}>
            {t("dataNote")}
          </p>
        </Card>

        <Card title={t("mipTitle")}>
          <div className="stat-grid">
            <Stat label={t("mipAllowed")} value={pct(allowed, 1)} tone="gold" sub={ruleText} />
            <Stat
              label={t("mipPremiumRate")}
              value={u.mip.required && u.mip.eligible ? pct(u.mip.premiumRatePct, 3) : "—"}
              sub={t("mipPremium")}
            />
            <Stat
              label={t("mipPremium")}
              value={u.mip.required && u.mip.eligible ? hkd(u.mip.premium) : "—"}
              sub={inputs.mipFinanced ? t("mipFinanced") : t("mipPremiumCash")}
            />
          </div>
          <div className="divider" />
          <div className="duty-list">
            {rules.map((r) => (
              <div key={r.key} className={`duty-item${r.key === tierByPrice.rule ? " is-active" : ""}`}>
                <span>{r.text}</span>
              </div>
            ))}
          </div>
          <div className="divider" />
          <Note>{t("hkmaNote")}</Note>
        </Card>
      </div>
    </div>
  );
}
