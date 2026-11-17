export interface View {
	element: HTMLElement;
	title: string;
	destroy?: () => void;
}

export type Params = Record<string, string>;
export type Page = (params: Params) => View | Promise<View>;

export interface Route {
	path: string;
	page: Page;
}

interface RouterOptions {
	outlet: HTMLElement;
	routes: Route[];
	notFound: Page;
	error: (error: unknown) => View;
}

const segments = (path: string) => path.split("/").filter(Boolean);

export function matchRoute(routes: Route[], pathname: string): { page: Page; params: Params } | undefined {
	const actual = segments(pathname);

	for (const route of routes) {
		const expected = segments(route.path);
		if (expected.length !== actual.length) continue;

		const params: Params = {};
		const matches = expected.every((segment, index) => {
			if (segment.startsWith(":")) {
				params[segment.slice(1)] = decodeURIComponent(actual[index]);
				return true;
			}
			return segment === actual[index];
		});
		if (matches) return { page: route.page, params };
	}
	return undefined;
}

export function navigate(path: string): void {
	history.pushState(null, "", path);
	window.dispatchEvent(new PopStateEvent("popstate"));
}

export function startRouter({ outlet, routes, notFound, error }: RouterOptions): void {
	let current: View | undefined;
	let renderId = 0;

	async function render(): Promise<void> {
		const id = ++renderId;
		const match = matchRoute(routes, location.pathname);

		let view: View;
		try {
			view = await (match ? match.page(match.params) : notFound({}));
		} catch (reason) {
			view = error(reason);
		}

		if (id !== renderId) {
			view.destroy?.();
			return;
		}

		current?.destroy?.();
		current = view;
		outlet.replaceChildren(view.element);
		document.title = view.title;

		const target = location.hash && document.getElementById(location.hash.slice(1));
		if (target) target.scrollIntoView();
		else window.scrollTo(0, 0);
	}

	document.addEventListener("click", (event) => {
		if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

		const anchor = (event.target as Element).closest("a");
		if (!anchor || anchor.target || anchor.hasAttribute("download") || anchor.origin !== location.origin) return;
		if (anchor.pathname === location.pathname && anchor.hash) return;

		event.preventDefault();
		navigate(anchor.pathname + anchor.search + anchor.hash);
	});

	window.addEventListener("popstate", render);
	void render();
}
