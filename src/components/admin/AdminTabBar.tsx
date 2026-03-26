import React from "react";

export interface AdminTab {
  key: string;
  label: string;
  count?: number;
  /** Point de couleur affiché avant le label (variant flat uniquement) */
  dot?: string;
  icon?: React.ReactNode;
}

interface AdminTabBarProps {
  tabs: AdminTab[];
  active: string;
  onChange: (key: string) => void;
  /**
   * `flat`  — onglets sans conteneur, actif = bg-gray-900 (tableaux, filtres de liste)
   * `pill`  — conteneur gris pill, actif = bg-white shadow (sections page, journal/historique)
   */
  variant?: "flat" | "pill";
  className?: string;
}

export default function AdminTabBar({
  tabs,
  active,
  onChange,
  variant = "flat",
  className = "",
}: AdminTabBarProps) {
  const wrapper =
    variant === "pill"
      ? `flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit ${className}`
      : `flex items-center gap-1 overflow-x-auto ${className}`;

  const activeClass =
    variant === "pill"
      ? "bg-white text-gray-900 shadow-sm"
      : "bg-gray-900 text-white";

  const inactiveClass =
    variant === "pill"
      ? "text-gray-500 hover:text-gray-700"
      : "text-gray-500 hover:bg-gray-100 hover:text-gray-700";

  return (
    <div className={wrapper}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
              isActive ? activeClass : inactiveClass
            }`}
          >
            {tab.icon && <span className="w-4 h-4 flex items-center">{tab.icon}</span>}
            {variant === "flat" && tab.dot && (
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-white" : tab.dot}`} />
            )}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md tabular-nums ${
                isActive && variant === "flat"
                  ? "bg-white/20 text-white"
                  : isActive && variant === "pill"
                  ? "bg-gray-100 text-gray-600"
                  : "bg-gray-200 text-gray-600"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
