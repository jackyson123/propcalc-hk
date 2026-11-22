import { DEFAULTS, LIMITS } from "./constants";
import type { Inputs, RatePlan } from "./types";

const NUMERIC_KEYS = Object.keys(LIMITS) as (keyof typeof LIMITS)[];

type FlagKey = "firstTime" | "fixedIncome" | "mipFinanced";
const FLAG_KEYS: FlagKey[] = ["firstTime", "fixedIncome", "mipFinanced"];

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(token: string): string {
  const padded = token.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

const round2 = (v: number): number => Math.round(v * 100) / 100;

/** Compact, URL-safe snapshot of every input. */
export function encodeInputs(inputs: Inputs): string {
  const payload: (number | string)[] = NUMERIC_KEYS.map((k) => round2(inputs[k]));
  FLAG_KEYS.forEach((k) => payload.push(inputs[k] ? 1 : 0));
  payload.push(inputs.ratePlan);
  return toBase64Url(JSON.stringify(payload));
}

/** Decode a share token, falling back to defaults for anything invalid. */
export function decodeInputs(token: string | null | undefined): Inputs {
  if (!token) return { ...DEFAULTS };
  try {
    const parsed: unknown = JSON.parse(fromBase64Url(token));
    if (!Array.isArray(parsed)) return { ...DEFAULTS };
    const next: Inputs = { ...DEFAULTS };
    NUMERIC_KEYS.forEach((key, i) => {
      const raw = parsed[i];
      if (typeof raw !== "number" || !Number.isFinite(raw)) return;
      const limit = LIMITS[key];
      next[key] = Math.min(limit.max, Math.max(limit.min, raw));
    });
    FLAG_KEYS.forEach((key, i) => {
      const raw = parsed[NUMERIC_KEYS.length + i];
      if (raw === 0 || raw === 1) next[key] = raw === 1;
    });
    const plan = parsed[NUMERIC_KEYS.length + FLAG_KEYS.length];
    if (plan === "H" || plan === "P") next.ratePlan = plan as RatePlan;
    if (next.price < 100_000) next.price = DEFAULTS.price;
    next.termYears = Math.round(next.termYears);
    next.horizonYears = Math.round(next.horizonYears);
    return next;
  } catch {
    return { ...DEFAULTS };
  }
}

export function readTokenFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("s");
}

export function buildShareUrl(inputs: Inputs): string {
  const base = typeof window === "undefined" ? "" : window.location.origin + window.location.pathname;
  return `${base}?s=${encodeInputs(inputs)}`;
}
