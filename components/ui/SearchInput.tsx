"use client";

import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  id,
}: SearchInputProps) {
  return (
    <label className={`relative block min-w-0 ${className}`}>
      <span className="field-icon" aria-hidden="true">
        <Search className="h-4 w-4" />
      </span>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="field-input field-input-with-icon"
      />
    </label>
  );
}
