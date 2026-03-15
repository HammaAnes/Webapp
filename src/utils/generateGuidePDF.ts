import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { BlogArticle } from "../data/blogArticles";

const COLORS = {
  primary: [15, 118, 110] as [number, number, number],
  amber: [217, 119, 6] as [number, number, number],
  amberLight: [254, 243, 199] as [number, number, number],
  green: [21, 128, 61] as [number, number, number],
  greenLight: [220, 252, 231] as [number, number, number],
  red: [185, 28, 28] as [number, number, number],
  redLight: [254, 226, 226] as [number, number, number],
  blue: [29, 78, 216] as [number, number, number],
  blueLight: [219, 234, 254] as [number, number, number],
  gray900: [17, 24, 39] as [number, number, number],
  gray700: [55, 65, 81] as [number, number, number],
  gray500: [107, 114, 128] as [number, number, number],
  gray200: [229, 231, 235] as [number, number, number],
  gray100: [243, 244, 246] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 18;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function addPageHeader(doc: jsPDF, title: string, pageNum: number, totalPages: number) {
  doc.setFillColor(...COLORS.gray100);
  doc.rect(0, 0, PAGE_WIDTH, 12, "F");

  doc.setFontSize(8);
  doc.setTextColor(...COLORS.gray500);
  doc.setFont("helvetica", "normal");
  doc.text("COFFICE — Guide officiel", MARGIN, 8);
  doc.text(title, PAGE_WIDTH / 2, 8, { align: "center" });
  doc.text(`Page ${pageNum} / ${totalPages}`, PAGE_WIDTH - MARGIN, 8, { align: "right" });

  doc.setDrawColor(...COLORS.gray200);
  doc.setLineWidth(0.3);
  doc.line(0, 12, PAGE_WIDTH, 12);
}

function addPageFooter(doc: jsPDF, date: string) {
  const y = PAGE_HEIGHT - 10;
  doc.setDrawColor(...COLORS.gray200);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y - 3, PAGE_WIDTH - MARGIN, y - 3);

  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.gray500);
  doc.setFont("helvetica", "normal");
  doc.text("Coffice — Mohammadia Mall, 4ème étage, Bureau 1178, Alger", MARGIN, y + 1);
  doc.text(`Généré le ${date}`, PAGE_WIDTH - MARGIN, y + 1, { align: "right" });
}

function splitTextToLines(doc: jsPDF, text: string, maxWidth: number, fontSize: number): string[] {
  doc.setFontSize(fontSize);
  return doc.splitTextToSize(text, maxWidth);
}

function ensureSpace(doc: jsPDF, y: number, needed: number, title: string, date: string): number {
  if (y + needed > PAGE_HEIGHT - 20) {
    doc.addPage();
    addPageHeader(doc, title, (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages(), 0);
    addPageFooter(doc, date);
    return 22;
  }
  return y;
}

function renderCallout(
  doc: jsPDF,
  y: number,
  type: "conseil" | "attention" | "info",
  lines: string[],
  title: string,
  date: string
): number {
  const config = {
    conseil: { bg: COLORS.greenLight, border: COLORS.green, label: "CONSEIL", textColor: COLORS.green },
    attention: { bg: COLORS.redLight, border: COLORS.red, label: "ATTENTION", textColor: COLORS.red },
    info: { bg: COLORS.blueLight, border: COLORS.blue, label: "INFORMATION", textColor: COLORS.blue },
  }[type];

  const fullText = lines.join(" ");
  const textLines = splitTextToLines(doc, fullText, CONTENT_WIDTH - 14, 9);
  const boxHeight = 6 + textLines.length * 5.5 + 4;

  y = ensureSpace(doc, y, boxHeight + 4, title, date);

  doc.setFillColor(...config.bg);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, boxHeight, 2, 2, "F");
  doc.setDrawColor(...config.border);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, MARGIN, y + boxHeight);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...config.textColor);
  doc.text(config.label, MARGIN + 5, y + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.gray700);
  doc.setFontSize(9);
  textLines.forEach((line: string, i: number) => {
    doc.text(line, MARGIN + 5, y + 11 + i * 5.5);
  });

  return y + boxHeight + 4;
}

