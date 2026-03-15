import React from "react";
import Badge from "../../../components/ui/Badge";
import { STATUT_CONFIG } from "../constants";
import type { DomiciliationStatut } from "../types";

interface Props {
  statut: DomiciliationStatut | string;
  showIcon?: boolean;
  size?: "sm" | "md";
  labelType?: "short" | "full";
}

export default function StatutBadge({
  statut,
  showIcon = true,
  size = "md",
  labelType = "short",
}: Props) {
  const cfg = STATUT_CONFIG[statut as DomiciliationStatut];
  if (!cfg) {
    return (
      <Badge variant="neutral" size={size}>
        {statut}
      </Badge>
    );
  }
  const Icon = cfg.icon;
  const label = labelType === "full" ? cfg.label : cfg.shortLabel;
  return (
    <Badge variant={cfg.variant} size={size}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {label}
    </Badge>
  );
}
