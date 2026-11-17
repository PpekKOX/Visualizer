import { describe, expect, it } from "vitest";
import { matchRoute, type Route } from "./router";

const home = () => ({ element: {} as HTMLElement, title: "home" });
const algorithm = () => ({ element: {} as HTMLElement, title: "algorithm" });
const routes: Route[] = [
	{ path: "/", page: home },
	{ path: "/:category/:algorithm", page: algorithm },
];

describe("matchRoute", () => {
	it("matches the home page", () => {
		expect(matchRoute(routes, "/")).toEqual({ page: home, params: {} });
	});

	it("extracts parameters", () => {
		expect(matchRoute(routes, "/sortingAlgorithms/bubblesort/")).toEqual({
			page: algorithm,
			params: { category: "sortingAlgorithms", algorithm: "bubblesort" },
		});
	});

	it("returns undefined for unknown paths", () => {
		expect(matchRoute(routes, "/a/b/c")).toBeUndefined();
	});
});
