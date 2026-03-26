import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { BlogArticle } from "../data/blogArticles";

// ═══════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════
type RGB = [number, number, number];
const C = {
  teal:        [15,  118, 110] as RGB,
  tealDark:    [8,    80,  75] as RGB,
  tealMid:     [20,  100,  92] as RGB,
  tealGhost:   [22,  112, 104] as RGB,
  tealLight:   [204, 236, 232] as RGB,
  amber:       [217, 119,   6] as RGB,
  amberDk:     [180,  95,   2] as RGB,
  amberLight:  [254, 243, 199] as RGB,
  green:       [21,  128,  61] as RGB,
  greenLight:  [220, 252, 231] as RGB,
  greenDk:     [14,   92,  44] as RGB,
  orange:      [194,  65,  12] as RGB,
  orangeLight: [255, 237, 213] as RGB,
  blue:        [29,   78, 216] as RGB,
  blueLight:   [219, 234, 254] as RGB,
  charcoal:    [30,   35,  45] as RGB,
  ink:         [55,   65,  81] as RGB,
  gray:        [107, 114, 128] as RGB,
  pale:        [229, 231, 235] as RGB,
  ghost:       [248, 249, 251] as RGB,
  white:       [255, 255, 255] as RGB,
};

// ── Page layout constants ──────────────────────────────────────────────────
const PW = 210;
const PH = 297;
const MX = 17;           // left/right margin
const CW = PW - MX * 2; // 176mm content width
const LH = 6.2;          // body line height (mm)

// Footer
const FTR_H   = 12;
const FTR_Y   = PH - FTR_H; // 285

// Standard content pages (intro/summary)
const STD_HDR_H = 11;
const STD_CY    = STD_HDR_H + 12; // 23

// Step chapter openers
const CHAP_H  = 68;
const PROG_H  = 12;
const CHAP_CY = CHAP_H + PROG_H + 3; // 83

// Continuation pages for a step
const CONT_H  = 24;
const CONT_CY = CONT_H + 8; // 32

// Non-step ## section openers
const SEC_H   = 55;
const SEC_CY  = SEC_H + 10; // 65

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════
type Callout = "conseil" | "attention" | "info";

interface Block {
  type: "h3" | "paragraph" | "ul" | "ol" | "callout" | "table";
  text?: string;
  items?: string[];
  calloutType?: Callout;
  tableHeader?: string[];
  tableRows?: string[][];
}

interface Section {
  type: "step" | "chapter";
  stepNumber?: number;
  idx: number;       // sequential section index
  title: string;
  blocks: Block[];
}

interface RCtx {
  isStep: boolean;
  stepNum: number;
  stepTitle: string;
  runTitle: string;
  dateStr: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// PARSER
// ═══════════════════════════════════════════════════════════════════════════
function parseSections(content: string): Section[] {
  const secs: Section[] = [];
  let cur: Section | null = null;
  let pend: Block | null = null;
  let si = 0;

  const flush = () => { if (pend && cur) { cur.blocks.push(pend); pend = null; } };
  const flushSec = () => { flush(); if (cur) secs.push(cur); cur = null; };

  for (const raw of content.split("\n")) {
    const line = raw.trim();

    if (line.startsWith("## ")) {
      flushSec();
      si++;
      const title = strip(line.slice(3));
      const m = title.match(/^Étape\s+(\d+)\s*[:\-—]\s*(.*)/i);
      cur = m
        ? { type: "step", stepNumber: parseInt(m[1]), idx: si, title: strip(m[2]), blocks: [] }
        : { type: "chapter", idx: si, title, blocks: [] };
      continue;
    }
    if (!cur) continue;
    if (!line) { flush(); continue; }

    if (line.startsWith("### ")) {
      flush();
      cur.blocks.push({ type: "h3", text: strip(line.slice(4)) });
      continue;
    }

    const cm = line.match(/^> (CONSEIL|ATTENTION|INFO):(.*)/i);
    if (cm) {
      flush();
      const ct = cm[1].toUpperCase() === "CONSEIL" ? "conseil"
        : cm[1].toUpperCase() === "ATTENTION" ? "attention" : "info";
      pend = { type: "callout", calloutType: ct as Callout, items: cm[2].trim() ? [cm[2].trim()] : [] };
      continue;
    }
    if (pend?.type === "callout" && !line.startsWith("##") && !line.startsWith("- ")
        && !/^\d+\./.test(line) && !line.startsWith("|")) {
      pend.items!.push(line); continue;
    }
    if (pend?.type === "callout") flush();

    if (line.startsWith("- ") || line.startsWith("* ")) {
      if (pend?.type !== "ul") { flush(); pend = { type: "ul", items: [] }; }
      pend!.items!.push(line.replace(/^[-*]\s+/, "")); continue;
    }
    if (/^\d+\.\s/.test(line)) {
      if (pend?.type !== "ol") { flush(); pend = { type: "ol", items: [] }; }
      pend!.items!.push(line.replace(/^\d+\.\s+/, "")); continue;
    }
    if (line.startsWith("|")) {
      const cells = line.split("|").map(c => c.trim()).filter(Boolean);
      if (cells.every(c => /^[-: ]+$/.test(c))) continue;
      if (pend?.type !== "table") { flush(); pend = { type: "table", tableHeader: cells, tableRows: [] }; }
      else pend.tableRows!.push(cells);
      continue;
    }

    flush();
    cur.blocks.push({ type: "paragraph", text: strip(line) });
  }
  flushSec();
  return secs;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════
function pgCount(doc: jsPDF): number {
  return (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
}
function strip(t: string) { return t.replace(/\*\*(.*?)\*\*/g, "$1").trim(); }
function w(doc: jsPDF, text: string, maxW: number, sz: number): string[] {
  doc.setFontSize(sz); return doc.splitTextToSize(text, maxW);
}
// Estimate list item height (number of wrapped lines × LH + padding)
function itemH(doc: jsPDF, text: string, maxW: number, sz = 9.5): number {
  const ln = w(doc, strip(text), maxW, sz);
  return Math.max(ln.length * LH + 3, 10);
}
// Estimate height of a half-column for 2-col list
function colH(doc: jsPDF, items: string[], maxW: number, sz = 9.5): number {
  return items.reduce((s, it) => s + itemH(doc, it, maxW, sz), 0) + 4;
}

// ═══════════════════════════════════════════════════════════════════════════
// LOGO MARK
// ═══════════════════════════════════════════════════════════════════════════
function drawLogo(doc: jsPDF, x: number, y: number, dim = 9, onDark = true) {
  const fill = onDark ? C.amber : C.teal;
  const cClr = C.white;
  const wClr = onDark ? C.white : C.teal;
  doc.setFillColor(...fill);
  doc.roundedRect(x, y, dim, dim, 2, 2, "F");
  doc.setFontSize(dim * 1.42);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...cClr);
  doc.text("C", x + dim / 2, y + dim * 0.74, { align: "center" });
  doc.setFontSize(dim * 0.9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...wClr);
  doc.text("OFFICE", x + dim + 3, y + dim * 0.74);
}

// ═══════════════════════════════════════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════════════════════════════════════
function drawFooter(doc: jsPDF, pg: number, total: number, ds: string) {
  const y = FTR_Y;
  doc.setFillColor(...C.ghost);
  doc.rect(0, y, PW, FTR_H, "F");
  doc.setFillColor(...C.teal);
  doc.rect(0, y, PW, 0.4, "F");
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.gray);
  doc.text("coffice.dz · Mohammadia Mall, 4ème étage, Bureau 1178, Alger", MX, y + 8);
  if (pg > 0) {
    const lbl = total > 0 ? `${pg} / ${total}` : `${pg}`;
    doc.setFillColor(...C.teal);
    doc.roundedRect(PW / 2 - 11, y + 2, 22, 8, 2, 2, "F");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.white);
    doc.text(lbl, PW / 2, y + 7.5, { align: "center" });
  }
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.gray);
  doc.text(ds, PW - MX, y + 8, { align: "right" });
}

