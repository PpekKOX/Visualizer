import type { AlgorithmDetails, CategorySummary, LanguageId } from "@visualizer/shared";
import { algorithmHeaderHtml, algorithmTitle } from "./components/algorithmHeader";
import { algorithmInfoHtml } from "./components/algorithmInfo";
import { escapeHtml } from "./dom";
import { LANGUAGE_LABELS } from "./languages";

export interface StaticPage {
	path: string;
	title: string;
	description: string;
	body: string;
}

type Replacement = [RegExp, (match: string) => string];

function listOf(items: string[]): string {
	return items.length > 1 ? `${items.slice(0, -1).join(", ")} and ${items.at(-1)}` : items.join("");
}

export function staticAlgorithmPage(details: AlgorithmDetails, categories: CategorySummary[]): StaticPage {
	const languages = (Object.keys(details.code) as LanguageId[]).map((id) => LANGUAGE_LABELS[id]);

	return {
		path: `/${details.category.slug}/${details.slug}`,
		title: algorithmTitle(details.name),
		description: `${details.summary} Watch it run step by step in ${listOf(languages)}.`,
		body: `
			<div class="mx-auto max-w-6xl space-y-6 px-4 py-8">
				${algorithmHeaderHtml(details, categories)}
				${algorithmInfoHtml(details)}
			</div>`,
	};
}

function replaceOnce(html: string, [pattern, replace]: Replacement): string {
	if (!pattern.test(html)) throw new Error(`The page template has no match for ${pattern}`);

	return html.replace(pattern, replace);
}

export function renderPage(template: string, siteUrl: string, page: StaticPage): string {
	const url = `${siteUrl}${page.path}`;
	const title = escapeHtml(page.title);
	const description = escapeHtml(page.description);
	const replacements: Replacement[] = [
		[/<title>[^<]*<\/title>/, () => `<title>${title}</title>`],
		[/<meta name="description" content="[^"]*"/, () => `<meta name="description" content="${description}"`],
		[/<meta property="og:title" content="[^"]*"/, () => `<meta property="og:title" content="${title}"`],
		[/<meta property="og:description" content="[^"]*"/, () => `<meta property="og:description" content="${description}"`],
		[/<meta property="og:url" content="[^"]*"/, () => `<meta property="og:url" content="${url}"`],
		[/<link rel="canonical" href="[^"]*"/, () => `<link rel="canonical" href="${url}"`],
		[/<main id="outlet"[^>]*>/, (tag) => `${tag}${page.body}`],
	];

	return replacements.reduce(replaceOnce, template);
}

export function sitemapXml(siteUrl: string, paths: string[]): string {
	const urls = paths.map((path) => `\t<url><loc>${escapeHtml(siteUrl + path)}</loc></url>`).join("\n");

	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function robotsTxt(siteUrl: string): string {
	return `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
}
