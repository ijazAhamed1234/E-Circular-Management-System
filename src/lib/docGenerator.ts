import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, Table, TableRow, TableCell,
  WidthType, ShadingType,
} from "docx";
import jsPDF from "jspdf";
import type { Circular } from "./types";
import { COLLEGE_NAME, COLLEGE_SHORT, COLLEGE_ADDRESS, COLLEGE_CONTACT, COLLEGE_AFFILIATION, USERS } from "./data";
import { fmtDate } from "./helpers";

// ── HTML → plain text ──────────────────────────────────────────────────────
export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ── HTML → docx Paragraphs ─────────────────────────────────────────────────
function parseInlineRuns(html: string): TextRun[] {
  const runs: TextRun[] = [];
  const parts = html.split(/(<strong>.*?<\/strong>|<b>.*?<\/b>|<em>.*?<\/em>|<i>.*?<\/i>|<u>.*?<\/u>)/s);
  for (const part of parts) {
    if (!part) continue;
    const isBold = /^<(strong|b)>/.test(part);
    const isItalic = /^<(em|i)>/.test(part);
    const isUnder = /^<u>/.test(part);
    const text = part.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
    if (!text) continue;
    runs.push(new TextRun({ text, bold: isBold, italics: isItalic, underline: isUnder ? {} : undefined, size: 22 }));
  }
  return runs.length ? runs : [new TextRun({ text: "", size: 22 })];
}

export function htmlToDocxParagraphs(html: string): Paragraph[] {
  const paras: Paragraph[] = [];
  const norm = html.replace(/<br\s*\/?>/gi, "</p><p>");
  const blocks = norm.match(/<(h[1-3]|p|li)[^>]*>([\s\S]*?)<\/(h[1-3]|p|li)>/gi) ?? [];

  for (const block of blocks) {
    const tagMatch = block.match(/^<(h[1-3]|p|li)/i);
    if (!tagMatch) continue;
    const tag = tagMatch[1].toLowerCase();
    const inner = block.replace(/^<[^>]+>/, "").replace(/<\/[^>]+>$/, "");
    const text = inner.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
    if (!text) {
      paras.push(new Paragraph({ children: [], spacing: { after: 80 } }));
      continue;
    }
    if (tag === "h1") {
      paras.push(new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text, bold: true, size: 28, color: "1a3567" })],
        spacing: { before: 200, after: 120 },
      }));
    } else if (tag === "h2") {
      paras.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text, bold: true, size: 24, color: "1a3567" })],
        spacing: { before: 160, after: 100 },
      }));
    } else if (tag === "li") {
      paras.push(new Paragraph({
        bullet: { level: 0 },
        children: parseInlineRuns(inner),
        spacing: { after: 60 },
      }));
    } else {
      let alignment: typeof AlignmentType[keyof typeof AlignmentType] = AlignmentType.JUSTIFIED;
      if (/text-align:\s*center/.test(block)) alignment = AlignmentType.CENTER;
      else if (/text-align:\s*right/.test(block)) alignment = AlignmentType.RIGHT;
      else if (/text-align:\s*left/.test(block)) alignment = AlignmentType.LEFT;
      paras.push(new Paragraph({
        alignment,
        children: parseInlineRuns(inner),
        spacing: { after: 100 },
      }));
    }
  }

  if (!paras.length) {
    const plain = stripHtml(html);
    for (const line of plain.split("\n")) {
      paras.push(new Paragraph({ children: [new TextRun({ text: line, size: 22 })], spacing: { after: 80 } }));
    }
  }

  return paras;
}

// ── Border helpers ─────────────────────────────────────────────────────────
const BORDER_THIN = { style: BorderStyle.SINGLE, size: 4, color: "aaaaaa" } as const;
const BORDER_NONE = { style: BorderStyle.NONE, size: 0, color: "ffffff" } as const;
const BORDER_THICK_NAVY = { style: BorderStyle.SINGLE, size: 12, color: "1a3567" } as const;

function allBordersThin() {
  return { top: BORDER_THIN, bottom: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN };
}
function allBordersNone() {
  return { top: BORDER_NONE, bottom: BORDER_NONE, left: BORDER_NONE, right: BORDER_NONE };
}

