import React from "react";

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  /** Petit badge affiché à côté du titre (ex: "3 en attente") */
  badge?: { label: string; color?: "amber" | "red" | "emerald" | "blue" };
  actions?: React.ReactNode;
}

const BADGE_COLORS = {
  amber:   "bg-amber-100 text-amber-700",
  red:     "bg-red-100 text-red-700",
  emerald: "bg-emerald-100 text-emerald-700",
  blue:    "bg-blue-100 text-blue-700",
};

export default function AdminPageHeader({ title, subtitle, badge, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{title}</h1>
          {badge && (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${BADGE_COLORS[badge.color ?? "amber"]}`}>
              {badge.label}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
