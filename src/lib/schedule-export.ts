import ExcelJS from "exceljs";
import {
  dateOrdinalLabel,
  monthName,
  WEEKDAY_NAMES,
  type RotaWeek,
  type ScheduleDay,
} from "./schedule-service";

/**
 * Builds the duty-roster spreadsheet in the exact layout of the published
 * paper roster: a "July, 2026" title, then one block per week — a bold
 * ordinal date row, a navy weekday band, a merged "WEEK n" label, and
 * DAY (7am - 7pm) / NIGHT (7pm - 7am) rows with names joined by " / ".
 */

const NAVY = "FF1F3864";
const DAY_BLUE = "FF305496";
const NIGHT_BLACK = "FF111111";
const WHITE = "FFFFFFFF";

const WEEK_COL = 1; // "WEEK n"
const SHIFT_COL = 2; // DAY / NIGHT chip
const TIME_COL = 3; // 7am - 7pm / 7pm - 7am
const DAY_COL_START = 4; // Monday
const LAST_COL = DAY_COL_START + 6; // Sunday

function solidFill(argb: string): ExcelJS.FillPattern {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}

const CENTER: Partial<ExcelJS.Alignment> = { horizontal: "center", vertical: "middle" };

export interface RotaExportOptions {
  year: number;
  month: number;
  weeks: RotaWeek[];
  days: ScheduleDay[];
  filename?: string;
}

export function buildRotaWorkbook(options: RotaExportOptions): ExcelJS.Workbook {
  const { year, month, weeks, days } = options;
  const label = monthName(month);
  const byDate = new Map(days.map((day) => [day.date, day]));

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`${label} ${year}`, {
    views: [{ showGridLines: false }],
  });

  sheet.getColumn(WEEK_COL).width = 10;
  sheet.getColumn(SHIFT_COL).width = 9;
  sheet.getColumn(TIME_COL).width = 12;
  for (let i = 0; i < 7; i++) {
    sheet.getColumn(DAY_COL_START + i).width = 26;
  }

  sheet.mergeCells(2, WEEK_COL, 2, LAST_COL);
  const title = sheet.getCell(2, WEEK_COL);
  title.value = `${label}, ${year}`;
  title.font = { bold: true, size: 12 };
  title.alignment = CENTER;

  let row = 4;
  for (const week of weeks) {
    // Bold ordinal dates above each active day column
    week.dates.forEach((date, i) => {
      if (!date) return;
      const cell = sheet.getCell(row, DAY_COL_START + i);
      cell.value = dateOrdinalLabel(date);
      cell.font = { bold: true, size: 10 };
      cell.alignment = CENTER;
    });

    // Navy weekday band across the full block width
    const bandRow = row + 1;
    for (let col = WEEK_COL; col <= LAST_COL; col++) {
      sheet.getCell(bandRow, col).fill = solidFill(NAVY);
    }
    week.dates.forEach((date, i) => {
      if (!date) return;
      const cell = sheet.getCell(bandRow, DAY_COL_START + i);
      cell.value = WEEKDAY_NAMES[i];
      cell.font = { bold: true, size: 10, color: { argb: WHITE } };
      cell.alignment = CENTER;
    });
    sheet.getRow(bandRow).height = 17;

    // "WEEK n" spans the DAY and NIGHT rows
    sheet.mergeCells(bandRow + 1, WEEK_COL, bandRow + 2, WEEK_COL);
    const weekCell = sheet.getCell(bandRow + 1, WEEK_COL);
    weekCell.value = `WEEK ${week.week}`;
    weekCell.font = { bold: true, size: 10 };
    weekCell.alignment = CENTER;

    const shiftRows: Array<{
      rowNumber: number;
      label: string;
      fill: string;
      time: string;
      pick: (day: ScheduleDay) => string[];
    }> = [
      { rowNumber: bandRow + 1, label: "DAY", fill: DAY_BLUE, time: "7am - 7pm", pick: (day) => day.dayShift },
      { rowNumber: bandRow + 2, label: "NIGHT", fill: NIGHT_BLACK, time: "7pm - 7am", pick: (day) => day.nightShift },
    ];

    for (const shift of shiftRows) {
      const chip = sheet.getCell(shift.rowNumber, SHIFT_COL);
      chip.value = shift.label;
      chip.fill = solidFill(shift.fill);
      chip.font = { bold: true, size: 10, color: { argb: WHITE } };
      chip.alignment = CENTER;

      const time = sheet.getCell(shift.rowNumber, TIME_COL);
      time.value = shift.time;
      time.font = { bold: true, size: 10 };
      time.alignment = CENTER;

      week.dates.forEach((date, i) => {
        if (!date) return;
        const day = byDate.get(date);
        const names = day ? shift.pick(day) : [];
        const cell = sheet.getCell(shift.rowNumber, DAY_COL_START + i);
        cell.value = names.join(" / ");
        cell.font = { size: 10 };
        cell.alignment = CENTER;
      });
    }

    // Two blank rows between week blocks
    row = bandRow + 5;
  }

  return workbook;
}

export async function exportRotaToExcel(options: RotaExportOptions): Promise<void> {
  const workbook = buildRotaWorkbook(options);
  const filename =
    options.filename ?? `duty-roster-${monthName(options.month).toLowerCase()}-${options.year}.xlsx`;
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
