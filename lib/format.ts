import type { Lang } from "./types";

const grouped = (v: number): string =>
  new Intl.NumberFormat("en-HK", { maximumFractionDigits: 0 }).format(Math.round(v));

/** Full HK$ amount, e.g. HK$5,500,000. */
export function hkd(v: number): string {
  const sign = v < 0 ? "-" : "";
  return `${sign}HK$${grouped(Math.abs(v))}`;
}

/** Plain number with thousands separators. */
export function num(v: number, decimals = 0): string {
  return new Intl.NumberFormat("en-HK", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(v);
}

/** Compact HK money for axis labels and chips. */
export function shortHkd(v: number, lang: Lang): string {
  const sign = v < 0 ? "-" : "";
  const abs = Math.abs(v);
  if (lang === "zh") {
    if (abs >= 100_000_000) return `${sign}${(abs / 100_000_000).toFixed(2)}億`;
    if (abs >= 10_000) {
      const wan = abs / 10_000;
      const digits = wan < 10 ? 2 : wan < 100 ? 1 : 0;
      return `${sign}${wan.toFixed(digits)}萬`;
    }
    return `${sign}${grouped(abs)}`;
  }
  if (abs >= 1_000_000_000) return `${sign}HK$${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}HK$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}HK$${(abs / 1_000).toFixed(0)}k`;
  return `${sign}HK$${grouped(abs)}`;
}

export function pct(v: number, decimals = 2): string {
  return `${new Intl.NumberFormat("en-HK", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(v)}%`;
}

export function signed(v: number, formatter: (n: number) => string): string {
  return `${v > 0 ? "+" : v < 0 ? "−" : ""}${formatter(Math.abs(v))}`;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
