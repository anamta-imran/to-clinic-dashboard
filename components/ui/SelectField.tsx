"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface SelectFieldProps {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  icon?: LucideIcon;
  className?: string;
  "aria-label"?: string;
}

export function SelectField({
  value,
  onChange,
  children,
  icon: Icon,
  className = "",
  "aria-label": ariaLabel,
}: SelectFieldProps) {
  return (
    <label className={`relative block min-w-0 ${className}`}>
      {Icon ? (
        <span className="field-icon" aria-hidden="true">
          <Icon className="h-4 w-4" />
        </span>
      ) : null}
      <select
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value)}
        className={`field-input appearance-none pr-8 ${
          Icon ? "field-input-with-icon" : ""
        }`}
      >
        {children}
      </select>
      <span
        className="pointer-events-none absolute inset-y-0 right-0 flex w-8 items-center justify-center text-text-muted"
        aria-hidden="true"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </label>
  );
}
