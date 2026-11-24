import { describe, expect, it } from "vitest";
import { formatValue } from "./languages";

describe("formatValue", () => {
	it("formats lists and maps the same way in every language", () => {
		expect(formatValue([3, 1], "java")).toBe("[3, 1]");
		expect(formatValue(["A", "C"], "javascript")).toBe("[A, C]");
		expect(formatValue({ A: 0, B: 2 }, "python")).toBe("{A: 0, B: 2}");
	});

	it("writes infinity as ∞ in every language", () => {
		expect(formatValue(Infinity, "java")).toBe("∞");
		expect(formatValue({ A: 0, B: Infinity }, "python")).toBe("{A: 0, B: ∞}");
	});

	it("writes booleans the way the language does", () => {
		expect(formatValue(true, "javascript")).toBe("true");
		expect(formatValue(false, "python")).toBe("False");
	});
});
