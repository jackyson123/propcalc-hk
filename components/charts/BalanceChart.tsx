"use client";

import { useMemo, useState } from "react";
import { shortHkd } from "@/lib/format";
import type { RentBuyPoint } from "@/lib/types";
import type { Lang } from "@/lib/types";

const W = 760;
const H = 330;
const M = { top: 22, right: 18, bottom: 34, left: 70 };

function niceStep(raw: number): number {
  if (raw <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / pow;
  const mult = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  return mult * pow;
}

interface Props {
  points: RentBuyPoint[];
  breakEvenYear: number | null;
  lang: Lang;
  labels: {
    buyer: string;
    renter: string;
    year: string;
    diff: string;
    breakEven: string;
    noBreakEven: string;
    aria: string;
  };
}

export function BalanceChart({ points, breakEvenYear, lang, labels }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);

  const maxYear = points.length > 0 ? points[points.length - 1].year : 1;

  const { yMin, yMax, ticks } = useMemo(() => {
    const values = points.flatMap((p) => [p.buyer, p.renter, 0]);
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const step = niceStep((hi - lo) / 4 || 1);
    const min = Math.floor(lo / step) * step;
    const max = Math.ceil(hi / step) * step;
    const list: number[] = [];
    for (let v = min; v <= max + step * 0.001; v += step) list.push(v);
    return { yMin: min, yMax: max, ticks: list };
  }, [points]);

  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;
  const xs = (year: number) => M.left + (year / Math.max(1, maxYear)) * plotW;
  const ys = (v: number) => M.top + (1 - (v - yMin) / Math.max(1, yMax - yMin)) * plotH;

  const line = (key: "buyer" | "renter") =>
    points.map((p, i) => `${i === 0 ? "M" : "L"}${xs(p.year).toFixed(2)},${ys(p[key]).toFixed(2)}`).join(" ");

  const area = (key: "buyer" | "renter") => {
    if (points.length === 0) return "";
    const base = ys(Math.max(yMin, 0));
    return `${line(key)} L${xs(maxYear).toFixed(2)},${base.toFixed(2)} L${xs(0).toFixed(2)},${base.toFixed(2)} Z`;
  };

  const xTicks = useMemo(() => {
    const stepYears = maxYear <= 12 ? 2 : maxYear <= 25 ? 5 : 10;
    const list: number[] = [];
    for (let y = 0; y <= maxYear; y += stepYears) list.push(y);
    if (list[list.length - 1] !== maxYear) list.push(maxYear);
    return list;
  }, [maxYear]);

  const idx = pinned ?? hover;
  const active = idx !== null ? points[idx] : undefined;
  const activeX = active ? xs(active.year) : 0;
  const activeTop = active ? Math.min(ys(active.buyer), ys(active.renter)) : 0;
  const tooltipLeft = Math.min(84, Math.max(16, (activeX / W) * 100));
  const tooltipTop = Math.max(4, (activeTop / H) * 100);

  const handleMove = (clientX: number, target: SVGSVGElement) => {
    const rect = target.getBoundingClientRect();
    const localX = ((clientX - rect.left) / rect.width) * W;
    const ratio = (localX - M.left) / plotW;
    const year = Math.round(ratio * maxYear);
    const clamped = Math.max(0, Math.min(points.length - 1, year));
    setHover(clamped);
  };

  return (
    <div className="chart-wrap">
      <svg
        className="chart-svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={labels.aria}
        tabIndex={0}
        onKeyDown={(e) => {
          const current = idx ?? 0;
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            const next = Math.max(0, Math.min(points.length - 1, current + (e.key === "ArrowRight" ? 1 : -1)));
            setPinned(next);
          }
          if (e.key === "Escape") setPinned(null);
        }}
      >
        <defs>
          <linearGradient id="buyerFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--buy)" stopOpacity="0.24" />
            <stop offset="100%" stopColor="var(--buy)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="renterFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--rent)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--rent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((v) => (
          <g key={v}>
            <line
              className="chart-grid-line"
              x1={M.left}
              x2={W - M.right}
              y1={ys(v)}
              y2={ys(v)}
              strokeDasharray={v === 0 ? "0" : "2 5"}
            />
            <text className="chart-axis-label" x={M.left - 10} y={ys(v) + 3.5} textAnchor="end">
              {shortHkd(v, lang)}
            </text>
          </g>
        ))}

        {xTicks.map((y) => (
          <text
            key={y}
            className="chart-axis-label"
            x={xs(y)}
            y={H - M.bottom + 18}
            textAnchor={y === 0 ? "start" : y === maxYear ? "end" : "middle"}
          >
            {y === 0 ? (lang === "zh" ? "今日" : "Now") : `${y}${lang === "zh" ? "年" : "y"}`}
          </text>
        ))}

        <path d={area("renter")} fill="url(#renterFill)" />
        <path d={area("buyer")} fill="url(#buyerFill)" />
        <path d={line("renter")} fill="none" stroke="var(--rent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <path d={line("buyer")} fill="none" stroke="var(--buy)" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />

        {breakEvenYear !== null ? (
          <g>
            <line
              x1={xs(breakEvenYear)}
              x2={xs(breakEvenYear)}
              y1={M.top}
              y2={H - M.bottom}
              stroke="var(--gold)"
              strokeWidth="1"
              strokeDasharray="3 4"
              opacity="0.55"
            />
            <circle cx={xs(breakEvenYear)} cy={ys(points.find((p) => p.year === breakEvenYear)?.buyer ?? 0)} r="4.5" fill="var(--gold)" stroke="var(--bg)" strokeWidth="1.5" />
            <text
              className="chart-axis-label"
              x={Math.min(xs(breakEvenYear) + 8, W - M.right - 4)}
              y={M.top + 12}
              textAnchor={xs(breakEvenYear) > W - 160 ? "end" : "start"}
              fill="var(--gold)"
            >
              {labels.breakEven}
            </text>
          </g>
        ) : null}

        {active ? (
          <g pointerEvents="none">
            <line
              x1={activeX}
              x2={activeX}
              y1={M.top}
              y2={H - M.bottom}
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.28"
            />
            <circle cx={activeX} cy={ys(active.renter)} r="4" fill="var(--rent)" stroke="var(--bg)" strokeWidth="1.5" />
            <circle cx={activeX} cy={ys(active.buyer)} r="4.5" fill="var(--buy)" stroke="var(--bg)" strokeWidth="1.5" />
          </g>
        ) : null}

        <rect
          x={M.left}
          y={M.top}
          width={plotW}
          height={plotH}
          fill="transparent"
          onPointerMove={(e) => handleMove(e.clientX, e.currentTarget.ownerSVGElement as SVGSVGElement)}
          onPointerLeave={() => setHover(null)}
          onClick={() => setPinned((p) => (p === null ? hover : null))}
          style={{ cursor: "crosshair" }}
        />
      </svg>

      {active ? (
        <div className="chart-tooltip" style={{ left: `${tooltipLeft}%`, top: `${tooltipTop}%`, transform: "translate(-50%, -112%)" }}>
          <div className="chart-tooltip-year">
            {labels.year.replace("{n}", String(active.year))}
          </div>
          <div className="chart-tooltip-row">
            <span>
              <i className="legend-dot" style={{ background: "var(--buy)" }} />
              {labels.buyer}
            </span>
            <strong>{shortHkd(active.buyer, lang)}</strong>
          </div>
          <div className="chart-tooltip-row">
            <span>
              <i className="legend-dot" style={{ background: "var(--rent)" }} />
              {labels.renter}
            </span>
            <strong>{shortHkd(active.renter, lang)}</strong>
          </div>
          <div className="chart-tooltip-diff">
            <span>{labels.diff}</span>
            <strong style={{ color: active.buyer - active.renter >= 0 ? "var(--pos)" : "var(--neg)" }}>
              {shortHkd(active.buyer - active.renter, lang)}
            </strong>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function BreakEvenBadge({
  year,
  text,
  noneText,
}: {
  year: number | null;
  text: string;
  noneText: string;
}) {
  if (year === null) {
    return <span className="badge">{noneText}</span>;
  }
  return <span className="badge badge-gold">{text}</span>;
}
