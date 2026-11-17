import type { LanguageId } from "@visualizer/shared";
import type { VariableValue } from "./algorithms/types";

const STORAGE_KEY = "visualizer.language";

export const LANGUAGE_LABELS: Record<LanguageId, string> = {
	javascript: "JavaScript",
	python: "Python",
	java: "Java",
};

export function formatValue(value: VariableValue, language: LanguageId): string {
	if (typeof value === "boolean" && language === "python") return value ? "True" : "False";
	return String(value);
}

export function loadPreferredLanguage(available: LanguageId[]): LanguageId {
	try {
		const saved = localStorage.getItem(STORAGE_KEY) as LanguageId | null;
		if (saved && available.includes(saved)) return saved;
	} catch {
		// Storage can be unavailable (private mode, blocked cookies).
	}
	
	return available[0];
}

export function savePreferredLanguage(language: LanguageId): void {
	try {
		localStorage.setItem(STORAGE_KEY, language);
	} catch {
		// Storage can be unavailable (private mode, blocked cookies).
	}
}
