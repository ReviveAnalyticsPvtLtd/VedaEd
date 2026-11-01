const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const { createCanvas } = require("@napi-rs/canvas");

const Timetable = require("./timeTableSchema");
const Class = require("../class/classSchema");
const Section = require("../section/sectionSchema");

const DAY_NAMES = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};

const dayName = (value) => {
  if (!value) return null;
  const str = String(value).trim();
  if (DAY_NAMES[str.toUpperCase()]) return DAY_NAMES[str.toUpperCase()];
  return (
    Object.values(DAY_NAMES).find(
      (name) => name.toLowerCase() === str.toLowerCase()
    ) || null
  );
};

const periodLabel = (period) =>
  period.name || period.periodId || (period.type === "LUNCH" ? "Lunch" : "");

const periodTime = (period) =>
  `${period.startTime || ""} - ${period.endTime || ""}`;

const textOf = (value) => (value == null ? "" : String(value));

const cellText = (entry) => {
  if (!entry) return "";
  const subject =
    entry.subject?.subjectName ||
    entry.subject?.name ||
    textOf(entry.subject);
  const teacher =
    entry.teacher?.personalInfo?.name ||
    entry.teacher?.name ||
    textOf(entry.teacher);
  const room = textOf(entry.roomNo).trim();

  return [subject, teacher, room].filter(Boolean).join(" | ");
};

const safeFileName = (value) =>
  String(value || "Timetable")
    .replace(/[^a-z0-9._-]+/gi, "_")
    .replace(/^_+|_+$/g, "") || "Timetable";

const buildTableModel = async ({ header }) => {
  const [cls, section, entries] = await Promise.all([
    Class.findById(header.class).select("name").lean(),
    Section.findById(header.section).select("name").lean(),
    Timetable.find({ timetableHeader: header._id })
      .populate({ path: "subject", select: "subjectName name" })
      .populate({ path: "teacher", select: "personalInfo.name name" })
      .lean(),
  ]);

  const configuredDays = (header.workingDays || [])
    .map((code) => ({ code, name: dayName(code) }))
    .filter((day) => day.name);

  let days = configuredDays;

  // A header with no configured days can still export the days that actually
  // have assignments, instead of producing an empty document.
  if (days.length === 0) {
    const seen = new Set();
    days = [];

    for (const entry of entries) {
      const name = dayName(entry.day);
      if (!name || seen.has(name)) continue;
      seen.add(name);
      days.push({ code: Object.keys(DAY_NAMES).find((code) => DAY_NAMES[code] === name), name });
    }
  }

  const entryBySlot = new Map(
    entries.map((entry) => [`${dayName(entry.day)}::${entry.periodId}`, entry])
  );

  const periods = [...(header.periods || [])].sort((left, right) =>
    String(left.startTime || "").localeCompare(String(right.startTime || ""))
  );

  const rows = periods.map((period) => {
    const isLunch = period.type === "LUNCH";

    return {
      period: periodLabel(period),
      time: periodTime(period),
      isLunch,
      cells: days.map((day) => {
        if (isLunch) return "LUNCH";
        return cellText(entryBySlot.get(`${day.name}::${period.periodId}`));
      }),
    };
  });

  return {
    title: `${cls?.name || "Class"} - Section ${section?.name || ""}`.trim(),
    subtitle: `Timetable${header.status ? ` • ${header.status}` : ""}`,
    days,
    rows,
    periods,
  };
};

