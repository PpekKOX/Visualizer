export function fromHtml(markup: string): HTMLElement {
	const template = document.createElement("template");
	template.innerHTML = markup.trim();
	
	return template.content.firstElementChild as HTMLElement;
}

export function escapeHtml(value: string): string {
	return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

export function slot<T extends HTMLElement = HTMLElement>(root: HTMLElement, name: string): T {
	const element = root.querySelector<T>(`[data-slot="${name}"]`);
	if (!element) throw new Error(`Missing slot "${name}"`);
	
	return element;
}
