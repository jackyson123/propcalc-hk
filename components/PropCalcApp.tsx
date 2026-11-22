"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MortgageTab } from "@/components/tabs/MortgageTab";
import { RentBuyTab } from "@/components/tabs/RentBuyTab";
import { UpfrontTab } from "@/components/tabs/UpfrontTab";
import { YieldTab } from "@/components/tabs/YieldTab";
import { affordability, rates, upfront } from "@/lib/calc";
import { DEFAULTS } from "@/lib/constants";
import { hkd, shortHkd } from "@/lib/format";
import { makeT } from "@/lib/i18n";
import { SCENARIOS, scenarioInputs } from "@/lib/scenarios";
import { buildShareUrl, decodeInputs, readTokenFromLocation } from "@/lib/state";
import type { Inputs, Lang, TabId } from "@/lib/types";

type Theme = "dark" | "light";

const TAB_KEYS = {
  upfront: "tabUpfront",
  mortgage: "tabMortgage",
  rentbuy: "tabRentBuy",
  yield: "tabYield",
} as const;

function BrandMark() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="markGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--gold-2)" />
          <stop offset="100%" stopColor="var(--gold-deep)" />
        </linearGradient>
      </defs>
      <path d="M12 2.6 21 7v10l-9 4.4L3 17V7l9-4.4Z" fill="none" stroke="url(#markGradient)" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M8.2 15.8V9.6h4.3a2.4 2.4 0 0 1 0 4.8H8.2" fill="none" stroke="url(#markGradient)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PropCalcApp() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULTS);
  const [tab, setTab] = useState<TabId>("upfront");
  const [lang, setLang] = useState<Lang>("zh");
  const [theme, setTheme] = useState<Theme>("dark");
  const [toast, setToast] = useState<string | null>(null);
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const hydrated = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const t = makeT(lang);

  useEffect(() => {
    const token = readTokenFromLocation();
    if (token) setInputs(decodeInputs(token));
    try {
      const storedLang = localStorage.getItem("propcalc-lang");
      if (storedLang === "en" || storedLang === "zh") setLang(storedLang);
      const storedTheme = localStorage.getItem("propcalc-theme");
      if (storedTheme === "light" || storedTheme === "dark") setTheme(storedTheme);
    } catch {
      /* storage unavailable — defaults are fine */
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("propcalc-theme", theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-HK" : "en";
    try {
      localStorage.setItem("propcalc-lang", lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  useEffect(() => {
    if (!hydrated.current) return;
    const url = buildShareUrl(inputs);
    window.history.replaceState(null, "", url);
  }, [inputs]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const update = useCallback((patch: Partial<Inputs>) => {
    setScenarioId(null);
    setInputs((prev) => ({ ...prev, ...patch }));
  }, []);

  const applyScenario = (id: string) => {
    const scenario = SCENARIOS.find((s) => s.id === id);
    if (!scenario) return;
    setInputs(scenarioInputs(scenario));
    setScenarioId(id);
  };

  const share = async () => {
    const url = buildShareUrl(inputs);
    try {
      await navigator.clipboard.writeText(url);
      showToast(t("shareCopied"));
    } catch {
      try {
        const area = document.createElement("textarea");
        area.value = url;
        area.setAttribute("readonly", "true");
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(area);
        showToast(ok ? t("shareCopied") : t("shareFailed"));
      } catch {
        showToast(t("shareFailed"));
      }
    }
  };

  const rate = rates(inputs);
  const u = upfront(inputs);
  const aff = affordability(inputs, rate);

  const tabContent = {
    upfront: <UpfrontTab inputs={inputs} update={update} t={t} lang={lang} />,
    mortgage: <MortgageTab inputs={inputs} update={update} t={t} lang={lang} />,
    rentbuy: <RentBuyTab inputs={inputs} update={update} t={t} lang={lang} />,
    yield: <YieldTab inputs={inputs} update={update} t={t} lang={lang} />,
  }[tab];

  return (
    <>
      <header className="site-header">
        <div className="shell header-inner">
          <div className="brand">
            <span className="brand-mark">
              <BrandMark />
            </span>
            <span className="brand-text">
              <span className="brand-name">{t("brand")}</span>
              <span className="brand-sub">{t("brandSub")}</span>
            </span>
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="icon-btn"
              onClick={() => setLang(lang === "zh" ? "en" : "zh")}
              aria-label={lang === "zh" ? "Switch to English" : "切換至中文"}
            >
              {t("langToggle")}
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={theme === "dark" ? t("themeLight") : t("themeDark")}
              title={theme === "dark" ? t("themeLight") : t("themeDark")}
            >
              {theme === "dark" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <circle cx="12" cy="12" r="4.2" />
                  <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <path d="M20 14.6A8.6 8.6 0 0 1 9.4 4a8.6 8.6 0 1 0 10.6 10.6Z" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <button type="button" className="share-btn" onClick={share}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M10 13.5a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7L11.5 6.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 10.5a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.4-1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{t("share")}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="shell">
        <section className="hero">
          <span className="hero-eyebrow">{t("heroEyebrow")}</span>
          <div className="hero-head">
            <h1 className="hero-title">
              {t("heroTitleA")}
              <em>{t("heroTitleB")}</em>
            </h1>
            <p className="hero-lead">{t("heroLead")}</p>
          </div>

          <div className="kpi-row">
            <div className="kpi">
              <div className="kpi-label">
                <span>{t("kpiPrice")}</span>
              </div>
              <div className="kpi-value">{shortHkd(inputs.price, lang)}</div>
              <div className="kpi-note">HK${new Intl.NumberFormat("en-HK").format(inputs.price)}</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">
                <span>{t("kpiDown")}</span>
                <span className="badge">{t("kpiDownNote", { ltv: inputs.ltvPct })}</span>
              </div>
              <div className="kpi-value">{shortHkd(u.downPayment, lang)}</div>
              <div className="kpi-note">{hkd(u.downPayment)}</div>
            </div>
            <div className="kpi kpi--accent">
              <div className="kpi-label">
                <span>{t("kpiCash")}</span>
              </div>
              <div className="kpi-value kpi-value--gold">{shortHkd(u.cashNeeded, lang)}</div>
              <div className="kpi-note">{hkd(u.cashNeeded)}</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">
                <span>{t("kpiMonthly")}</span>
                <span className="badge">{rate.capped ? t("capped") : `${inputs.ltvPct}%`}</span>
              </div>
              <div className="kpi-value">{shortHkd(aff.monthlyPayment, lang)}</div>
              <div className="kpi-note">{hkd(aff.monthlyPayment)}</div>
            </div>
          </div>

          <div className="scenario-block">
            <div className="scenario-head">
              <span className="scenario-title">{t("scenarios")}</span>
              <span className="scenario-hint">{t("scenariosHint")}</span>
            </div>
            <div className="scenario-row">
              {SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`scenario-chip${scenarioId === s.id ? " is-active" : ""}`}
                  onClick={() => applyScenario(s.id)}
                  aria-pressed={scenarioId === s.id}
                >
                  <span className="scenario-chip-name">{s.name[lang]}</span>
                  <span className="scenario-chip-meta">{s.blurb[lang]}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <nav className="tabs" aria-label={t("brand")}>
          {(Object.keys(TAB_KEYS) as TabId[]).map((id, i) => (
            <button
              key={id}
              type="button"
              className={`tab${tab === id ? " is-active" : ""}`}
              onClick={() => setTab(id)}
              aria-current={tab === id ? "page" : undefined}
            >
              <span className="tab-index">{String(i + 1).padStart(2, "0")}</span>
              {t(TAB_KEYS[id])}
            </button>
          ))}
        </nav>

        <div className="tab-panel" key={tab}>
          {tabContent}
        </div>
      </main>

      <footer className="site-footer">
        <div className="shell footer-grid">
          <div className="footer-text">
            <p style={{ marginBottom: 8 }}>{t("disclaimer")}</p>
            <p style={{ marginBottom: 8 }}>{t("dataNote")}</p>
            <p>{t("footerNote")}</p>
          </div>
          <div className="footer-meta">
            <span>
              {t("source")}:{" "}
              <a className="footer-link" href="https://www.ird.gov.hk/chi/faq/avd.htm" target="_blank" rel="noopener noreferrer">
                IRD
              </a>
              {" · "}
              <a className="footer-link" href="https://www.hkmc.com.hk/chi/our_business/mortgage_insurance_programme.html" target="_blank" rel="noopener noreferrer">
                HKMCI
              </a>
              {" · "}
              <a className="footer-link" href="https://www.hkma.gov.hk/chi/" target="_blank" rel="noopener noreferrer">
                HKMA
              </a>
            </span>
            <span>{t("footerBuilt")}</span>
            <span>PropCalc HK · 2026</span>
          </div>
        </div>
      </footer>

      {toast ? (
        <div className="toast" role="status" aria-live="polite">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" aria-hidden="true">
            <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {toast}
        </div>
      ) : null}
    </>
  );
}
