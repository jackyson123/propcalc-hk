"use client";

import type { CSSProperties } from "react";
import { useId, useRef, useState } from "react";
import { clamp, num } from "@/lib/format";

export interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix?: string;
  hint?: string;
  decimals?: number;
  slider?: boolean;
  /** Human-readable value shown on the right (defaults to the formatted number). */
  display?: string;
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  prefix,
  suffix,
  hint,
  decimals = 0,
  slider = true,
  display,
}: NumberFieldProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<string | null>(null);

  const formatted = num(value, decimals);
  const fillPct = max > min ? ((clamp(value, min, max) - min) / (max - min)) * 100 : 0;

  const commit = (raw: string) => {
    const cleaned = raw.replace(/,/g, "").replace(/[^\d.-]/g, "");
    if (cleaned === "" || cleaned === "-" || cleaned === ".") {
      setDraft(null);
      return;
    }
    const parsed = Number(cleaned);
    setDraft(null);
    if (Number.isFinite(parsed)) onChange(clamp(parsed, min, max));
  };

  return (
    <div className="field">
      <div className="field-head">
        <label className="field-label" htmlFor={id}>
          {label}
        </label>
        {slider || display ? (
          <span className="field-value">{display ?? `${prefix ?? ""}${formatted}${suffix ?? ""}`}</span>
        ) : null}
      </div>

      <div className="range-row">
        <div className="input-wrap">
          {prefix ? <span className="affix">{prefix}</span> : null}
          <input
            id={id}
            ref={inputRef}
            className="input input--right"
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            value={draft ?? formatted}
            onFocus={(e) => {
              setDraft(formatted);
              e.currentTarget.select();
            }}
            onChange={(e) => {
              const raw = e.target.value;
              setDraft(raw);
              const parsed = Number(raw.replace(/,/g, ""));
              if (raw.trim() !== "" && Number.isFinite(parsed)) onChange(parsed);
            }}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                commit((e.target as HTMLInputElement).value);
                inputRef.current?.blur();
              }
            }}
          />
          {suffix ? <span className="affix">{suffix}</span> : null}
        </div>
      </div>

      {slider ? (
        <input
          type="range"
          className="range"
          aria-label={label}
          min={min}
          max={max}
          step={step}
          value={clamp(value, min, max)}
          style={{ "--fill": fillPct } as CSSProperties}
          onChange={(e) => {
            setDraft(null);
            onChange(Number(e.target.value));
          }}
        />
      ) : null}

      {hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}