// ── Workflow approver slots per circular type ──────────────────────────────
type SigSlot = { label: string; signed: boolean; name: string; desig: string; dept: string; date: string };

function buildAllSigSlots(circular: Circular): SigSlot[] {
  const creator = USERS.find(u => u.id === circular.createdById);
  const slots: SigSlot[] = [];

  slots.push({
    label: "Prepared By",
    signed: true,
    name: circular.createdByName,
    desig: creator?.designation ?? "Faculty",
    dept: circular.department,
    date: fmtDate(circular.createdAt),
  });

  const ROLE_LABEL_MAP: Record<string, string> = {
    hod: "HOD", principal: "Principal",
    placement_director: "Placement Director", event_coordinator: "Event Coordinator",
  };
  const approverDefs: { role: string; label: string }[] = [];
  if (circular.approvalFlow && circular.approvalFlow.length > 0) {
    for (const role of circular.approvalFlow) {
      approverDefs.push({ role, label: ROLE_LABEL_MAP[role] ?? role });
    }
  } else if (circular.type === "placement") {
    approverDefs.push({ role: "placement_director", label: "Placement Director" });
    approverDefs.push({ role: "principal", label: "Principal" });
  } else if (circular.type === "inter_department" || circular.type === "event") {
    approverDefs.push({ role: "hod", label: "HOD" });
    approverDefs.push({ role: "event_coordinator", label: "Event Coordinator" });
  } else if (circular.type === "all_department" || circular.type === "examination") {
    approverDefs.push({ role: "principal", label: "Principal" });
  } else {
    approverDefs.push({ role: "hod", label: "HOD" });
    approverDefs.push({ role: "principal", label: "Principal" });
  }

  const sigByRole: Record<string, typeof circular.signatures[0]> = {};
  for (const sig of circular.signatures) {
    const u = USERS.find(u => u.id === sig.userId);
    if (u) sigByRole[u.role] = sig;
  }

  for (const { role, label } of approverDefs) {
    const sig = sigByRole[role];
    if (sig) {
      slots.push({
        label,
        signed: true,
        name: sig.userName,
        desig: sig.designation,
        dept: sig.department,
        date: fmtDate(sig.signedAt),
      });
    } else {
      slots.push({ label, signed: false, name: "", desig: "", dept: "", date: "" });
    }
  }

  return slots;
}

// ── Signature table (KIOT-style) ─────────────────────────────────────────
// Header row: role labels in shaded cells | Content row: name/desig with signature line
function buildSigTable(slots: SigSlot[]): Table {
  const count = slots.length;
  const pct = Math.floor(100 / count);

  // Header row — role labels (bold, shaded navy/light)
  const headerCells = slots.map(slot =>
    new TableCell({
      width: { size: pct, type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, fill: "1a3567" },
      borders: allBordersThin(),
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: slot.label.toUpperCase(), bold: true, size: 18, color: "ffffff" })],
      })],
    })
  );

  // Content row — signature area
  const contentCells = slots.map(slot =>
    new TableCell({
      width: { size: pct, type: WidthType.PERCENTAGE },
      borders: allBordersThin(),
      margins: { top: 120, bottom: 120, left: 120, right: 120 },
      children: [
        // Blank signature space
        new Paragraph({ children: [], spacing: { after: 200 } }),
        new Paragraph({ children: [], spacing: { after: 80 } }),
        // Name / desig line
        ...(slot.signed ? [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: slot.name, bold: true, size: 19, color: "0f1c3f" })],
            spacing: { after: 40 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: slot.desig, size: 17, color: "555555" })],
            spacing: { after: 40 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: slot.dept, size: 17, color: "555555" })],
            spacing: { after: 40 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: slot.date, size: 16, color: "888888" })],
            spacing: { after: 0 },
          }),
        ] : [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Name & Designation", size: 17, color: "bbbbbb" })],
            spacing: { after: 40 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Department", size: 17, color: "cccccc" })],
            spacing: { after: 0 },
          }),
        ]),
      ],
    })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: headerCells }),
      new TableRow({ children: contentCells }),
    ],
    borders: allBordersThin(),
  });
}

