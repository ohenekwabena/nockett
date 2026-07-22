import { describe, expect, it } from "vitest";
import type ExcelJS from "exceljs";
import { buildRotaWorkbook } from "./schedule-export";
import { defaultRotaSeed, generateMonthSchedule } from "./schedule-service";

function fillColor(cell: ExcelJS.Cell): string | undefined {
  const fill = cell.fill as ExcelJS.FillPattern | undefined;
  return fill && fill.type === "pattern" ? fill.fgColor?.argb : undefined;
}

describe("buildRotaWorkbook", () => {
  const schedule = generateMonthSchedule(2026, 7, defaultRotaSeed(2026, 7));
  const workbook = buildRotaWorkbook({ year: 2026, month: 7, weeks: schedule.weeks, days: schedule.days });
  const sheet = workbook.getWorksheet("July 2026")!;

  it("titles the sheet like the published roster", () => {
    expect(sheet).toBeDefined();
    expect(sheet.getCell(2, 1).value).toBe("July, 2026");
    expect(sheet.getCell(2, 1).font?.bold).toBe(true);
  });

  it("puts ordinal dates over the day columns, leaving pre-month slots blank", () => {
    // Week 1: July 2026 starts on Wednesday → Mon/Tue empty, Wed = "1st July"
    expect(sheet.getCell(4, 4).value).toBeNull();
    expect(sheet.getCell(4, 5).value).toBeNull();
    expect(sheet.getCell(4, 6).value).toBe("1st July");
    expect(sheet.getCell(4, 10).value).toBe("5th July");

    // Week 5 block (4 blocks later, 6 rows each) runs 27th July → 2nd August
    expect(sheet.getCell(28, 4).value).toBe("27th July");
    expect(sheet.getCell(28, 10).value).toBe("2nd August");
  });

  it("paints the navy weekday band across the block and names only active days", () => {
    for (let col = 1; col <= 10; col++) {
      expect(fillColor(sheet.getCell(5, col))).toBe("FF1F3864");
    }
    expect(sheet.getCell(5, 4).value).toBeNull(); // Monday slot before the 1st
    expect(sheet.getCell(5, 6).value).toBe("WEDNESDAY");
    expect(sheet.getCell(5, 10).value).toBe("SUNDAY");
    expect(sheet.getCell(29, 4).value).toBe("MONDAY"); // full week 5
  });

  it("labels each block with WEEK n, DAY and NIGHT chips, and shift times", () => {
    expect(sheet.getCell(6, 1).value).toBe("WEEK 1");
    expect(sheet.getCell(30, 1).value).toBe("WEEK 5");

    expect(sheet.getCell(6, 2).value).toBe("DAY");
    expect(fillColor(sheet.getCell(6, 2))).toBe("FF305496");
    expect(sheet.getCell(6, 3).value).toBe("7am - 7pm");

    expect(sheet.getCell(7, 2).value).toBe("NIGHT");
    expect(fillColor(sheet.getCell(7, 2))).toBe("FF111111");
    expect(sheet.getCell(7, 3).value).toBe("7pm - 7am");
  });

  it("writes the assigned names joined with slashes", () => {
    const firstDay = schedule.days[0]; // 1st July → row 6/7, column 6
    expect(sheet.getCell(6, 6).value).toBe(firstDay.dayShift.join(" / "));
    expect(sheet.getCell(7, 6).value).toBe(firstDay.nightShift.join(" / "));
    expect(sheet.getCell(6, 4).value).toBeNull(); // no shift before the month starts
  });
});
