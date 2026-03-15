const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
});

const numberFormatter = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function toDate(date: Date | string | null | undefined): Date | null {
  if (!date) return null;
  if (date instanceof Date) return isNaN(date.getTime()) ? null : date;
  const normalized = typeof date === "string" ? date.replace(" ", "T") : date;
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
}

export const formatDate = (date: Date | string | null | undefined): string => {
  const d = toDate(date);
  if (!d) return "";
  try {
    return dateFormatter.format(d);
  } catch {
    return "";
  }
};

export const formatTime = (date: Date | string | null | undefined): string => {
  const d = toDate(date);
  if (!d) return "";
  try {
    return timeFormatter.format(d);
  } catch {
    return "";
  }
};

export const formatDateTime = (date: Date | string | null | undefined): string => {
  const d = toDate(date);
  if (!d) return "";
  try {
    return `${dateFormatter.format(d)} à ${timeFormatter.format(d)}`;
  } catch {
    return "";
  }
};

export const formatCurrency = (amount: number | null | undefined, currency = "DA"): string => {
  if (amount == null || typeof amount !== "number" || isNaN(amount)) return "—";
  const formatted = numberFormatter.format(amount);
  return `${formatted} ${currency}`;
};

export const formatPrice = (amount: number | null | undefined, showTTC = false): string => {
  if (amount == null || typeof amount !== "number" || isNaN(amount)) return "—";
  const formatted = numberFormatter.format(amount);
  return showTTC ? `${formatted} DA TTC` : `${formatted} DA`;
};

export const formatNumber = (num: number): string => {
  if (isNaN(num)) return "0";
  return new Intl.NumberFormat("fr-FR").format(num);
};

export const getInitials = (firstName?: string | null, lastName?: string | null): string => {
  const first = (firstName || "").trim().charAt(0);
  const last = (lastName || "").trim().charAt(0);
  return (first + last).toUpperCase() || "?";
};

export const escapeCsvValue = (value: string | null | undefined): string => {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const buildCsvContent = (headers: string[], rows: string[][]): string => {
  const escaped = rows.map((row) => row.map(escapeCsvValue).join(","));
  return [headers.map(escapeCsvValue).join(","), ...escaped].join("\r\n");
};
