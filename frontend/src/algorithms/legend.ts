export interface LegendItem {
	label: string;
	color: string;
	line?: boolean;
}

export function legendHtml(items: LegendItem[]): string {
	return `
		<ul class="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-slate-400">
			${items
				.map(({ label, color, line }) => `<li class="flex items-center gap-2"><span class="${line ? "h-0.5 w-4 rounded-full" : "h-3 w-3 rounded-sm"} ${color}"></span>${label}</li>`)
				.join("")}
		</ul>`;
}