// ═══════════════════════════════════════════════════════════════════════════
// STANDARD HEADER (normal content pages)
// ═══════════════════════════════════════════════════════════════════════════
function drawStdHdr(doc: jsPDF, runTitle: string) {
  doc.setFillColor(...C.ghost);
  doc.rect(0, 0, PW, STD_HDR_H, "F");
  doc.setFillColor(...C.teal);
  doc.rect(0, STD_HDR_H - 0.4, PW, 0.4, "F");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.teal);
  doc.text("COFFICE", MX, 8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.gray);
  const rt = runTitle.length > 60 ? runTitle.substring(0, 57) + "…" : runTitle;
  doc.text(rt, PW / 2, 8, { align: "center" });
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP CHAPTER HEADER
// ═══════════════════════════════════════════════════════════════════════════
function drawChapHdr(doc: jsPDF, stepNum: number, total: number, title: string) {
  // Background
  doc.setFillColor(...C.tealDark);
  doc.rect(0, 0, PW, CHAP_H, "F");
  // Amber accent stripe
  doc.setFillColor(...C.amber);
  doc.rect(0, 0, 6, CHAP_H, "F");
  // Decorative circles
  doc.setDrawColor(...C.tealGhost);
  doc.setLineWidth(0.18);
  doc.circle(PW - 14, -20, 70, "S");
  doc.circle(PW + 6,  36,  44, "S");
  doc.circle(-8,  CHAP_H + 8, 48, "S");
  // Ghost step number (watermark)
  doc.setFontSize(98);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.tealGhost);
  doc.text(String(stepNum).padStart(2, "0"), PW + 3, CHAP_H - 1, { align: "right" });
  // Logo — top right
  drawLogo(doc, PW - MX - 30, 10, 9, true);
  // "ÉTAPE" label
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(160, 210, 204);
  doc.text("ÉTAPE", MX + 8, 19);
  // Number + total
  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.white);
  doc.text(String(stepNum), MX + 8, 37);
  const nw = doc.getStringUnitWidth(String(stepNum)) * 32 / doc.internal.scaleFactor;
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(160, 210, 204);
  doc.text(` / ${total}`, MX + 8 + nw + 1, 37);
  // Amber separator
  doc.setFillColor(...C.amber);
  doc.rect(MX + 8, 41, 46, 2.2, "F");
  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.white);
  const tLines = doc.splitTextToSize(title, CW - 38);
  tLines.slice(0, 2).forEach((l: string, i: number) => doc.text(l, MX + 8, 51 + i * 11));
  // Bottom amber rule
  doc.setFillColor(...C.amber);
  doc.rect(6, CHAP_H - 0.5, PW - 6, 0.5, "F");
}

