import React from "react";
import { Calendar, Clock, CheckCircle, CreditCard } from "lucide-react";
import Card from "../../../../components/ui/Card";
import { formatCurrency } from "../../../../utils/formatters";

interface Stats {
  total: number;
  enAttente: number;
  confirmees: number;
  revenuTotal: number;
}

interface Props {
  stats: Stats;
}

const ReservationStatsRibbon: React.FC<Props> = ({ stats }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
    {[
      { label: "Total", value: stats.total, icon: Calendar, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
      { label: "En attente", value: stats.enAttente, icon: Clock, iconBg: "bg-amber-100", iconColor: "text-amber-600" },
      { label: "Confirmées", value: stats.confirmees, icon: CheckCircle, iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
      { label: "Revenus", value: formatCurrency(stats.revenuTotal), icon: CreditCard, iconBg: "bg-teal-100", iconColor: "text-teal-600" },
    ].map((stat, i) => (
      <Card key={i} className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${stat.iconBg} rounded-xl flex items-center justify-center`}>
            <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
          </div>
        </div>
      </Card>
    ))}
  </div>
);

export default ReservationStatsRibbon;