const buildWorkbook = async (model) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "VedaSchool";
  workbook.created = new Date();
  workbook.title = model.title;

  const sheet = workbook.addWorksheet("Timetable", {
    views: [{ state: "frozen", xSplit: 2, ySplit: 3 }],
    pageSetup: {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      paperSize: 9,
    },
  });

  const totalColumns = 2 + model.days.length;

  sheet.mergeCells(1, 1, 1, totalColumns);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = model.title;
  titleCell.font = { bold: true, size: 15, color: { argb: "FF1F2937" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(1).height = 26;

  sheet.mergeCells(2, 1, 2, totalColumns);
  const subtitleCell = sheet.getCell(2, 1);
  subtitleCell.value = model.subtitle;
  subtitleCell.font = { size: 10, color: { argb: "FF6B7280" } };
  subtitleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(2).height = 18;

  const headerRow = sheet.getRow(3);
  headerRow.values = ["Period", "Time", ...model.days.map((day) => day.name)];
  headerRow.height = 24;

  const thinBorder = {
    top: { style: "thin", color: { argb: "FFD1D5DB" } },
    left: { style: "thin", color: { argb: "FFD1D5DB" } },
    bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
    right: { style: "thin", color: { argb: "FFD1D5DB" } },
  };

  headerRow.eachCell((cell) => {
    cell.font = { bold: true, size: 10, color: { argb: "FF111827" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF2F7" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = thinBorder;
  });

  model.rows.forEach((row, index) => {
    const excelRow = sheet.getRow(4 + index);
    excelRow.values = [row.period, row.time, ...row.cells];
    excelRow.height = 36;

    excelRow.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
      cell.font = {
        bold: columnNumber <= 2,
        size: 9,
        color: { argb: "FF1F2937" },
      };
      cell.alignment = {
        horizontal: columnNumber === 2 ? "center" : "left",
        vertical: "middle",
        wrapText: true,
      };
      cell.border = thinBorder;

      if (row.isLunch) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF7F7F7" },
        };
      }
    });
  });

  sheet.getColumn(1).width = 14;
  sheet.getColumn(2).width = 20;
  model.days.forEach((_, index) => {
    sheet.getColumn(3 + index).width = 28;
  });

  return Buffer.from(await workbook.xlsx.writeBuffer());
};

const buildPdf = (model) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 30,
      info: { Title: model.title, Author: "VedaSchool" },
    });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const margin = 30;
    const contentWidth = doc.page.width - margin * 2;
    const labelWidth = 65;
    const timeWidth = 92;
    const dayCount = Math.max(model.days.length, 1);
    const dayWidth = model.days.length
      ? (contentWidth - labelWidth - timeWidth) / dayCount
      : 0;

    const columns = [
      { width: labelWidth, header: "Period" },
      { width: timeWidth, header: "Time" },
      ...model.days.map((day) => ({ width: dayWidth, header: day.name })),
    ];

    let y = margin;
    let pageNumber = 1;

    doc.fillColor("#111827").font("Helvetica-Bold").fontSize(16);
    doc.text(model.title, margin, y, { width: contentWidth });
    y = doc.y + 2;
    doc.fillColor("#6b7280").font("Helvetica").fontSize(9);
    doc.text(model.subtitle, margin, y, { width: contentWidth });
    y = doc.y + 12;

    const drawRow = (cells, { bold = false, fill = null, header = false } = {}) => {
      const font = bold ? "Helvetica-Bold" : "Helvetica";
      doc.font(font).fontSize(8);

      const heights = cells.map((cell, index) =>
        doc.heightOfString(textOf(cell) || " ", {
          width: Math.max(columns[index].width - 8, 20),
        })
      );
      const rowHeight = Math.max(header ? 24 : 28, Math.max(...heights) + 10);

      if (y + rowHeight > doc.page.height - margin) {
        doc.addPage();
        pageNumber += 1;
        y = margin;
        doc.fillColor("#6b7280").font("Helvetica").fontSize(8);
        doc.text(`${model.title} (continued)`, margin, y, { width: contentWidth });
        y += 16;
      }

      let x = margin;

      cells.forEach((cell, index) => {
        const width = columns[index].width;

        if (fill) {
          doc.save().fillColor(fill).rect(x, y, width, rowHeight).fill().restore();
        }

        doc
          .save()
          .strokeColor("#d1d5db")
          .lineWidth(0.6)
          .rect(x, y, width, rowHeight)
          .stroke()
          .restore();

        doc
          .fillColor("#1f2937")
          .font(font)
          .fontSize(8)
          .text(textOf(cell), x + 4, y + 5, {
            width: Math.max(width - 8, 20),
            height: rowHeight - 8,
            ellipsis: true,
          });

        x += width;
      });

      y += rowHeight;
    };

    drawRow(
      columns.map((column) => column.header),
      { bold: true, fill: "#eff2f7", header: true }
    );

    for (const row of model.rows) {
      drawRow([row.period, row.time, ...row.cells], {
        bold: false,
        fill: row.isLunch ? "#f7f7f7" : null,
      });
    }

    doc
      .fillColor("#9ca3af")
      .font("Helvetica")
      .fontSize(7)
      .text(
        `Generated by VedaSchool • Page ${pageNumber}`,
        margin,
        doc.page.height - 22,
        { width: contentWidth, align: "right" }
      );

    doc.end();
  });