// ═══════════════════════════════════════════════════════════════════════════
// PROGRESS DOTS
// ═══════════════════════════════════════════════════════════════════════════
function drawProgress(doc: jsPDF, stepNum: number, total: number) {
  const cy = CHAP_H + PROG_H / 2 + 1;
  const n = Math.min(total, 12);
  const gap = Math.min(10, (CW - 24) / n);
  const sx = PW / 2 - (n * gap) / 2;
  for (let i = 0; i < n; i++) {
    const cx = sx + i * gap + gap / 2;
    if (i < stepNum - 1) {
      doc.setFillColor(...C.amber); doc.circle(cx, cy, 2, "F");
    } else if (i === stepNum - 1) {
      doc.setFillColor(...C.teal); doc.circle(cx, cy, 2.8, "F");
      doc.setFillColor(...C.white); doc.circle(cx, cy, 1.1, "F");
    } else {
      doc.setDrawColor(...C.pale); doc.setLineWidth(0.5); doc.circle(cx, cy, 1.8, "S");
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTINUATION HEADER (overflow pages of a step)
// ═══════════════════════════════════════════════════════════════════════════
function drawContHdr(doc: jsPDF, stepNum: number, title: string) {
  doc.setFillColor(...C.tealDark);
  doc.rect(0, 0, PW, CONT_H, "F");
  doc.setFillColor(...C.amber);
  doc.rect(0, 0, 5, CONT_H, "F");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(160, 210, 204);
  doc.text(`ÉTAPE ${stepNum} — SUITE`, MX + 3, 9.5);
  doc.setFontSize(11.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.white);
  const t = title.length > 72 ? title.substring(0, 69) + "…" : title;
  doc.text(t, MX + 3, 20);
  doc.setFillColor(...C.amber);
  doc.rect(5, CONT_H - 0.5, PW - 5, 0.5, "F");
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION OPENER (non-step ## sections)
// ═══════════════════════════════════════════════════════════════════════════
function drawSecOpener(doc: jsPDF, title: string, idx: number) {
  doc.setFillColor(...C.tealDark);
  doc.rect(0, 0, PW, SEC_H, "F");
  doc.setFillColor(...C.amber);
  doc.rect(0, 0, 5, SEC_H, "F");
  doc.setDrawColor(...C.tealGhost);
  doc.setLineWidth(0.18);
  doc.circle(PW - 12, -14, 60, "S");
  doc.circle(-6, SEC_H + 8, 44, "S");
  doc.setFontSize(82);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.tealGhost);
  doc.text(String(idx).padStart(2, "0"), PW + 3, SEC_H - 1, { align: "right" });
  drawLogo(doc, PW - MX - 30, 10, 9, true);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(160, 210, 204);
  doc.text("SECTION", MX + 7, 18);
  doc.setFillColor(...C.amber);
  doc.rect(MX + 7, 21, 28, 2, "F");
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.white);
  doc.splitTextToSize(title, CW - 36).slice(0, 2).forEach((l: string, i: number) =>
    doc.text(l, MX + 7, 32 + i * 12));
  doc.setFillColor(...C.amber);
  doc.rect(5, SEC_H - 0.5, PW - 5, 0.5, "F");
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════
function newPage(doc: jsPDF, pg: number, ctx: RCtx): { y: number; pg: number } {
  doc.addPage(); pg++;
  if (ctx.isStep) {
    drawContHdr(doc, ctx.stepNum, ctx.stepTitle);
    drawFooter(doc, pg, 0, ctx.dateStr);
    return { y: CONT_CY, pg };
  }
  drawStdHdr(doc, ctx.runTitle);
  drawFooter(doc, pg, 0, ctx.dateStr);
  return { y: STD_CY, pg };
}

function guard(doc: jsPDF, need: number, y: number, pg: number, ctx: RCtx): { y: number; pg: number } {
  if (y + need <= FTR_Y - 6) return { y, pg };
  return newPage(doc, pg, ctx);
}

// ═══════════════════════════════════════════════════════════════════════════
// BLOCK RENDERERS
// ═══════════════════════════════════════════════════════════════════════════

// ─── PARAGRAPH ────────────────────────────────────────────────────────────
function rPara(doc: jsPDF, text: string, y: number, pg: number, ctx: RCtx) {
  const lines = w(doc, text, CW, 9.5);
  const r = guard(doc, lines.length * LH + 5, y, pg, ctx);
  y = r.y; pg = r.pg;
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.ink);
  lines.forEach((l, i) => doc.text(l, MX, y + i * LH));
  return { y: y + lines.length * LH + 5, pg };
}

// ─── H3 SUB-HEADING ───────────────────────────────────────────────────────
function rH3(doc: jsPDF, text: string, y: number, pg: number, ctx: RCtx) {
  const r = guard(doc, 16, y + 4, pg, ctx);   // +4 ensures page isn't JUST for heading
  y = r.y + 3; pg = r.pg;
  doc.setFillColor(...C.ghost);
  doc.rect(MX - 2, y - 1.5, CW + 4, 13, "F");
  doc.setFillColor(...C.amber);
  doc.rect(MX - 2, y - 1.5, 5, 13, "F");
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.charcoal);
  doc.text(text, MX + 7, y + 8);
  return { y: y + 16, pg };
}

// ─── CALLOUT CARD (colored header + light body) ───────────────────────────
function rCallout(doc: jsPDF, type: Callout, items: string[], y: number, pg: number, ctx: RCtx) {
  const cfg = {
    conseil:   { hBg: C.green,    bBg: C.greenLight,   border: C.green,   label: "CONSEIL",     icon: "✓" },
    attention: { hBg: C.orange,   bBg: C.orangeLight,  border: C.orange,  label: "ATTENTION",   icon: "!" },
    info:      { hBg: C.blue,     bBg: C.blueLight,    border: C.blue,    label: "INFORMATION", icon: "i" },
  }[type];

  const text = items.join(" ").replace(/\*\*(.*?)\*\*/g, "$1");
  const lines = w(doc, text, CW - 14, 9.5);
  const hdrH = 11;
  const bdyH = lines.length * LH + 10;
  const total = hdrH + bdyH;

  const r = guard(doc, total + 6, y, pg, ctx);
  y = r.y; pg = r.pg;

  // Full light body background (rounded)
  doc.setFillColor(...cfg.bBg);
  doc.roundedRect(MX, y, CW, total, 3, 3, "F");
  // Colored header overlay
  doc.setFillColor(...cfg.hBg);
  doc.roundedRect(MX, y, CW, hdrH, 3, 3, "F");
  doc.rect(MX, y + 3, CW, hdrH - 3, "F"); // square bottom corners of header
  // Border
  doc.setDrawColor(...cfg.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(MX, y, CW, total, 3, 3, "S");
  // Icon circle
  doc.setFillColor(...C.white);
  doc.circle(MX + 9, y + hdrH / 2, 3.8, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...cfg.hBg);
  doc.text(cfg.icon, MX + 9, y + hdrH / 2 + 2.5, { align: "center" });
  // Label
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.white);
  doc.text(cfg.label, MX + 17, y + 8);
  // Body text
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.ink);
  lines.forEach((l, i) => doc.text(l, MX + 7, y + hdrH + 7 + i * LH));

  return { y: y + total + 7, pg };
}

// ─── ORDERED LIST (single-column or auto 2-column) ────────────────────────
const OL_TWO_COL_MIN = 5; // use 2-col when ≥ this many items
const OL_GAP = 7;         // column gap

function renderOlItems(
  doc: jsPDF,
  items: string[],
  startIdx: number,   // global numbering offset
  ox: number,         // x origin of column
  colW: number,
  startY: number,
  maxY: number,       // don't go past this y
  drawConnector: boolean,
): number /* final y */ {
  let y = startY;
  for (let i = 0; i < items.length; i++) {
    const text = strip(items[i]);
    const lines = w(doc, text, colW - 14, 9.5);
    const ih = Math.max(lines.length * LH + 4, 11);
    if (y + ih > maxY) break; // safety

    const bCy = y + 4;   // badge center y
    const bR  = 3.8;

    // Connecting line to previous badge (all except first item)
    if (i > 0 && drawConnector) {
      doc.setDrawColor(...C.tealLight);
      doc.setLineWidth(0.6);
      doc.line(ox + 4.5, y - (ih - bR * 2 - 1), ox + 4.5, y + bCy - bR - 1);
    }

    // Badge circle
    doc.setFillColor(...C.teal);
    doc.circle(ox + 4.5, bCy, bR, "F");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.white);
    doc.text(String(startIdx + i + 1), ox + 4.5, bCy + 2.2, { align: "center" });

    // Item text
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.ink);
    lines.forEach((l, li) => doc.text(l, ox + 11.5, y + li * LH + 1.5));

    y += ih;
  }
  return y;
}

