"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

import { COUNTRY_CODES, DEFAULT_COUNTRY_CODE, getCountryByCode } from "@/lib/country-codes";

interface CountryCodeSelectProps {
  value: string; // ISO country code (e.g., "IN")
  onChange: (code: string) => void;
  disabled?: boolean;
  className?: string;
  autoDetect?: boolean;
}

export function CountryCodeSelect({
  value,
  onChange,
  disabled = false,
  className = "",
  autoDetect = false,
}: CountryCodeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Auto-detect country on mount if enabled and no value set
  useEffect(() => {
    if (autoDetect && !value) {
      fetch("/api/geo")
        .then((res) => res.json())
        .then((data) => {
          if (data.countryCode) {
            onChange(data.countryCode);
          }
        })
        .catch(() => {
          onChange(DEFAULT_COUNTRY_CODE);
        });
    }
  }, [autoDetect, value, onChange]);

  const selectedCountry = getCountryByCode(value) || getCountryByCode(DEFAULT_COUNTRY_CODE)!;

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-1 px-2 py-1.5 text-sm border border-border rounded bg-card text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="font-medium">{selectedCountry.dialCode}</span>
        <ChevronDown className="size-3 text-muted-foreground" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close dropdown */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 z-50 w-56 max-h-60 overflow-y-auto bg-card border border-border rounded-md shadow-lg">
            {COUNTRY_CODES.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => {
                  onChange(country.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted ${
                  value === country.code ? "bg-primary/10 text-primary" : "text-foreground"
                }`}
              >
                <span className="w-12 font-medium">{country.dialCode}</span>
                <span className="truncate">{country.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