const wrapLines = (ctx, value, maxWidth) => {
  const lines = [];
  const rawLines = textOf(value).split("\n");

  for (const rawLine of rawLines) {
    const words = rawLine.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }

    let current = "";

    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (ctx.measureText(next).width <= maxWidth || !current) {
        current = next;
      } else {
        lines.push(current);
        current = word;
      }
    }

    if (current) lines.push(current);
  }

  return lines;
};

const buildPng = async (model) => {
  const scale = 2;
  const padding = 28;
  const titleHeight = 74;
  const headerHeight = 46;
  const rowHeight = 76;
  const labelWidth = 112;
  const timeWidth = 150;
  const dayWidth = 230;
  const tableWidth = labelWidth + timeWidth + model.days.length * dayWidth;
  const width = Math.max(520, padding * 2 + tableWidth);
  const height =
    padding * 2 + titleHeight + headerHeight + model.rows.length * rowHeight;

  const canvas = createCanvas(width * scale, height * scale);
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#111827";
  ctx.font = "bold 24px sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText(model.title, padding, padding, width - padding * 2);

  ctx.fillStyle = "#6b7280";
  ctx.font = "13px sans-serif";
  ctx.fillText(model.subtitle, padding, padding + 32, width - padding * 2);

  const columns = [
    { width: labelWidth, header: "Period" },
    { width: timeWidth, header: "Time" },
    ...model.days.map((day) => ({ width: dayWidth, header: day.name })),
  ];

  let y = padding + titleHeight;

  const drawRow = (cells, { header = false, fill = null } = {}) => {
    let x = padding;

    cells.forEach((cell, index) => {
      const column = columns[index];

      if (fill) {
        ctx.fillStyle = fill;
        ctx.fillRect(x, y, column.width, header ? headerHeight : rowHeight);
      }

      ctx.strokeStyle = "#d1d5db";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, column.width, header ? headerHeight : rowHeight);

      ctx.fillStyle = "#1f2937";
      ctx.font = header ? "bold 13px sans-serif" : "12px sans-serif";
      ctx.textBaseline = "top";

      if (header) {
        ctx.fillText(cell, x + 9, y + 15, column.width - 18);
      } else {
        const lines = wrapLines(ctx, cell, column.width - 18).slice(0, 3);
        lines.forEach((line, lineIndex) => {
          ctx.fillText(line, x + 9, y + 12 + lineIndex * 18, column.width - 18);
        });
      }

      x += column.width;
    });

    y += header ? headerHeight : rowHeight;
  };

  drawRow(
    columns.map((column) => column.header),
    { header: true, fill: "#eff2f7" }
  );

  for (const row of model.rows) {
    drawRow([row.period, row.time, ...row.cells], {
      fill: row.isLunch ? "#f7f7f7" : "#ffffff",
    });
  }

  ctx.fillStyle = "#9ca3af";
  ctx.font = "10px sans-serif";
  ctx.fillText("Generated by VedaSchool", padding, height - padding + 4);

  return canvas.encode("png");
};

const buildTimetableExport = async ({ header, format }) => {
  const normalized = format === "excel" ? "xlsx" : format;
  const model = await buildTableModel({ header });
  const base = safeFileName(`VedaSchool_${model.title}_Timetable`);

  if (normalized === "xlsx") {
    return {
      buffer: await buildWorkbook(model),
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      filename: `${base}.xlsx`,
    };
  }

  if (normalized === "pdf") {
    return {
      buffer: await buildPdf(model),
      contentType: "application/pdf",
      filename: `${base}.pdf`,
    };
  }

  if (normalized === "png") {
    return {
      buffer: await buildPng(model),
      contentType: "image/png",
      filename: `${base}.png`,
    };
  }

  return null;
};

module.exports = {
  buildTimetableExport,
  EXPORT_FORMATS: ["xlsx", "pdf", "png"],
};