function rOrderedList(doc: jsPDF, items: string[], y: number, pg: number, ctx: RCtx) {
  if (items.length === 0) return { y, pg };
  const useTwoCol = items.length >= OL_TWO_COL_MIN;

  if (useTwoCol) {
    const colW = (CW - OL_GAP) / 2;
    const half = Math.ceil(items.length / 2);
    const col1 = items.slice(0, half);
    const col2 = items.slice(half);
    const h1 = colH(doc, col1, colW - 14);
    const h2 = colH(doc, col2, colW - 14);
    const needed = Math.max(h1, h2) + 4;

    // Page break if list doesn't fit
    if (y + needed > FTR_Y - 8) {
      const r = newPage(doc, pg, ctx);
      y = r.y; pg = r.pg;
    }

    const col1X = MX;
    const col2X = MX + colW + OL_GAP;
    const maxY = FTR_Y - 8;

    const y1 = renderOlItems(doc, col1, 0,    col1X, colW, y, maxY, true);
    const y2 = renderOlItems(doc, col2, half, col2X, colW, y, maxY, true);

    // Vertical divider between columns
    const divX = MX + colW + OL_GAP / 2;
    const yMax = Math.max(y1, y2);
    doc.setDrawColor(...C.pale);
    doc.setLineWidth(0.4);
    doc.line(divX, y - 2, divX, yMax);

    return { y: yMax + 5, pg };
  } else {
    // Single column
    let cy = y;
    for (let i = 0; i < items.length; i++) {
      const text = strip(items[i]);
      const lines = w(doc, text, CW - 14, 9.5);
      const ih = Math.max(lines.length * LH + 4, 11);
      const r = guard(doc, ih, cy, pg, ctx);
      cy = r.y; pg = r.pg;

      const bCy = cy + 4;
      const bR  = 3.8;

      // Connector from previous
      if (i > 0) {
        doc.setDrawColor(...C.tealLight);
        doc.setLineWidth(0.6);
        doc.line(MX + 4.5, cy - ih + bR * 2 + 2, MX + 4.5, bCy - bR);
      }

      doc.setFillColor(...C.teal);
      doc.circle(MX + 4.5, bCy, bR, "F");
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.white);
      doc.text(String(i + 1), MX + 4.5, bCy + 2.2, { align: "center" });

      doc.setFontSize(9.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.ink);
      lines.forEach((l, li) => doc.text(l, MX + 11.5, cy + li * LH + 1.5));
      cy += ih;
    }
    return { y: cy + 5, pg };
  }
}

