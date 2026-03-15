import React from "react";
import Badge from "../../../components/ui/Badge";
import { STATUT_CONFIG } from "../constants";
import type { DomiciliationStatut } from "../types";

interface Props {
  statut: DomiciliationStatut | string;
  showIcon?: boolean;
  size?: "sm" | "md";
}

export default function StatutBadge({ statut, showIcon = true, size = "md" }: Props) {
  const cfg = STATUT_CONFIG[statut as DomiciliationStatut];
  if (!cfg) {
    return <Badge variant="default" size={size}>{statut}</Badge>;
  }
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant} size={size}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {cfg.shortLabel}
    </Badge>
  );
}
