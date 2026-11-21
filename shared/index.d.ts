export type LanguageId = "javascript" | "python" | "java";

export interface CodeSnippet {
	lines: string[];
	steps: Record<string, number[]>;
	identifiers?: Record<string, string>;
}

export interface Complexity {
	best: string;
	average: string;
	worst: string;
	space: string;
}

export interface AlgorithmProperty {
	label: string;
	value: string;
}

export interface AlgorithmSummary {
	slug: string;
	name: string;
	summary: string;
	complexity: Complexity;
}

export interface CategorySummary {
	slug: string;
	name: string;
	description: string;
	algorithms: AlgorithmSummary[];
}

export interface AlgorithmDetails extends AlgorithmSummary {
	category: { slug: string; name: string };
	description: string[];
	properties: AlgorithmProperty[];
	code: Partial<Record<LanguageId, CodeSnippet>>;
}