// ─── BULLET / CHECKLIST (single-column or auto 2-column) ──────────────────
const UL_TWO_COL_MIN  = 6;  // use 2-col for bullet lists
const CHK_TWO_COL_MIN = 5;  // use 2-col for checklists

function rBulletList(
  doc: jsPDF, items: string[], y: number, pg: number, ctx: RCtx, isChk: boolean,
) {
  if (items.length === 0) return { y, pg };
  const twoColMin = isChk ? CHK_TWO_COL_MIN : UL_TWO_COL_MIN;
  const useTwoCol = items.length >= twoColMin;

  if (useTwoCol) {
    const colW = (CW - OL_GAP) / 2;
    const half = Math.ceil(items.length / 2);
    const col1 = items.slice(0, half);
    const col2 = items.slice(half);
    const h1 = colH(doc, col1, colW - 12);
    const h2 = colH(doc, col2, colW - 12);
    const needed = Math.max(h1, h2) + 4;

    if (y + needed > FTR_Y - 8) {
      const r = newPage(doc, pg, ctx);
      y = r.y; pg = r.pg;
    }

    const cols = [
      { items: col1, ox: MX },
      { items: col2, ox: MX + colW + OL_GAP },
    ];
    let maxY = y;
    cols.forEach(({ items: colItems, ox }) => {
      let cy = y;
      for (const raw of colItems) {
        const text = strip(raw);
        const lines = w(doc, text, colW - 12, 9.5);
        const ih = Math.max(lines.length * LH + 3, 9);
        if (cy + ih > FTR_Y - 8) break;

        if (isChk) {
          doc.setFillColor(...C.ghost);
          doc.roundedRect(ox, cy - 1, colW, ih + 1, 1.5, 1.5, "F");
          doc.setFillColor(...C.white);
          doc.setDrawColor(...C.teal);
          doc.setLineWidth(0.8);
          doc.roundedRect(ox + 2.5, cy + 0.5, 5, 5, 1, 1, "FD");
        } else {
          doc.setFillColor(...C.amber);
          doc.circle(ox + 3.5, cy + 2.2, 2, "F");
        }
        doc.setFontSize(9.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...C.ink);
        lines.forEach((l, li) => doc.text(l, ox + 11, cy + li * LH));
        cy += ih;
        maxY = Math.max(maxY, cy);
      }
    });
    return { y: maxY + 4, pg };
  } else {
    // Single column
    let cy = y;
    for (const raw of items) {
      const text = strip(raw);
      const lines = w(doc, text, CW - 12, 9.5);
      const ih = Math.max(lines.length * LH + 3, 10);
      const r = guard(doc, ih, cy, pg, ctx);
      cy = r.y; pg = r.pg;

      if (isChk) {
        doc.setFillColor(...C.ghost);
        doc.roundedRect(MX, cy - 1, CW, ih + 1, 1.5, 1.5, "F");
        doc.setFillColor(...C.white);
        doc.setDrawColor(...C.teal);
        doc.setLineWidth(0.8);
        doc.roundedRect(MX + 3, cy + 0.5, 5.5, 5.5, 1.2, 1.2, "FD");
        doc.setFontSize(9.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...C.ink);
        lines.forEach((l, li) => doc.text(l, MX + 12, cy + li * LH));
      } else {
        doc.setFillColor(...C.amber);
        doc.circle(MX + 3.5, cy + 2.2, 2, "F");
        doc.setFontSize(9.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...C.ink);
        lines.forEach((l, li) => doc.text(l, MX + 10, cy + li * LH));
      }
      cy += ih;
    }
    return { y: cy + 4, pg };
  }
}

