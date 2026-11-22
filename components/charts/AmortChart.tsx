"use client";

import { useMemo, useState } from "react";
import { shortHkd } from "@/lib/format";
import type { AmortRow, Lang } from "@/lib/types";

const W = 760;
const H = 260;
const M = { top: 18, right: 58, bottom: 30, left: 62 };

function niceMax(raw: number): number {
  if (raw <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / pow;
  const mult = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  return mult * pow;
}

interface YearRow {
  year: number;
  principal: number;
  interest: number;
  balance: number;
}

export function AmortChart({
  rows,
  lang,
  labels,
}: {
  rows: AmortRow[];
  lang: Lang;
  labels: { interest: string; principal: string; balance: string; year: string; aria: string };
}) {
  const [hover, setHover] = useState<number | null>(null);

  const years = useMemo<YearRow[]>(() => {
    const out: YearRow[] = [];
    rows.forEach((r) => {
      const year = Math.ceil(r.month / 12);
      let bucket = out[year - 1];
      if (!bucket) {
        bucket = { year, principal: 0, interest: 0, balance: r.balance };
        out[year - 1] = bucket;
      }
      bucket.principal += r.principal;
      bucket.interest += r.interest;
      bucket.balance = r.balance;
    });
    return out.filter(Boolean);
  }, [rows]);

  const rawMax = Math.max(...years.map((y) => y.principal + y.interest), 1);
  const tickStep = niceMax(rawMax / 4);
  const maxPay = tickStep * 4;
  const maxBalance = Math.max(...years.map((y) => y.balance), 1);
  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;
  const band = plotW / Math.max(1, years.length);
  const barW = Math.min(30, band * 0.62);
  const ys = (v: number) => M.top + (1 - v / maxPay) * plotH;
  const yb = (v: number) => M.top + (1 - v / maxBalance) * plotH;

  const balancePath = years
    .map((y, i) => `${i === 0 ? "M" : "L"}${(M.left + band * (i + 0.5)).toFixed(2)},${yb(y.balance).toFixed(2)}`)
    .join(" ");

  const xTicks = years.filter((y) => y.year === 1 || y.year % 5 === 0 || y.year === years.length);
  const active = hover !== null ? years[hover] : undefined;
  const activeX = hover !== null ? M.left + band * (hover + 0.5) : 0;

  return (
    <div className="chart-wrap">
      <svg
        className="chart-svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={labels.aria}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="principalBar" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="var(--gold-deep)" />
            <stop offset="100%" stopColor="var(--gold-2)" />
          </linearGradient>
          <linearGradient id="interestBar" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="rgba(131,182,216,0.35)" />
            <stop offset="100%" stopColor="rgba(131,182,216,0.8)" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line
              className="chart-grid-line"
              x1={M.left}
              x2={W - M.right}
              y1={M.top + plotH * f}
              y2={M.top + plotH * f}
              strokeDasharray={f === 1 ? "0" : "2 5"}
            />
            <text className="chart-axis-label" x={M.left - 9} y={M.top + plotH * f + 3.5} textAnchor="end">
              {shortHkd(maxPay * (1 - f), lang)}
            </text>
            <text
              className="chart-axis-label"
              x={W - M.right + 9}
              y={M.top + plotH * f + 3.5}
              textAnchor="start"
              opacity="0.65"
            >
              {shortHkd(maxBalance * (1 - f), lang)}
            </text>
          </g>
        ))}

        {years.map((y, i) => {
          const x = M.left + band * (i + 0.5);
          const baseline = M.top + plotH;
          const principalTop = ys(y.principal);
          const interestTop = ys(y.principal + y.interest);
          return (
            <g key={y.year} opacity={hover === null || hover === i ? 1 : 0.45}>
              <rect
                x={x - barW / 2}
                y={interestTop}
                width={barW}
                height={Math.max(0, principalTop - interestTop)}
                fill="url(#interestBar)"
                rx="1.5"
              />
              <rect
                x={x - barW / 2}
                y={principalTop}
                width={barW}
                height={Math.max(1, baseline - principalTop)}
                fill="url(#principalBar)"
                rx="1.5"
              />
            </g>
          );
        })}

        <path d={balancePath} fill="none" stroke="var(--text-2)" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.75" />

        {xTicks.map((y) => (
          <text
            key={y.year}
            className="chart-axis-label"
            x={M.left + band * (y.year - 0.5)}
            y={H - M.bottom + 16}
            textAnchor="middle"
          >
            {y.year}
          </text>
        ))}

        {active ? (
          <line x1={activeX} x2={activeX} y1={M.top} y2={H - M.bottom} stroke="currentColor" strokeWidth="1" opacity="0.25" />
        ) : null}

        {years.map((y, i) => (
          <rect
            key={`hit-${y.year}`}
            x={M.left + band * i}
            y={M.top}
            width={band}
            height={plotH}
            fill="transparent"
            onPointerEnter={() => setHover(i)}
            onPointerMove={() => setHover(i)}
          />
        ))}
      </svg>

      {active ? (
        <div
          className="chart-tooltip"
          style={{
            left: `${Math.min(82, Math.max(18, (activeX / W) * 100))}%`,
            top: `${Math.max(6, (ys(active.principal + active.interest) / H) * 100)}%`,
            transform: "translate(-50%, -108%)",
          }}
        >
          <div className="chart-tooltip-year">{labels.year.replace("{n}", String(active.year))}</div>
          <div className="chart-tooltip-row">
            <span>
              <i className="legend-dot" style={{ background: "var(--gold)" }} />
              {labels.principal}
            </span>
            <strong>{shortHkd(active.principal, lang)}</strong>
          </div>
          <div className="chart-tooltip-row">
            <span>
              <i className="legend-dot" style={{ background: "var(--rent)" }} />
              {labels.interest}
            </span>
            <strong>{shortHkd(active.interest, lang)}</strong>
          </div>
          <div className="chart-tooltip-diff">
            <span>{labels.balance}</span>
            <strong>{shortHkd(active.balance, lang)}</strong>
          </div>
        </div>
      ) : null}
    </div>
  );
}
