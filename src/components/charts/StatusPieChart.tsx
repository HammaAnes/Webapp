import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { ReservationStatusBreakdown } from "../../services/statistics";

interface StatusPieChartProps {
  data: ReservationStatusBreakdown;
}

const STATUS_CONFIG = [
  { key: "confirmees", label: "Confirmees", color: "#059669" },
  { key: "enAttente", label: "En attente", color: "#d97706" },
  { key: "terminees", label: "Terminees", color: "#0284c7" },
  { key: "annulees", label: "Annulees", color: "#dc2626" },
] as const;

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
      <p className="text-sm text-gray-600">
        {payload[0].name}: <span className="font-semibold text-gray-900">{payload[0].value}</span>
      </p>
    </div>
  );
};

export default function StatusPieChart({ data }: StatusPieChartProps) {
  const chartData = STATUS_CONFIG
    .map((s) => ({ name: s.label, value: data[s.key], color: s.color }))
    .filter((d) => d.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">
        Aucune donnee pour cette periode
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((entry, idx) => (
            <Cell key={idx} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value) => <span className="text-xs text-gray-700">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
