"use client";

import type { ReactNode } from "react";

export interface SegmentedProps<T extends string> {
  label?: string;
  value: T;
  options: { value: T; label: string; hint?: string }[];
  onChange: (value: T) => void;
  ariaLabel: string;
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  ariaLabel,
}: SegmentedProps<T>) {
  return (
    <div className="field">
      {label ? (
        <div className="field-head">
          <span className="field-label">{label}</span>
        </div>
      ) : null}
      <div className="segmented" role="group" aria-label={ariaLabel}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            className={`seg-btn${o.value === value ? " is-active" : ""}`}
            aria-pressed={o.value === value}
            title={o.hint}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export interface SwitchProps {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Switch({ label, checked, onChange }: SwitchProps) {
  return (
    <div className="switch-row">
      <span className="switch-label">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={typeof label === "string" ? label : undefined}
        className={`switch${checked ? " is-on" : ""}`}
        onClick={() => onChange(!checked)}
      />
    </div>
  );
}