// ─── TABLE ────────────────────────────────────────────────────────────────
function rTable(
  doc: jsPDF, header: string[], rows: string[][], y: number, pg: number,
  ctx: RCtx, dateStr: string,
) {
  const r = guard(doc, 32, y, pg, ctx);
  y = r.y; pg = r.pg;
  autoTable(doc, {
    startY: y,
    head: header.length ? [header] : undefined,
    body: rows,
    margin: { left: MX, right: MX },
    styles: { fontSize: 8.5, cellPadding: { top: 3.5, right: 4, bottom: 3.5, left: 4 }, textColor: C.ink, lineColor: C.pale, lineWidth: 0.2 },
    headStyles: { fillColor: C.teal, textColor: C.white, fontStyle: "bold" },
    alternateRowStyles: { fillColor: C.ghost },
    didDrawPage: () => {
      const p = pgCount(doc);
      if (ctx.isStep) drawContHdr(doc, ctx.stepNum, ctx.stepTitle);
      else drawStdHdr(doc, ctx.runTitle);
      drawFooter(doc, p, 0, dateStr);
      if (p > pg) pg = p;
    },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  return { y, pg };
}

// ═══════════════════════════════════════════════════════════════════════════
// COVER PAGE
// ═══════════════════════════════════════════════════════════════════════════
function renderCover(doc: jsPDF, article: BlogArticle, ds: string) {
  const topH = Math.round(PH * 0.63);

  doc.setFillColor(...C.tealDark);
  doc.rect(0, 0, PW, topH, "F");

  // Decorative circles
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.12);
  [[PW + 10, -12, 75], [PW - 10, 50, 44], [-16, topH - 20, 60], [30, 14, 22]].forEach(
    ([x, y2, r]) => doc.circle(x, y2, r, "S"),
  );
  doc.setLineWidth(0.06);
  for (let i = 0; i < 10; i++) doc.line(PW - 52 + i * 8, 0, PW + 4 + i * 8, 48);

  // Amber left accent
  doc.setFillColor(...C.amber);
  doc.rect(MX, 27, 4, 18, "F");

  // Large logo
  drawLogo(doc, MX + 8, 25, 15, true);

  // Category badge
  doc.setFillColor(...C.amber);
  doc.roundedRect(MX + 8, 52, 68, 8.5, 2, 2, "F");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.white);
  doc.text(article.category.toUpperCase(), MX + 8 + 34, 57.7, { align: "center" });

  // Title
  const tLines = doc.splitTextToSize(article.title, CW);
  let ty = 73;
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.white);
  tLines.forEach((l: string) => { doc.text(l, MX + 8, ty); ty += 12.5; });

  // Divider
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.3);
  doc.line(MX + 8, ty, MX + 8 + 78, ty);
  ty += 8;

  // Excerpt
  const exLines = doc.splitTextToSize(article.excerpt, CW - 10);
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(175, 220, 215);
  exLines.slice(0, 4).forEach((l: string) => { if (ty < topH - 28) { doc.text(l, MX + 8, ty); ty += 6.5; } });

  // Pills
  const pills = [`◷ ${article.readTime} min`, article.difficulty ? `◉ ${article.difficulty}` : null].filter(Boolean) as string[];
  let px = MX + 8;
  const pY = topH - 20;
  pills.forEach(pill => {
    const pw2 = doc.getStringUnitWidth(pill) * 8 / doc.internal.scaleFactor + 12;
    doc.setFillColor(...C.tealMid);
    doc.roundedRect(px, pY - 5, pw2, 9, 2, 2, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(175, 220, 215);
    doc.text(pill, px + pw2 / 2, pY + 0.5, { align: "center" });
    px += pw2 + 4;
  });

  // White bottom zone
  doc.setFillColor(...C.white);
  doc.rect(0, topH, PW, PH - topH, "F");
  doc.setFillColor(...C.teal);
  doc.rect(0, topH, 5, PH - topH - 20, "F");

  // "Dans ce guide"
  const botY = topH + 14;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.charcoal);
  doc.text("Dans ce guide", MX + 5, botY);
  doc.setDrawColor(...C.amber);
  doc.setLineWidth(2);
  doc.line(MX + 5, botY + 3, MX + 5 + 40, botY + 3);

  let preY = botY + 13;
  const prevSecs = article.content.split("\n").filter(l => l.startsWith("## ")).slice(0, 8)
    .map(l => strip(l.replace("## ", "")));
  doc.setFontSize(8.5);
  prevSecs.forEach(sec => {
    if (preY > PH - 26) return;
    doc.setFillColor(...C.amber);
    doc.circle(MX + 7.5, preY - 1.5, 2.2, "F");
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.ink);
    doc.text(sec.length > 72 ? sec.substring(0, 69) + "…" : sec, MX + 13, preY);
    preY += 8;
  });

  // Author strip
  const authY = PH - 22;
  doc.setFillColor(...C.ghost);
  doc.rect(0, authY, PW, 22, "F");
  doc.setFillColor(...C.pale);
  doc.rect(0, authY, PW, 0.3, "F");
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.charcoal);
  doc.text(article.author, MX + 4, authY + 9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.gray);
  doc.text(
    `Publié le ${new Date(article.publishedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}`,
    MX + 4, authY + 16,
  );
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.teal);
  doc.text("coffice.dz", PW - MX, authY + 9, { align: "right" });
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.gray);
  doc.text("Généré le " + ds, PW - MX, authY + 16, { align: "right" });
}