export function generateGuidePDF(article: BlogArticle): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const dateStr = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const shortTitle = article.title.length > 55 ? article.title.substring(0, 52) + "..." : article.title;

  doc.setProperties({
    title: article.title,
    author: "Coffice",
    subject: "Guide création d'entreprise en Algérie",
    creator: "Coffice — coffice.dz",
  });

  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, "F");

  doc.setFillColor(255, 255, 255, 0.05);
  for (let i = 0; i < 8; i++) {
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.3);
    doc.circle(PAGE_WIDTH - 20 + i * 5, 30 + i * 10, 30 + i * 8, "S");
  }

  const cofficeLogoY = 55;
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.white);
  doc.text("COFFICE", PAGE_WIDTH / 2, cofficeLogoY, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 230, 225);
  doc.text("Mohammadia Mall, 4ème étage, Bureau 1178, Alger", PAGE_WIDTH / 2, cofficeLogoY + 9, { align: "center" });

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.4);
  doc.line(MARGIN + 20, cofficeLogoY + 15, PAGE_WIDTH - MARGIN - 20, cofficeLogoY + 15);

  const titleLines = doc.splitTextToSize(article.title, CONTENT_WIDTH - 10);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.white);
  let titleY = cofficeLogoY + 32;
  titleLines.forEach((line: string) => {
    doc.text(line, PAGE_WIDTH / 2, titleY, { align: "center" });
    titleY += 12;
  });

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 230, 225);
  const excerptLines = doc.splitTextToSize(article.excerpt, CONTENT_WIDTH - 20);
  excerptLines.forEach((line: string, i: number) => {
    doc.text(line, PAGE_WIDTH / 2, titleY + 6 + i * 6.5, { align: "center" });
  });

  const metaY = PAGE_HEIGHT - 55;
  doc.setFillColor(0, 70, 60);
  doc.roundedRect(MARGIN, metaY, CONTENT_WIDTH, 35, 3, 3, "F");

  const metaItems = [
    { label: "Auteur", value: article.author },
    { label: "Publié le", value: new Date(article.publishedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) },
    { label: "Temps de lecture", value: `${article.readTime} minutes` },
    { label: "Généré le", value: dateStr },
  ];

  const colWidth = CONTENT_WIDTH / 4;
  metaItems.forEach((item, i) => {
    const x = MARGIN + i * colWidth + colWidth / 2;
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 200, 190);
    doc.text(item.label.toUpperCase(), x, metaY + 10, { align: "center" });
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.white);
    doc.text(item.value, x, metaY + 19, { align: "center" });
  });

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 200, 190);
  doc.text("Ce document a été généré automatiquement depuis le portail Coffice.", PAGE_WIDTH / 2, PAGE_HEIGHT - 8, { align: "center" });

  doc.addPage();

  const lines = article.content.split("\n");
  let y = 22;
  let inList = false;
  let listItems: string[] = [];
  let listType: "ul" | "ol" = "ul";
  let inTable = false;
  let tableRows: string[][] = [];
  let tableHeader: string[] = [];
  let currentCalloutType: "conseil" | "attention" | "info" | null = null;
  let calloutLines: string[] = [];
  let stepNumber = 0;

  const flushList = () => {
    if (listItems.length === 0) return;
    const itemsToRender = [...listItems];
    listItems = [];
    const isOrdered = listType === "ol";

    itemsToRender.forEach((item, idx) => {
      const bullet = isOrdered ? `${idx + 1}.` : "•";
      const cleanItem = item.replace(/\*\*(.*?)\*\*/g, "$1");
      const wrapped = splitTextToLines(doc, cleanItem, CONTENT_WIDTH - 14, 9.5);
      const needed = wrapped.length * 5.5 + 3;

      y = ensureSpace(doc, y, needed, shortTitle, dateStr);

      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.amber);
      doc.text(bullet, MARGIN + 3, y);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.gray700);
      wrapped.forEach((wl: string, wi: number) => {
        doc.text(wl, MARGIN + 10, y + wi * 5.5);
      });
      y += wrapped.length * 5.5 + 1.5;
    });
    y += 2;
  };

  const flushTable = () => {
    if (tableRows.length === 0) return;
    const header = tableHeader.length > 0 ? tableHeader : undefined;
    const body = [...tableRows];
    tableHeader = [];
    tableRows = [];
    inTable = false;

    y = ensureSpace(doc, y, 30, shortTitle, dateStr);

    autoTable(doc, {
      startY: y,
      head: header ? [header] : undefined,
      body,
      margin: { left: MARGIN, right: MARGIN },
      styles: {
        fontSize: 8.5,
        cellPadding: 3,
        textColor: COLORS.gray700,
        lineColor: COLORS.gray200,
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontStyle: "bold",
        fontSize: 8.5,
      },
      alternateRowStyles: {
        fillColor: COLORS.gray100,
      },
      didDrawPage: () => {
        const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
        addPageHeader(doc, shortTitle, pageCount, 0);
        addPageFooter(doc, dateStr);
      },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  };

  const flushCallout = () => {
    if (currentCalloutType && calloutLines.length > 0) {
      y = renderCallout(doc, y, currentCalloutType, calloutLines, shortTitle, dateStr);
    }
    currentCalloutType = null;
    calloutLines = [];
  };

  addPageHeader(doc, shortTitle, 2, 0);
  addPageFooter(doc, dateStr);

  lines.forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      flushTable();
      flushCallout();
      y += 1.5;
      return;
    }

    if (line.startsWith("> CONSEIL:") || line.startsWith("> ATTENTION:") || line.startsWith("> INFO:")) {
      flushList();
      flushTable();
      flushCallout();

      if (line.startsWith("> CONSEIL:")) {
        currentCalloutType = "conseil";
        const rest = line.replace("> CONSEIL:", "").trim();
        if (rest) calloutLines.push(rest);
      } else if (line.startsWith("> ATTENTION:")) {
        currentCalloutType = "attention";
        const rest = line.replace("> ATTENTION:", "").trim();
        if (rest) calloutLines.push(rest);
      } else if (line.startsWith("> INFO:")) {
        currentCalloutType = "info";
        const rest = line.replace("> INFO:", "").trim();
        if (rest) calloutLines.push(rest);
      }
      return;
    }

    if (currentCalloutType && !line.startsWith("##") && !line.startsWith("### ") && !line.startsWith("- ") && !/^\d+\./.test(line) && !line.startsWith("|")) {
      calloutLines.push(line);
      return;
    }

    flushCallout();

    if (line.startsWith("## ")) {
      flushList();
      flushTable();
      const heading = line.replace("## ", "").replace(/\*\*(.*?)\*\*/g, "$1");

      y = ensureSpace(doc, y, 20, shortTitle, dateStr);

      doc.setFillColor(...COLORS.primary);
      doc.rect(MARGIN, y, CONTENT_WIDTH, 10, "F");

      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.white);
      doc.text(heading, MARGIN + 5, y + 7);
      y += 16;
      return;
    }

    if (line.startsWith("### ")) {
      flushList();
      flushTable();
      const heading = line.replace("### ", "").replace(/\*\*(.*?)\*\*/g, "$1");

      const isStep = /^(Étape|Option|Étape \d+|Option [AB])/.test(heading);

      y = ensureSpace(doc, y, 16, shortTitle, dateStr);

      if (isStep && /^Étape \d+/.test(heading)) {
        stepNumber++;
        const stepMatch = heading.match(/^Étape (\d+)\s*:?\s*(.*)/);
        const stepNum = stepMatch ? stepMatch[1] : String(stepNumber);
        const stepTitle = stepMatch ? stepMatch[2].trim() : heading;

        const circleRadius = 5;
        const circleX = MARGIN + circleRadius;
        const circleY = y + 3;

        doc.setFillColor(...COLORS.amber);
        doc.circle(circleX, circleY, circleRadius, "F");

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLORS.white);
        doc.text(stepNum, circleX, circleY + 3.2, { align: "center" });

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLORS.gray900);
        doc.text(`Étape ${stepNum} : ${stepTitle}`, MARGIN + circleRadius * 2 + 3, y + 4.5);

        doc.setDrawColor(...COLORS.amber);
        doc.setLineWidth(0.5);
        doc.line(MARGIN, y + 9, PAGE_WIDTH - MARGIN, y + 9);
        y += 14;
      } else {
        doc.setFillColor(...COLORS.amberLight);
        doc.rect(MARGIN, y, 2.5, 8, "F");

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLORS.gray900);
        doc.text(heading, MARGIN + 5, y + 6);
        y += 12;
      }
      return;
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      flushTable();
      if (inList && listType !== "ul") flushList();
      inList = true;
      listType = "ul";
      listItems.push(line.replace(/^[-*] /, ""));
      return;
    }

    if (/^\d+\./.test(line)) {
      flushTable();
      if (inList && listType !== "ol") flushList();
      inList = true;
      listType = "ol";
      listItems.push(line.replace(/^\d+\.\s*/, ""));
      return;
    }

    if (line.startsWith("|")) {
      flushList();
      const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
      if (cells.every((c) => /^[-: ]+$/.test(c))) return;
      if (!inTable && tableHeader.length === 0) {
        tableHeader = cells;
        inTable = true;
      } else {
        tableRows.push(cells);
      }
      return;
    }

    flushList();
    flushTable();

    const cleanLine = line.replace(/\*\*(.*?)\*\*/g, "$1");
    const isBold = line.startsWith("**") && line.endsWith("**");
    const wrapped = splitTextToLines(doc, cleanLine, CONTENT_WIDTH, isBold ? 10 : 9.5);
    const needed = wrapped.length * 6 + 3;

    y = ensureSpace(doc, y, needed, shortTitle, dateStr);

    if (isBold) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.gray900);
    } else {
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.gray700);
    }

    wrapped.forEach((wl: string, wi: number) => {
      doc.text(wl, MARGIN, y + wi * 6);
    });
    y += wrapped.length * 6 + 2;
  });

  flushList();
  flushTable();
  flushCallout();

  const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    addPageHeader(doc, shortTitle, i, totalPages);
    addPageFooter(doc, dateStr);
  }

  const filename = `coffice-guide-${article.slug}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
