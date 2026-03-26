import React from "react";
import type { LucideIcon } from "lucide-react";
import Card from "../ui/Card";

type KpiColor = "amber" | "emerald" | "blue" | "red" | "teal" | "orange" | "violet" | "gray";

interface AdminKpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color?: KpiColor;
  sublabel?: string;
  /** Tendance ex: "+12%" — vert si commence par +, rouge si - */
  trend?: string;
  onClick?: () => void;
}

const COLOR_MAP: Record<KpiColor, { icon: string; bg: string; value: string }> = {
  amber:   { icon: "text-amber-600",   bg: "bg-amber-50",   value: "text-amber-700"   },
  emerald: { icon: "text-emerald-600", bg: "bg-emerald-50", value: "text-emerald-700" },
  blue:    { icon: "text-blue-600",    bg: "bg-blue-50",    value: "text-blue-700"    },
  red:     { icon: "text-red-600",     bg: "bg-red-50",     value: "text-red-700"     },
  teal:    { icon: "text-teal-600",    bg: "bg-teal-50",    value: "text-teal-700"    },
  orange:  { icon: "text-orange-600",  bg: "bg-orange-50",  value: "text-orange-700"  },
  violet:  { icon: "text-violet-600",  bg: "bg-violet-50",  value: "text-violet-700"  },
  gray:    { icon: "text-gray-500",    bg: "bg-gray-100",   value: "text-gray-700"    },
};

export default function AdminKpiCard({
  icon: Icon,
  label,
  value,
  color = "gray",
  sublabel,
  trend,
  onClick,
}: AdminKpiCardProps) {
  const { icon: iconColor, bg, value: valueColor } = COLOR_MAP[color];
  const isPositiveTrend = trend?.startsWith("+");
  const isNegativeTrend = trend?.startsWith("-");

  return (
    <Card
      className="p-4"
      onClick={onClick}
      interactive={Boolean(onClick)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
          <p className={`text-2xl font-bold ${valueColor} leading-none`}>{value}</p>
          {sublabel && <p className="mt-1 text-xs text-gray-400">{sublabel}</p>}
          {trend && (
            <p className={`mt-1.5 text-xs font-medium ${
              isPositiveTrend ? "text-emerald-600" : isNegativeTrend ? "text-red-600" : "text-gray-500"
            }`}>
              {trend}
            </p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
    </Card>
  );
}