// ── Fields table (To / Subject / Circular issued by) ──────────────────────
function fieldsTable(rows: { label: string; value: string }[]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(({ label, value }) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            borders: allBordersThin(),
            margins: { top: 60, bottom: 60, left: 120, right: 60 },
            children: [new Paragraph({
              children: [new TextRun({ text: label, bold: true, size: 20 })],
            })],
          }),
          new TableCell({
            width: { size: 80, type: WidthType.PERCENTAGE },
            borders: allBordersThin(),
            margins: { top: 60, bottom: 60, left: 120, right: 120 },
            children: [new Paragraph({
              children: [new TextRun({ text: value, size: 20 })],
            })],
          }),
        ],
      })
    ),
    borders: allBordersThin(),
  });
}

// ── Footer verification table ──────────────────────────────────────────────
function footerVerifyTable(): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: allBordersThin(),
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "Checked by Principal office I/C", size: 18, color: "555555" })],
            })],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: allBordersThin(),
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "Verified by the sender", size: 18, color: "555555" })],
            })],
          }),
        ],
      }),
    ],
    borders: allBordersThin(),
  });
}

// ── Distribution table ────────────────────────────────────────────────────
// All KIOT departments that appear in the circular distribution row
export const DIST_DEPTS: { abbr: string; full: string }[] = [
  { abbr: "VP",    full: "Vice Principal" },
  { abbr: "MECH",  full: "Mechanical Engineering" },
  { abbr: "ECE",   full: "Electronics & Communication" },
  { abbr: "EEE",   full: "EEE" },
  { abbr: "CSE",   full: "Computer Science" },
  { abbr: "CIVIL", full: "Civil Engineering" },
  { abbr: "IT",    full: "Information Technology" },
  { abbr: "MBA",   full: "MBA" },
  { abbr: "IQAC",  full: "IQAC" },
  { abbr: "LIB",   full: "Library" },
  { abbr: "EMS",   full: "EMS" },
  { abbr: "FAT",   full: "FAT" },
  { abbr: "CDT",   full: "CDT" },
  { abbr: "AO",    full: "Administrative Officer" },
  { abbr: "Transport", full: "Transport" },
  { abbr: "Warden", full: "Warden" },
  { abbr: "Reception", full: "Reception" },
  { abbr: "Security", full: "Security Office" },
  { abbr: "Principal", full: "Principal" },
  { abbr: "Café",  full: "Cafeteria" },
];

// Map targetDepts → which abbr cells should be ticked
export function resolveCheckedDepts(circular: Circular): Set<string> {
  const checked = new Set<string>();
  const td = circular.targetDepts ?? [];
  const isAll = circular.type === "all_department" || td.length === 0;

  if (isAll) {
    // All departments distribution
    DIST_DEPTS.forEach(d => checked.add(d.abbr));
    return checked;
  }

  for (const dept of td) {
    if (dept.includes("Computer Science"))       { checked.add("CSE"); }
    if (dept.includes("Information Technology")) { checked.add("IT"); }
    if (dept.includes("Electronics"))            { checked.add("ECE"); }
    if (dept.includes("Mechanical"))             { checked.add("MECH"); }
    if (dept.includes("Civil"))                  { checked.add("CIVIL"); }
    if (dept.includes("Administration"))         { checked.add("AO"); checked.add("VP"); }
    if (dept.includes("Placement"))              { checked.add("CDT"); }
  }
  // Always include Principal for approval flow
  if (circular.approvalFlow?.includes("principal") || circular.type === "all_department") {
    checked.add("Principal");
  }
  return checked;
}

function distributionTable(circular: Circular): Table {
  const checked = resolveCheckedDepts(circular);
  const TICK = "✓";
  const EMPTY = "";

  // Build cells: each dept gets a narrow column with abbr on top row and tick/empty on bottom
  const labelCells = DIST_DEPTS.map(d =>
    new TableCell({
      borders: allBordersThin(),
      margins: { top: 40, bottom: 20, left: 40, right: 40 },
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: d.abbr, bold: true, size: 14, color: "1a3567" })],
      })],
    })
  );

  const tickCells = DIST_DEPTS.map(d =>
    new TableCell({
      borders: allBordersThin(),
      shading: checked.has(d.abbr) ? { type: ShadingType.CLEAR, fill: "e8f0fe" } : undefined,
      margins: { top: 20, bottom: 40, left: 40, right: 40 },
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({
          text: checked.has(d.abbr) ? TICK : EMPTY,
          bold: true, size: 16,
          color: checked.has(d.abbr) ? "1a3567" : "cccccc",
        })],
      })],
    })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: labelCells }),
      new TableRow({ children: tickCells }),
    ],
    borders: allBordersThin(),
  });
}