// ═══════════════════════════════════════════════════════════════════════════
// TOC PAGE (filled on second pass)
// ═══════════════════════════════════════════════════════════════════════════
function renderTOC(doc: jsPDF, secs: { title: string; pg: number }[], total: number, ds: string) {
  doc.setFillColor(...C.tealDark);
  doc.rect(0, 0, PW, 46, "F");
  doc.setFillColor(...C.amber);
  doc.rect(0, 0, 5, 46, "F");
  doc.setDrawColor(...C.tealGhost);
  doc.setLineWidth(0.15);
  doc.circle(PW - 6, -6, 56, "S");
  doc.circle(PW + 8, 34, 38, "S");

  drawLogo(doc, PW - MX - 30, 10, 9, true);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(160, 210, 204);
  doc.text("COFFICE — GUIDE OFFICIEL", MX + 7, 16);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.white);
  doc.text("Table des matières", MX + 7, 35);
  doc.setFillColor(...C.amber);
  doc.rect(MX + 7, 38.5, 48, 2, "F");

  let y = 56;
  secs.forEach((sec, i) => {
    if (y > FTR_Y - 14) return;
    if (i % 2 === 0) {
      doc.setFillColor(...C.ghost);
      doc.rect(MX - 1, y - 5, CW + 2, 11, "F");
    }
    doc.setFillColor(...C.teal);
    doc.circle(MX + 5.5, y - 0.5, 4.5, "F");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.white);
    doc.text(String(i + 1), MX + 5.5, y + 2.2, { align: "center" });

    const t = sec.title.length > 60 ? sec.title.substring(0, 57) + "…" : sec.title;
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.charcoal);
    doc.text(t, MX + 14, y + 1.5);

    doc.setFontSize(9);
    doc.setTextColor(...C.pale);
    const tw = doc.getStringUnitWidth(t) * 9.5 / doc.internal.scaleFactor;
    let dx = MX + 15 + tw + 2;
    while (dx < PW - MX - 18) { doc.text(".", dx, y + 1.5); dx += 3.5; }

    doc.setFillColor(...C.amber);
    doc.roundedRect(PW - MX - 14, y - 4.5, 14, 8.5, 2, 2, "F");
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.white);
    doc.text(String(sec.pg), PW - MX - 7, y + 1.5, { align: "center" });
    y += 12;
  });
  drawFooter(doc, 2, total, ds);
}

