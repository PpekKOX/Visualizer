export interface LegendItem {
	label: string;
	color: string;
}

export function legendHtml(items: LegendItem[]): string {
	return `
		<ul class="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-slate-400">
			${items.map(({ label, color }) => `<li class="flex items-center gap-2"><span class="h-3 w-3 rounded-sm ${color}"></span>${label}</li>`).join("")}
		</ul>`;
}
