import * as XLSX from "xlsx";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export interface ExportColumn<T> {
  key: keyof T | string;
  label: string;
  format?: (value: unknown) => string;
}

function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
) {
  const headers = columns.map((col) => col.label);

  const rows = data.map((item) =>
    columns.map((col) => {
      const value = getNestedValue(item, col.key as string);

      if (col.format) {
        return col.format(value);
      }

      if (value instanceof Date) {
        return format(value, "dd/MM/yyyy HH:mm", { locale: fr });
      }

      return String(value ?? "");
    })
  );

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  downloadBlob(blob, `${filename}.csv`);
}

export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string,
  sheetName = "Data"
) {
  const headers = columns.map((col) => col.label);

  const rows = data.map((item) =>
    columns.map((col) => {
      const value = getNestedValue(item, col.key as string);

      if (col.format) {
        return col.format(value);
      }

      if (value instanceof Date) {
        return format(value, "dd/MM/yyyy HH:mm", { locale: fr });
      }

      return value ?? "";
    })
  );

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

function downloadBlob(blob: Blob, filename: string) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("fr-DZ", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value) + " DA";
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd MMMM yyyy", { locale: fr });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd/MM/yyyy 'à' HH:mm", { locale: fr });
}
