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

export const formatDate = (date: Date | string): string => {
  if (!date) return "";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return dateFormatter.format(d);
  } catch (e) {
    return "";
  }
};

export const formatTime = (date: Date | string): string => {
  if (!date) return "";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return timeFormatter.format(d);
  } catch (e) {
    return "";
  }
};

export const formatCurrency = (amount: number, currency = "DA"): string => {
  if (typeof amount !== "number" || isNaN(amount)) return "0 DA";
  const formatted = numberFormatter.format(amount);
  return `${formatted} ${currency}`;
};

export const formatPrice = (amount: number, showTTC = false): string => {
  if (typeof amount !== "number" || isNaN(amount)) return "0 DA";
  const formatted = numberFormatter.format(amount);
  return showTTC ? `${formatted} DA TTC` : `${formatted} DA`;
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("fr-FR").format(num);
};

export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

export const escapeCsvValue = (value: string): string => {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export const buildCsvContent = (headers: string[], rows: string[][]): string => {
  const escaped = rows.map((row) => row.map(escapeCsvValue).join(","));
  return [headers.map(escapeCsvValue).join(","), ...escaped].join("\n");
};
