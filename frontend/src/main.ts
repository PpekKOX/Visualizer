import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/space-grotesk";
import "./style.css";
import { homePage } from "./pages/homePage";
import { errorPage, notFoundPage } from "./pages/messagePage";
import { startRouter } from "./router";

startRouter({
	outlet: document.getElementById("outlet")!,
	routes: [
		{ path: "/", page: homePage },
		{ path: "/:category/:algorithm", page: async (params) => (await import("./pages/algorithmPage")).algorithmPage(params) },
	],
	notFound: notFoundPage,
	error: errorPage,
});