// ── DOCX download ──────────────────────────────────────────────────────────
export async function downloadDocx(circular: Circular): Promise<void> {
  const contentParas = circular.contentHtml
    ? htmlToDocxParagraphs(circular.contentHtml)
    : [new Paragraph({ children: [new TextRun({ text: circular.content, size: 22 })], spacing: { after: 100 } })];

  const allSlots = buildAllSigSlots(circular);

  // Determine circular type label
  const typeMap: Record<string, string> = {
    departmental: "Departmental Circular",
    inter_department: "Intra – Department Circular",
    all_department: "All Department Circular",
    placement: "Placement Circular",
    examination: "Examination Circular",
    event: "Event Circular",
  };
  const circularTypeLabel = typeMap[circular.type] ?? "Circular";

  // "Circular issued by" field
  const creator = USERS.find(u => u.id === circular.createdById);
  const issuedBy = `${circular.createdByName}${creator?.designation ? `, ${creator.designation}` : ""} – ${circular.department}`;

  // Distribution list
  const distDepts = circular.targetDepts.length > 0 ? circular.targetDepts : [circular.department];

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Times New Roman", size: 22 } },
      },
    },
    sections: [{
      properties: {
        page: { margin: { top: 720, bottom: 720, left: 1080, right: 1080 } },
      },
      children: [
        // ── Letterhead header table ──────────────────────────────────────
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                // Logo placeholder cell (left)
                new TableCell({
                  width: { size: 15, type: WidthType.PERCENTAGE },
                  borders: allBordersNone(),
                  verticalAlign: "center",
                  margins: { top: 60, bottom: 60, left: 0, right: 60 },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "KIOT", bold: true, size: 24, color: "1a3567" })],
                    }),
                  ],
                }),
                // College name (center)
                new TableCell({
                  width: { size: 70, type: WidthType.PERCENTAGE },
                  borders: allBordersNone(),
                  verticalAlign: "center",
                  margins: { top: 40, bottom: 40, left: 80, right: 80 },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: COLLEGE_NAME.toUpperCase(), bold: true, size: 28, color: "1a3567", font: "Times New Roman" })],
                      spacing: { after: 40 },
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "(An Autonomous Institution)", size: 20, color: "333333" })],
                      spacing: { after: 40 },
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: COLLEGE_AFFILIATION, size: 17, color: "555555" })],
                      spacing: { after: 40 },
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: `${COLLEGE_ADDRESS}    www.kiot.ac.in`, size: 17, color: "555555" })],
                      spacing: { after: 0 },
                    }),
                  ],
                }),
                // Department short label (right)
                new TableCell({
                  width: { size: 15, type: WidthType.PERCENTAGE },
                  borders: allBordersNone(),
                  verticalAlign: "center",
                  margins: { top: 40, bottom: 40, left: 60, right: 0 },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: circular.department.split(" ").map(w => w[0]).join("").toUpperCase(), bold: true, size: 22, color: "1a3567" })],
                    }),
                  ],
                }),
              ],
            }),
          ],
          borders: {
            bottom: BORDER_THICK_NAVY,
            top: BORDER_NONE, left: BORDER_NONE, right: BORDER_NONE,
            insideHorizontal: BORDER_NONE, insideVertical: BORDER_NONE,
          },
        }),

        // ── Circular type title ──────────────────────────────────────────
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: circularTypeLabel, bold: true, size: 24, color: "1a3567" })],
          spacing: { before: 120, after: 120 },
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 4, color: "1a3567" },
            top: { style: BorderStyle.SINGLE, size: 4, color: "1a3567" },
          },
        }),

        // ── Ref No + Date (two column table) ────────────────────────────
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: allBordersThin(),
                  margins: { top: 60, bottom: 60, left: 120, right: 60 },
                  children: [new Paragraph({
                    children: [
                      new TextRun({ text: `${COLLEGE_SHORT}/`, size: 20, color: "555555" }),
                      new TextRun({ text: `Circular No.: ${circular.refNo}`, bold: true, size: 20 }),
                    ],
                  })],
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: allBordersThin(),
                  margins: { top: 60, bottom: 60, left: 120, right: 120 },
                  children: [new Paragraph({
                    children: [
                      new TextRun({ text: "Date: ", size: 20, color: "555555" }),
                      new TextRun({ text: fmtDate(circular.createdAt), bold: true, size: 20 }),
                    ],
                  })],
                }),
              ],
            }),
          ],
          borders: allBordersThin(),
        }),

        // ── Fields table (To / Subject / Issued by) ──────────────────────
        fieldsTable([
          {
            label: "To",
            value: distDepts.map(d => `All Students & Faculty Members – ${d}`).join("; "),
          },
          { label: "Subject", value: circular.subject },
          { label: "Circular issued by", value: issuedBy },
        ]),

        // ── Body content ─────────────────────────────────────────────────
        new Paragraph({ children: [], spacing: { after: 60 } }),
        ...contentParas,
        new Paragraph({ children: [], spacing: { after: 120 } }),

        // ── Signature table ────────────────────────────────────────────
        buildSigTable(allSlots),

        // ── Department distribution table ─────────────────────────────
        new Paragraph({ children: [], spacing: { after: 80 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "DISTRIBUTION", bold: true, size: 18, color: "1a3567" })],
          spacing: { after: 60 },
        }),
        distributionTable(circular),

        // ── Footer verification row ────────────────────────────────────
        new Paragraph({ children: [], spacing: { after: 120 } }),
        footerVerifyTable(),

        // ── File distribution ──────────────────────────────────────────
        new Paragraph({ children: [], spacing: { after: 80 } }),
        new Paragraph({
          children: [new TextRun({ text: "File:", bold: true, size: 19 })],
          spacing: { after: 40 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "1)  Principal Office", size: 19 })],
          spacing: { after: 40 },
          indent: { left: 360 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "2)  Concerned Issuing Department", size: 19 })],
          spacing: { after: 0 },
          indent: { left: 360 },
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${circular.refNo.replace(/\//g, "-")}_${circular.title.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40)}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// ── PDF download ───────────────────────────────────────────────────────────
export function downloadPdf(circular: Circular): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210, ml = 18, mr = 18, textW = W - ml - mr;
  let y = 15;

  const navy = [26, 53, 103] as [number, number, number];
  const gray = [90, 100, 128] as [number, number, number];
  const black: [number, number, number] = [0, 0, 0];

  function setStyle(size: number, color: [number, number, number], bold = false) {
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.setFont("helvetica", bold ? "bold" : "normal");
  }

  function nl(n = 1) { y += n * 4.2; }
  function hRule(color: [number, number, number] = navy, thick = 0.5) {
    doc.setDrawColor(...color);
    doc.setLineWidth(thick);
    doc.line(ml, y, W - mr, y);
    y += 2.5;
  }
  function tableRowLine(cols: { text: string; x: number; w: number; bold?: boolean }[], rowH: number) {
    const x0 = ml, y0 = y;
    doc.setDrawColor(160, 160, 160);
    doc.setLineWidth(0.3);
    doc.rect(x0, y0, textW, rowH);
    let cx = x0;
    for (let i = 0; i < cols.length; i++) {
      const col = cols[i];
      if (i > 0) {
        doc.line(cx, y0, cx, y0 + rowH);
      }
      setStyle(8.5, black, col.bold);
      const lines = doc.splitTextToSize(col.text, col.w - 4);
      doc.text(lines, cx + 2, y0 + 4.5);
      cx += col.w;
    }
    y += rowH;
  }

  // ── Letterhead ──────────────────────────────────────────────────────────
  // KIOT box (left)
  setStyle(10, navy, true);
  doc.text("KIOT", ml, y + 6);

  // College name (center)
  setStyle(13, navy, true);
  doc.text(COLLEGE_NAME.toUpperCase(), W / 2, y, { align: "center" });
  y += 5.5;
  setStyle(8.5, [40, 40, 40], false);
  doc.text("(An Autonomous Institution)", W / 2, y, { align: "center" });
  y += 4.5;
  setStyle(7.5, gray, false);
  const affLines = doc.splitTextToSize(COLLEGE_AFFILIATION, textW - 30);
  doc.text(affLines, W / 2, y, { align: "center" });
  y += affLines.length * 3.8;
  doc.text(`${COLLEGE_ADDRESS}    www.kiot.ac.in`, W / 2, y, { align: "center" });
  y += 3;

  hRule(navy, 0.8);

  // ── Circular type title ─────────────────────────────────────────────────
  const typeMap: Record<string, string> = {
    departmental: "Departmental Circular",
    inter_department: "Intra - Department Circular",
    all_department: "All Department Circular",
    placement: "Placement Circular",
    examination: "Examination Circular",
    event: "Event Circular",
  };
  const typeLabel = typeMap[circular.type] ?? "Circular";
  setStyle(10.5, navy, true);
  doc.text(typeLabel, W / 2, y + 4.5, { align: "center" });
  doc.setDrawColor(...navy);
  doc.setLineWidth(0.4);
  doc.rect(ml, y, textW, 8);
  y += 9.5;

  // ── Ref No + Date row ───────────────────────────────────────────────────
  const halfW = textW / 2;
  tableRowLine([
    { text: `Circular No.: ${circular.refNo}`, x: ml, w: halfW },
    { text: `Date: ${fmtDate(circular.createdAt)}`, x: ml + halfW, w: halfW },
  ], 7);

  // ── Fields table ────────────────────────────────────────────────────────
  const creator = USERS.find(u => u.id === circular.createdById);
  const issuedBy = `${circular.createdByName}${creator?.designation ? `, ${creator.designation}` : ""}`;
  const toText = circular.targetDepts.map(d => `All Students & Faculty – ${d}`).join("; ");
  const toLines = doc.splitTextToSize(toText, textW - 36);
  const subLines = doc.splitTextToSize(circular.subject, textW - 36);
  const issuedLines = doc.splitTextToSize(issuedBy, textW - 36);

  const fieldRows = [
    { label: "To", lines: toLines },
    { label: "Subject", lines: subLines },
    { label: "Circular issued by", lines: issuedLines },
  ];
  for (const row of fieldRows) {
    const rh = Math.max(7, row.lines.length * 4.2 + 3);
    doc.setDrawColor(160, 160, 160);
    doc.setLineWidth(0.3);
    doc.rect(ml, y, textW, rh);
    doc.line(ml + 36, y, ml + 36, y + rh);
    setStyle(8.5, black, true);
    doc.text(row.label, ml + 2, y + 4.5);
    setStyle(8.5, black, false);
    doc.text(row.lines, ml + 38, y + 4.5);
    y += rh;
  }
  nl(1.5);

  // ── Body ────────────────────────────────────────────────────────────────
  const body = stripHtml(circular.contentHtml ?? "") || circular.content;
  const bodyLines = doc.splitTextToSize(body, textW);
  setStyle(9.5, [25, 30, 50], false);
  doc.setFont("helvetica", "normal");
  for (const bl of bodyLines) {
    if (y > 248) { doc.addPage(); y = 18; }
    doc.text(bl, ml, y);
    y += 5;
  }
  nl(2);

  // ── Signatures ──────────────────────────────────────────────────────────
  const pdfSlots = buildAllSigSlots(circular);
  const colW = textW / pdfSlots.length;
  const sigHeaderH = 7;
  const sigContentH = 28;
  if (y + sigHeaderH + sigContentH > 270) { doc.addPage(); y = 18; }

  // Header row (navy bg with white text)
  for (let j = 0; j < pdfSlots.length; j++) {
    const cx = ml + j * colW;
    doc.setFillColor(...navy);
    doc.rect(cx, y, colW, sigHeaderH, "F");
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.3);
    if (j > 0) doc.line(cx, y, cx, y + sigHeaderH);
    setStyle(7.5, [255, 255, 255] as [number, number, number], true);
    doc.text(pdfSlots[j].label.toUpperCase(), cx + colW / 2, y + 4.5, { align: "center" });
  }
  y += sigHeaderH;

  // Content row (signature area)
  doc.setDrawColor(160, 160, 160);
  doc.setLineWidth(0.3);
  doc.rect(ml, y, textW, sigContentH);
  for (let j = 1; j < pdfSlots.length; j++) {
    doc.line(ml + j * colW, y, ml + j * colW, y + sigContentH);
  }
  for (let j = 0; j < pdfSlots.length; j++) {
    const cx = ml + j * colW;
    const s = pdfSlots[j];
    if (s.signed) {
      setStyle(7.5, black, true);
      doc.text(s.name, cx + colW / 2, y + 14, { align: "center" });
      setStyle(7, gray, false);
      doc.text(s.desig, cx + colW / 2, y + 18, { align: "center" });
      if (s.dept) doc.text(s.dept, cx + colW / 2, y + 22, { align: "center" });
      setStyle(6.5, [160, 170, 190] as [number, number, number], false);
      doc.text(s.date, cx + colW / 2, y + 26, { align: "center" });
    } else {
      setStyle(7, [180, 180, 180] as [number, number, number], false);
      doc.text("Signature: _______________", cx + 3, y + 10);
      doc.text("Name & Designation", cx + 3, y + 16);
      setStyle(6.5, [200, 200, 200] as [number, number, number], false);
      doc.text("Pending", cx + 3, y + 22);
    }
  }
  y += sigContentH + 6;

  // ── Footer verification row ─────────────────────────────────────────────
  if (y + 10 > 270) { doc.addPage(); y = 18; }
  const halfTW = textW / 2;
  doc.setDrawColor(160, 160, 160);
  doc.setLineWidth(0.3);
  doc.rect(ml, y, textW, 8);
  doc.line(ml + halfTW, y, ml + halfTW, y + 8);
  setStyle(7.5, gray, false);
  doc.text("Checked by Principal office I/C", ml + halfTW / 2, y + 4.5, { align: "center" });
  doc.text("Verified by the sender", ml + halfTW + halfTW / 2, y + 4.5, { align: "center" });
  y += 10;

  // ── Department distribution table ───────────────────────────────────────
  const distChecked = resolveCheckedDepts(circular);
  const distCellW = textW / DIST_DEPTS.length;
  const distHeaderH = 6;
  const distTickH = 6;
  if (y + distHeaderH + distTickH + 14 > 270) { doc.addPage(); y = 18; }

  // "DISTRIBUTION" label
  setStyle(8, navy, true);
  doc.text("DISTRIBUTION", W / 2, y, { align: "center" });
  y += 4;

  // Label row
  for (let j = 0; j < DIST_DEPTS.length; j++) {
    const cx = ml + j * distCellW;
    doc.setDrawColor(160, 160, 160);
    doc.setLineWidth(0.2);
    doc.rect(cx, y, distCellW, distHeaderH);
    setStyle(5.5, [26, 53, 103] as [number, number, number], true);
    doc.text(DIST_DEPTS[j].abbr, cx + distCellW / 2, y + 4, { align: "center" });
  }
  y += distHeaderH;

  // Tick row
  for (let j = 0; j < DIST_DEPTS.length; j++) {
    const cx = ml + j * distCellW;
    const isChecked = distChecked.has(DIST_DEPTS[j].abbr);
    doc.setDrawColor(160, 160, 160);
    doc.setLineWidth(0.2);
    if (isChecked) {
      doc.setFillColor(232, 240, 254);
      doc.rect(cx, y, distCellW, distTickH, "FD");
    } else {
      doc.rect(cx, y, distCellW, distTickH);
    }
    if (isChecked) {
      setStyle(6, navy, true);
      doc.text("✓", cx + distCellW / 2, y + 4.2, { align: "center" });
    }
  }
  y += distTickH + 6;

  // ── File distribution ────────────────────────────────────────────────────
  setStyle(7.5, black, true);
  doc.text("File:", ml, y);
  setStyle(7.5, gray, false);
  doc.text("1)  Principal Office", ml + 8, y + 4.5);
  doc.text("2)  Concerned Issuing Department", ml + 8, y + 9);

  doc.save(`${circular.refNo.replace(/\//g, "-")}_${circular.title.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40)}.pdf`);
}