// ═══════════════════════════════════════════════════════════════════════════
// MARKETING PAGE
// ═══════════════════════════════════════════════════════════════════════════
function renderMarketing(doc: jsPDF, ds: string) {
  doc.setFillColor(...C.tealDark);
  doc.rect(0, 0, PW, 54, "F");
  doc.setFillColor(...C.amber);
  doc.rect(0, 0, 5, 54, "F");
  doc.setDrawColor(...C.tealGhost);
  doc.setLineWidth(0.15);
  for (let i = 0; i < 5; i++) doc.circle(PW - 6 + i * 8, 8 + i * 10, 28 + i * 5, "S");

  drawLogo(doc, PW / 2 - 40, 11, 16, true);
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(175, 220, 215);
  doc.text("Votre espace de travail professionnel à Alger", PW / 2, 36, { align: "center" });
  doc.setFillColor(...C.amber);
  doc.rect(MX + 28, 40, CW - 56, 2, "F");
  doc.setFontSize(12.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.white);
  doc.text("Lancez votre activité avec les bons outils", PW / 2, 50, { align: "center" });

  const svcs = [
    { title: "Domiciliation", desc: "Adresse légale reconnue, réception courrier, gestion administrative. Notaire partenaire sur place — Étapes 2 & 3 en un rendez-vous.", prix: "Dès 3 000 DA/mois", icon: "●" },
    { title: "Coworking",      desc: "Bureaux flexibles, Wi-Fi haut débit, café inclus, communauté d'entrepreneurs dynamique et inspirante à Alger.",                          prix: "Dès 2 500 DA/jour", icon: "◈" },
    { title: "Salle de réunion",desc:"Espaces équipés pour rendez-vous, présentations et formations professionnelles. Réservation à l'heure.",                                  prix: "Dès 3 500 DA/h",   icon: "◆" },
  ];
  const sY = 62, colW = (CW - 8) / 3;
  svcs.forEach((svc, i) => {
    const sx = MX + i * (colW + 4);
    doc.setFillColor(210, 210, 210); doc.roundedRect(sx + 1.5, sY + 1.5, colW, 72, 3, 3, "F");
    doc.setFillColor(...C.white);    doc.roundedRect(sx, sY, colW, 72, 3, 3, "F");
    doc.setFillColor(...C.teal);     doc.roundedRect(sx, sY, colW, 17, 3, 3, "F");
    doc.rect(sx, sY + 10, colW, 7, "F");
    doc.setFontSize(9.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.white);
    doc.text(`${svc.icon}  ${svc.title}`, sx + colW / 2, sY + 11, { align: "center" });
    const dl = w(doc, svc.desc, colW - 8, 7.5);
    doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.ink);
    dl.forEach((l, li) => doc.text(l, sx + 4, sY + 24 + li * 5.2));
    doc.setFillColor(...C.amber); doc.roundedRect(sx + 3, sY + 64, colW - 6, 6, 2, 2, "F");
    doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.white);
    doc.text(svc.prix, sx + colW / 2, sY + 68.5, { align: "center" });
  });

  const wY = sY + 80;
  doc.setFillColor(...C.amberLight); doc.roundedRect(MX, wY, CW, 34, 3, 3, "F");
  doc.setFillColor(...C.amber);      doc.roundedRect(MX, wY, 6, 34, 3, 3, "F");
  doc.rect(MX + 3, wY, 3, 34, "F");
  doc.setFontSize(10.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.charcoal);
  doc.text("Pourquoi choisir Coffice pour votre entreprise ?", MX + 10, wY + 10);
  ["✓  Adresse légale reconnue CNRC & ANAE — notaire partenaire sur place",
   "✓  Étapes 2 & 3 réalisables simultanément lors d'un seul rendez-vous",
   "✓  Espace de travail professionnel pour vous, vos clients et votre équipe",
  ].forEach((it, i) => {
    doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.ink);
    doc.text(it, MX + 10, wY + 19 + i * 6.5);
  });

  const ctaY = wY + 42;
  doc.setFillColor(...C.tealDark); doc.roundedRect(MX, ctaY, CW, 16, 3, 3, "F");
  doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.white);
  doc.text("coffice.dz", PW / 2, ctaY + 7.5, { align: "center" });
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(175, 220, 215);
  doc.text("📍 Mohammadia Mall, 4ème étage, Bureau 1178, Alger", PW / 2, ctaY + 13, { align: "center" });

  doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.gray);
  doc.text(`Guide généré le ${ds} — coffice.dz`, PW / 2, PH - 5, { align: "center" });
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════
export function generateGuidePDF(article: BlogArticle): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const ds = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const runTitle = article.title.length > 58 ? article.title.substring(0, 55) + "…" : article.title;

  doc.setProperties({
    title: article.title,
    author: "Coffice",
    subject: "Guide création d'entreprise en Algérie",
    creator: "Coffice — coffice.dz",
    keywords: article.tags.join(", "),
  });

  // ── PAGE 1: COVER ────────────────────────────────────────────────────────
  renderCover(doc, article, ds);

  // ── PAGE 2: TOC placeholder ──────────────────────────────────────────────
  doc.addPage();

  // ── PAGE 3+: CONTENT ────────────────────────────────────────────────────
  doc.addPage();

  const sections = parseSections(article.content);
  const totalSteps = sections.filter(s => s.type === "step").length;
  const tocEntries: { title: string; pg: number }[] = [];

  let pg = 3;
  let y = STD_CY;

  drawStdHdr(doc, runTitle);
  drawFooter(doc, pg, 0, ds);

  for (const sec of sections) {
    // Each ## forces a new page
    doc.addPage(); pg++;

    const ctx: RCtx = {
      isStep:    sec.type === "step",
      stepNum:   sec.stepNumber ?? 0,
      stepTitle: sec.title,
      runTitle,
      dateStr:   ds,
    };

    if (sec.type === "step") {
      drawChapHdr(doc, sec.stepNumber!, totalSteps, sec.title);
      drawProgress(doc, sec.stepNumber!, totalSteps);
      drawFooter(doc, pg, 0, ds);
      y = CHAP_CY;
      tocEntries.push({ title: `Étape ${sec.stepNumber} — ${sec.title}`, pg });
    } else {
      drawSecOpener(doc, sec.title, sec.idx);
      drawFooter(doc, pg, 0, ds);
      y = SEC_CY;
      tocEntries.push({ title: sec.title, pg });
    }

    let lastH3 = "";

    for (let bi = 0; bi < sec.blocks.length; bi++) {
      const block = sec.blocks[bi];

      // Orphan prevention: ensure H3 heading stays with its first following block
      if (block.type === "h3") {
        const nextBlock = sec.blocks[bi + 1];
        let combined = 16; // H3 height
        if (nextBlock) {
          if (nextBlock.type === "paragraph") {
            const ln = w(doc, nextBlock.text!, CW, 9.5);
            combined += ln.length * LH + 5;
          } else if (nextBlock.type === "ul" || nextBlock.type === "ol") {
            const n = nextBlock.items!.length;
            combined += Math.min(n, 3) * 10 + 4; // at least 3 items worth
          } else {
            combined += 22;
          }
        }
        if (y + combined > FTR_Y - 8) {
          const r = newPage(doc, pg, ctx);
          y = r.y; pg = r.pg;
        }
        const r = rH3(doc, block.text!, y, pg, ctx);
        y = r.y; pg = r.pg;
        lastH3 = block.text!.toLowerCase();
        continue;
      }

      const isChk = /documents?\s+(requis|nécessaires|à\s+fournir)|pièces?\s+(requises?|justificatives?)/i.test(lastH3);

      switch (block.type) {
        case "paragraph": { const r = rPara(doc, block.text!, y, pg, ctx); y = r.y; pg = r.pg; break; }
        case "ul":        { const r = rBulletList(doc, block.items!, y, pg, ctx, isChk); y = r.y; pg = r.pg; break; }
        case "ol":        { const r = rOrderedList(doc, block.items!, y, pg, ctx); y = r.y; pg = r.pg; break; }
        case "callout":   { const r = rCallout(doc, block.calloutType!, block.items!, y, pg, ctx); y = r.y; pg = r.pg; break; }
        case "table":     { const r = rTable(doc, block.tableHeader!, block.tableRows!, y, pg, ctx, ds); y = r.y; pg = r.pg; break; }
      }
    }
  }

  // ── LAST PAGE: MARKETING ─────────────────────────────────────────────────
  doc.addPage(); pg++;
  renderMarketing(doc, ds);

  // ── BACK-FILL TOC ────────────────────────────────────────────────────────
  const total = pgCount(doc);
  doc.setPage(2);
  renderTOC(doc, tocEntries, total, ds);

  // ── UPDATE FOOTERS with total page count ─────────────────────────────────
  for (let p = 3; p <= total - 1; p++) {
    doc.setPage(p);
    drawFooter(doc, p, total, ds);
  }

  doc.save(`coffice-guide-${article.slug}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
