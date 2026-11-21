import hljs from "highlight.js/lib/core";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import python from "highlight.js/lib/languages/python";
import "highlight.js/styles/github-dark.css";
import type { AlgorithmDetails, LanguageId } from "@visualizer/shared";
import { fromHtml, slot } from "../dom";
import { LANGUAGE_LABELS } from "../languages";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("java", java);

export function codeLinesHtml(lines: string[], language: LanguageId): string {
	return lines
		.map((line, index) => {
			const highlighted = hljs.highlight(line, { language, ignoreIllegals: true }).value;
			return `<div class="code-line"><span class="w-10 shrink-0 pr-4 text-right text-slate-600 select-none">${index + 1}</span><span class="whitespace-pre">${highlighted || " "}</span></div>`;
		})
		.join("");
}

export function markActiveLines(lines: HTMLElement[], active: number[] = []): void {
	lines.forEach((line, index) => line.classList.toggle("is-active", active.includes(index + 1)));
}

export class CodePanel {
	readonly element: HTMLElement;
	private readonly tabs: HTMLElement;
	private readonly body: HTMLElement;
	private lines: HTMLElement[] = [];
	private stepKey = "";

	constructor(
		private readonly code: AlgorithmDetails["code"],
		private language: LanguageId,
		private readonly onLanguageChange: (language: LanguageId) => void,
	) {
		this.element = fromHtml(`
			<section class="card min-w-0 overflow-hidden">
				<div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-4 py-2">
					<h2 class="text-sm font-semibold text-white">Code</h2>
					<div class="flex gap-1" role="tablist" aria-label="Programming language" data-slot="tabs"></div>
				</div>
				<div class="overflow-x-auto py-3 font-mono text-sm leading-6">
					<div class="w-max min-w-full" data-slot="body"></div>
				</div>
			</section>`);
		this.tabs = slot(this.element, "tabs");
		this.body = slot(this.element, "body");

		this.tabs.addEventListener("click", (event) => {
			const tab = (event.target as Element).closest<HTMLElement>("[data-language]");
			if (tab) this.selectLanguage(tab.dataset.language as LanguageId);
		});

		this.render();
	}

	highlight(stepKey: string): void {
		this.stepKey = stepKey;
		markActiveLines(this.lines, this.code[this.language]?.steps[stepKey]);
	}

	private selectLanguage(language: LanguageId): void {
		if (language === this.language) return;

		this.language = language;
		this.render();
		this.onLanguageChange(language);
	}

	private render(): void {
		const languages = Object.keys(this.code) as LanguageId[];
		
		this.tabs.innerHTML = languages
			.map((language) => {
				const selected = language === this.language;
				const style = selected ? "bg-sky-500/15 text-sky-300" : "text-slate-400 hover:bg-slate-800 hover:text-white";
				return `<button type="button" role="tab" aria-selected="${selected}" data-language="${language}" class="rounded-md px-3 py-1.5 text-sm font-medium ${style}">${LANGUAGE_LABELS[language]}</button>`;
			})
			.join("");

		this.body.innerHTML = codeLinesHtml(this.code[this.language]?.lines ?? [], this.language);
		this.lines = [...this.body.children] as HTMLElement[];
		this.highlight(this.stepKey);
	}
}
