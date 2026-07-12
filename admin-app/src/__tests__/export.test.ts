import { describe, expect, it } from "vitest";
import { buildCsv, csvCell } from "@/lib/export";

describe("csv exports", () => {
  it("guards formula-like cells", () => {
    expect(csvCell("=1+1")).toBe("'=1+1");
    expect(csvCell("@cmd")).toBe("'@cmd");
  });

  it("quotes comma cells", () => {
    expect(buildCsv(["Name"], [["Luban, UCC"]])).toBe('Name\r\n"Luban, UCC"');
  });
});
