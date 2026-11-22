import type { ReactNode } from "react";

export function Card({
  title,
  sub,
  children,
  className,
  flush,
  action,
}: {
  title?: string;
  sub?: string;
  children: ReactNode;
  className?: string;
  flush?: boolean;
  action?: ReactNode;
}) {
  return (
    <section className={`card ${className ?? ""}`}>
      {title ? (
        <header className="card-head">
          <h2 className="card-title">{title}</h2>
          {sub ? <p className="card-sub">{sub}</p> : null}
          {action}
        </header>
      ) : null}
      <div className={`card-body${flush ? " card-body--flush" : ""}`}>{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "gold" | "pos" | "neg";
}) {
  return (
    <div className={`stat${tone ? ` stat--${tone}` : ""}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub ? <div className="stat-sub">{sub}</div> : null}
    </div>
  );
}

export function Row({
  label,
  value,
  note,
  total,
  muted,
  warn,
}: {
  label: string;
  value: string;
  note?: string;
  total?: boolean;
  muted?: boolean;
  warn?: boolean;
}) {
  const cls = ["row", total ? "row--total" : "", muted ? "row--muted" : "", warn ? "row--warn" : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={cls}>
      <span className="row-label">
        {label}
        {note ? <small>{note}</small> : null}
      </span>
      <span className="row-value">{value}</span>
    </div>
  );
}

export function Note({ children, tone }: { children: ReactNode; tone?: "warn" | "gold" }) {
  return (
    <div className={`note${tone ? ` note--${tone}` : ""}`}>
      <svg className="note-icon" width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path d="M8 7v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="8" cy="4.6" r="0.8" fill="currentColor" />
      </svg>
      <div>{children}</div>
    </div>
  );
}
