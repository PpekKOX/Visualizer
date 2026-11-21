import { escapeHtml, fromHtml, slot } from "../../dom";
import { legendHtml } from "../legend";
import type { Visualizer } from "../types";
import type { Graph, GraphNode, GraphState } from "./graphState";

const NODE_RADIUS = 5.5;
const ARROW_SIZE = 2.4;
const BADGE_OFFSET = 4.4;
const LEGEND = [
	{ label: "In queue", color: "bg-amber-400" },
	{ label: "Current node", color: "bg-violet-400" },
	{ label: "In order", color: "bg-emerald-500" },
	{ label: "Edge in focus", color: "bg-rose-500" },
];

function point(x: number, y: number): string {
	return `${x.toFixed(2)},${y.toFixed(2)}`;
}

function edgeHtml(from: GraphNode, to: GraphNode): string {
	const length = Math.hypot(to.x - from.x, to.y - from.y);
	const dx = (to.x - from.x) / length;
	const dy = (to.y - from.y) / length;
	const tipX = to.x - dx * NODE_RADIUS;
	const tipY = to.y - dy * NODE_RADIUS;
	const baseX = tipX - dx * ARROW_SIZE;
	const baseY = tipY - dy * ARROW_SIZE;
	const wing = ARROW_SIZE / 2;

	return `
		<g data-edge>
			<line x1="${from.x + dx * NODE_RADIUS}" y1="${from.y + dy * NODE_RADIUS}" x2="${baseX}" y2="${baseY}" stroke="currentColor" stroke-width="0.6" />
			<polygon points="${point(tipX, tipY)} ${point(baseX - dy * wing, baseY + dx * wing)} ${point(baseX + dy * wing, baseY - dx * wing)}" fill="currentColor" />
		</g>`;
}

function nodeHtml({ label, x, y }: GraphNode): string {
	const badgeX = x + BADGE_OFFSET;
	const badgeY = y - BADGE_OFFSET;

	return `
		<g data-node>
			<circle cx="${x}" cy="${y}" r="${NODE_RADIUS}" />
			<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" class="fill-slate-950 font-display text-[4.5px] font-bold">${escapeHtml(label)}</text>
			<g>
				<circle cx="${badgeX}" cy="${badgeY}" r="2.5" stroke-width="0.4" />
				<text x="${badgeX}" y="${badgeY}" text-anchor="middle" dominant-baseline="central" stroke="none" class="fill-white font-mono text-[2.8px] font-semibold"></text>
			</g>
		</g>`;
}

function nodeColor(state: GraphState, node: number): string {
	if (node === state.current) return "fill-violet-400";
	if (state.order.includes(node)) return "fill-emerald-500";
	if (state.queue.includes(node)) return "fill-amber-400";

	return "fill-sky-500";
}

function chipsHtml(graph: Graph, nodes: number[], color: string): string {
	if (nodes.length === 0) return `<span class="text-slate-500">empty</span>`;

	return nodes
		.map((node) => `<span class="rounded-md px-2 py-0.5 font-mono font-semibold text-slate-950 ${color}">${escapeHtml(graph.nodes[node].label)}</span>`)
		.join("");
}

export class GraphView implements Visualizer<GraphState> {
	readonly element: HTMLElement;
	private readonly svg: SVGSVGElement;
	private readonly queue: HTMLElement;
	private readonly order: HTMLElement;
	private graph: Graph | undefined;
	private edges: SVGGElement[] = [];
	private nodes: SVGGElement[] = [];

	constructor(private readonly compact = false) {
		const list = (label: string, name: string) => `
			<div class="flex min-h-11 items-center gap-3 rounded-lg bg-slate-950/60 px-3 py-2">
				<dt class="w-12 shrink-0 text-slate-400">${label}</dt>
				<dd class="flex flex-wrap gap-1.5" data-slot="${name}"></dd>
			</div>`;

		this.element = fromHtml(`
			<div class="${compact ? "h-full" : ""}">
				<svg viewBox="${compact ? "6 6 128 44" : "0 0 140 56"}" class="${compact ? "h-full w-full" : "h-56 w-full sm:h-72"}" aria-hidden="true"></svg>
				<dl class="${compact ? "hidden" : "mt-4 grid gap-2 text-sm sm:grid-cols-2"}">
					${list("Queue", "queue")}
					${list("Order", "order")}
				</dl>
				${compact ? "" : legendHtml(LEGEND)}
			</div>`);
		this.svg = this.element.querySelector("svg")!;
		this.queue = slot(this.element, "queue");
		this.order = slot(this.element, "order");
	}

	render(state: GraphState): void {
		if (state.graph !== this.graph) this.draw(state.graph);

		const changedNode = state.activeEdge === null ? null : state.graph.edges[state.activeEdge][1];

		this.edges.forEach((edge, index) => {
			const active = index === state.activeEdge;
			const removed = !active && state.removedEdges.includes(index);
			edge.setAttribute("class", `transition-colors duration-200 ${active ? "text-rose-500" : "text-slate-500"} ${removed ? "opacity-20" : ""}`);
		});

		this.nodes.forEach((node, index) => {
			const [circle, , badge] = node.children;
			const badgeColor = index === changedNode ? "fill-rose-500 stroke-rose-300" : "fill-slate-800 stroke-slate-500";

			circle.setAttribute("class", `transition-colors duration-200 ${nodeColor(state, index)}`);
			badge.setAttribute("class", this.compact ? "hidden" : badgeColor);
			badge.lastElementChild!.textContent = String(state.inDegree[index]);
		});

		this.queue.innerHTML = chipsHtml(state.graph, state.queue, "bg-amber-400");
		this.order.innerHTML = chipsHtml(state.graph, state.order, "bg-emerald-500");
	}

	private draw(graph: Graph): void {
		this.graph = graph;
		this.svg.innerHTML =
			graph.edges.map(([from, to]) => edgeHtml(graph.nodes[from], graph.nodes[to])).join("") + graph.nodes.map(nodeHtml).join("");
		this.edges = [...this.svg.querySelectorAll<SVGGElement>("[data-edge]")];
		this.nodes = [...this.svg.querySelectorAll<SVGGElement>("[data-node]")];
	}
}
