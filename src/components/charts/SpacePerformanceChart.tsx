import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { SpacePerformance } from "../../services/statistics";

interface SpacePerformanceChartProps {
  data: SpacePerformance[];
}

const COLORS = ["#d97706", "#059669", "#0284c7", "#dc2626", "#7c3aed"];

const formatCurrencyShort = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return `${value}`;
};

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: SpacePerformance }[] }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
      <p className="text-sm font-medium text-gray-900 mb-1">{d.name}</p>
      <p className="text-sm text-gray-600">
        Reservations: <span className="font-semibold">{d.reservations}</span>
      </p>
      <p className="text-sm text-gray-600">
        Revenus: <span className="font-semibold">{formatCurrencyShort(d.revenue)} DA</span>
      </p>
      <p className="text-sm text-gray-600">
        Part: <span className="font-semibold">{d.percentage}%</span>
      </p>
    </div>
  );
};

export default function SpacePerformanceChart({ data }: SpacePerformanceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={formatCurrencyShort} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
          {data.map((_, idx) => (
            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
