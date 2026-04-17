import type { ReactNode } from "react";

export function Panel({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className ? `panel ${className}` : "panel"}>
      <div className="panel-header">
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function ValueCard({
  label,
  value,
  hint,
}: {
  label: ReactNode;
  value: string;
  hint?: string;
}) {
  return (
    <div className="value-card">
      <span className="value-card-label">{label}</span>
      <strong>{value}</strong>
      {hint ? <span className="value-card-hint">{hint}</span> : null}
    </div>
  );
}
