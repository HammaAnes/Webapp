export const ESPACE_TYPES = {
  BOX_4: "box_4",
  BOX_3: "box_3",
  OPEN_SPACE: "open_space",
  SALLE_REUNION: "salle_reunion",
  POSTE_INFORMATIQUE: "poste_informatique",
} as const;

export type EspaceType = (typeof ESPACE_TYPES)[keyof typeof ESPACE_TYPES];

export const ESPACE_TYPE_LABELS: Record<EspaceType, string> = {
  [ESPACE_TYPES.BOX_4]: "Box 4 places",
  [ESPACE_TYPES.BOX_3]: "Box 3 places",
  [ESPACE_TYPES.OPEN_SPACE]: "Open Space",
  [ESPACE_TYPES.SALLE_REUNION]: "Salle de Réunion",
  [ESPACE_TYPES.POSTE_INFORMATIQUE]: "Poste Informatique",
};

export const ESPACE_TYPE_COLORS: Record<EspaceType, string> = {
  [ESPACE_TYPES.BOX_4]: "bg-blue-100 text-blue-800",
  [ESPACE_TYPES.BOX_3]: "bg-cyan-100 text-cyan-800",
  [ESPACE_TYPES.OPEN_SPACE]: "bg-teal-100 text-teal-800",
  [ESPACE_TYPES.SALLE_REUNION]: "bg-green-100 text-green-800",
  [ESPACE_TYPES.POSTE_INFORMATIQUE]: "bg-amber-100 text-amber-800",
};

export const ESPACE_TYPE_OPTIONS = [
  { value: ESPACE_TYPES.BOX_4, label: ESPACE_TYPE_LABELS[ESPACE_TYPES.BOX_4] },
  { value: ESPACE_TYPES.BOX_3, label: ESPACE_TYPE_LABELS[ESPACE_TYPES.BOX_3] },
  {
    value: ESPACE_TYPES.OPEN_SPACE,
    label: ESPACE_TYPE_LABELS[ESPACE_TYPES.OPEN_SPACE],
  },
  {
    value: ESPACE_TYPES.SALLE_REUNION,
    label: ESPACE_TYPE_LABELS[ESPACE_TYPES.SALLE_REUNION],
  },
  {
    value: ESPACE_TYPES.POSTE_INFORMATIQUE,
    label: ESPACE_TYPE_LABELS[ESPACE_TYPES.POSTE_INFORMATIQUE],
  },
];

export const DEFAULT_ESPACE_TYPE: EspaceType = ESPACE_TYPES.OPEN_SPACE;

export function getEspaceTypeLabel(type: string): string {
  return ESPACE_TYPE_LABELS[type as EspaceType] || type;
}

export function getEspaceTypeColor(type: string): string {
  return ESPACE_TYPE_COLORS[type as EspaceType] || "bg-gray-100 text-gray-800";
}

export function isValidEspaceType(type: string): type is EspaceType {
  return Object.values(ESPACE_TYPES).includes(type as EspaceType);
}
