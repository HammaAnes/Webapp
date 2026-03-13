import React from "react";
import { Video as LucideIcon } from "lucide-react";

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "blue" | "green" | "orange" | "red" | "purple";
  onClick?: () => void;
}

const colorClasses = {
  blue: {
    bg: "bg-blue-50",
    icon: "text-blue-600",
    trend: "text-blue-600",
  },
  green: {
    bg: "bg-green-50",
    icon: "text-green-600",
    trend: "text-green-600",
  },
  orange: {
    bg: "bg-orange-50",
    icon: "text-orange-600",
    trend: "text-orange-600",
  },
  red: {
    bg: "bg-red-50",
    icon: "text-red-600",
    trend: "text-red-600",
  },
  purple: {
    bg: "bg-purple-50",
    icon: "text-purple-600",
    trend: "text-purple-600",
  },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color = "blue",
  onClick,
}: StatCardProps) {
  const colors = colorClasses[color];

  return (
    <div
      className={`bg-white rounded-lg shadow p-6 border border-border transition-all ${
        onClick ? "cursor-pointer hover:shadow-md" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted mb-1">{title}</p>
          <p className="text-3xl font-bold text-primary">{value}</p>
          {trend && (
            <p
              className={`text-sm mt-2 ${
                trend.isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {trend.isPositive ? "+" : ""}
              {trend.value}%
            </p>
          )}
        </div>
        <div className={`${colors.bg} p-3 rounded-full`}>
          <Icon className={`h-6 w-6 ${colors.icon}`} />
        </div>
      </div>
    </div>
  );
}
