import type { LanguageId } from "@visualizer/shared";
import type { VariableValue } from "./algorithms/types";
import { loadSetting, saveSetting } from "./storage";

const STORAGE_KEY = "visualizer.language";

export const LANGUAGE_LABELS: Record<LanguageId, string> = {
	javascript: "JavaScript",
	python: "Python",
	java: "Java",
};

function formatItem(value: number | string | boolean): string {
	return value === Infinity ? "∞" : String(value);
}

export function formatValue(value: VariableValue, language: LanguageId): string {
	if (Array.isArray(value)) return `[${value.map(formatItem).join(", ")}]`;
	if (typeof value === "object") return `{${Object.entries(value).map(([key, item]) => `${key}: ${formatItem(item)}`).join(", ")}}`;
	if (typeof value === "boolean" && language === "python") return value ? "True" : "False";

	return formatItem(value);
}

export function loadPreferredLanguage(available: LanguageId[]): LanguageId {
	const saved = loadSetting(STORAGE_KEY) as LanguageId | null;
	return saved && available.includes(saved) ? saved : available[0];
}

export function savePreferredLanguage(language: LanguageId): void {
	saveSetting(STORAGE_KEY, language);
}
