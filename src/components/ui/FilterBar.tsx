import React from "react";
import Select from "./Select";
import Input from "./Input";
import Button from "./Button";
import { X } from "lucide-react";

export interface Filter {
  key: string;
  label: string;
  type: "select" | "date" | "text";
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export interface FilterBarProps {
  filters: Filter[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onReset: () => void;
  showReset?: boolean;
}

export function FilterBar({
  filters,
  values,
  onChange,
  onReset,
  showReset = true,
}: FilterBarProps) {
  const hasActiveFilters = Object.values(values).some((v) => v !== "");

  return (
    <div className="bg-secondary p-4 rounded-lg border border-border">
      <div className="flex flex-wrap items-center gap-4">
        {filters.map((filter) => (
          <div key={filter.key} className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-muted mb-1">
              {filter.label}
            </label>
            {filter.type === "select" && filter.options ? (
              <Select
                value={values[filter.key] || ""}
                onChange={(value) => onChange(filter.key, value)}
                options={[
                  { value: "", label: filter.placeholder || "Tous" },
                  ...filter.options,
                ]}
              />
            ) : filter.type === "date" ? (
              <Input
                type="date"
                value={values[filter.key] || ""}
                onChange={(e) => onChange(filter.key, e.target.value)}
                placeholder={filter.placeholder}
              />
            ) : (
              <Input
                type="text"
                value={values[filter.key] || ""}
                onChange={(e) => onChange(filter.key, e.target.value)}
                placeholder={filter.placeholder}
              />
            )}
          </div>
        ))}

        {showReset && hasActiveFilters && (
          <div className="flex items-end">
            <Button
              variant="secondary"
              onClick={onReset}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Réinitialiser
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
