import { escapeHtml, fromHtml } from "../../dom";
import { legendHtml, type LegendItem } from "../legend";
import type { Visualizer } from "../types";
import type { Graph, GraphNode, GraphState } from "./graphState";

export interface GraphViewOptions {
	waiting?: string;
	done: string;
	treeEdge?: string;
	lists: { label: string; nodes: "waiting" | "done" }[];
}

type NodeStatus = "current" | "waiting" | "done" | "idle";

const NODE_RADIUS = 5.5;
const ARROW_SIZE = 2.4;
const BADGE_OFFSET = 4.4;
const NODE_COLORS: Record<NodeStatus, { fill: string; bg: string }> = {
	current: { fill: "fill-violet-400", bg: "bg-violet-400" },
	waiting: { fill: "fill-amber-400", bg: "bg-amber-400" },
	done: { fill: "fill-emerald-500", bg: "bg-emerald-500" },
	idle: { fill: "fill-sky-500", bg: "bg-sky-500" },
};
const EDGE_COLORS = {
	active: { text: "text-rose-500", bg: "bg-rose-500" },
	tree: { text: "text-emerald-500", bg: "bg-emerald-500" },
	idle: { text: "text-slate-500" },
};

function legendItems({ waiting, done, treeEdge }: GraphViewOptions): LegendItem[] {
	const items: LegendItem[] = [
		{ label: "Current node", color: NODE_COLORS.current.bg },
		{ label: done, color: NODE_COLORS.done.bg },
		{ label: "Edge in focus", color: EDGE_COLORS.active.bg, line: true },
	];
	if (waiting) items.unshift({ label: waiting, color: NODE_COLORS.waiting.bg });
	if (treeEdge) items.push({ label: treeEdge, color: EDGE_COLORS.tree.bg, line: true });

	return items;
}

function point(x: number, y: number): string {
	return `${x.toFixed(2)},${y.toFixed(2)}`;
}

function edgeHtml(graph: Graph, edge: number): string {
	const [from, to] = graph.edges[edge].map((node) => graph.nodes[node]);
	const length = Math.hypot(to.x - from.x, to.y - from.y);
	const dx = (to.x - from.x) / length;
	const dy = (to.y - from.y) / length;
	const tipX = to.x - dx * NODE_RADIUS;
	const tipY = to.y - dy * NODE_RADIUS;
	const arrowSize = graph.directed ? ARROW_SIZE : 0;
	const baseX = tipX - dx * arrowSize;
	const baseY = tipY - dy * arrowSize;
	const wing = arrowSize / 2;
	const arrow = graph.directed
		? `<polygon points="${point(tipX, tipY)} ${point(baseX - dy * wing, baseY + dx * wing)} ${point(baseX + dy * wing, baseY - dx * wing)}" fill="currentColor" />`
		: "";

	return `
		<g data-edge>
			<line x1="${from.x + dx * NODE_RADIUS}" y1="${from.y + dy * NODE_RADIUS}" x2="${baseX}" y2="${baseY}" stroke="currentColor" stroke-width="0.6" />
			${arrow}
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

function nodeStatus(state: GraphState, node: number): NodeStatus {
	if (node === state.current) return "current";
	if (state.waiting.includes(node)) return "waiting";
	if (state.done.includes(node)) return "done";

	return "idle";
}

function focusedNeighbor({ graph, activeEdge, current }: GraphState): number | null {
	if (activeEdge === null) return null;
	const [from, to] = graph.edges[activeEdge];

	return to === current ? from : to;
}

function chipsHtml(state: GraphState, nodes: number[]): string {
	if (nodes.length === 0) return `<span class="text-slate-500">empty</span>`;

	return nodes
		.map((node) => {
			const color = NODE_COLORS[nodeStatus(state, node)].bg;
			return `<span class="rounded-md px-2 py-0.5 font-mono font-semibold text-slate-950 ${color}">${escapeHtml(state.graph.nodes[node].label)}</span>`;
		})
		.join("");
}

export class GraphView implements Visualizer<GraphState> {
	readonly element: HTMLElement;
	private readonly svg: SVGSVGElement;
	private readonly lists: HTMLElement[];
	private graph: Graph | undefined;
	private edges: SVGGElement[] = [];
	private nodes: SVGGElement[] = [];

	constructor(
		private readonly options: GraphViewOptions,
		private readonly compact = false,
	) {
		const list = ({ label }: { label: string }) => `
			<div class="flex min-h-11 items-center gap-3 rounded-lg bg-slate-950/60 px-3 py-2">
				<dt class="w-14 shrink-0 text-slate-400">${escapeHtml(label)}</dt>
				<dd class="flex flex-wrap gap-1.5" data-list></dd>
			</div>`;

		this.element = fromHtml(`
			<div class="${compact ? "h-full" : ""}">
				<svg viewBox="${compact ? "6 6 128 44" : "0 0 140 56"}" class="${compact ? "h-full w-full" : "h-56 w-full sm:h-72"}" aria-hidden="true"></svg>
				<dl class="${compact ? "hidden" : `mt-4 grid gap-2 text-sm ${options.lists.length > 1 ? "sm:grid-cols-2" : ""}`}">
					${options.lists.map(list).join("")}
				</dl>
				${compact ? "" : legendHtml(legendItems(options))}
			</div>`);
		this.svg = this.element.querySelector("svg")!;
		this.lists = [...this.element.querySelectorAll<HTMLElement>("[data-list]")];
	}

	render(state: GraphState): void {
		if (state.graph !== this.graph) this.draw(state.graph);

		const neighbor = focusedNeighbor(state);

		this.edges.forEach((edge, index) => {
			const active = index === state.activeEdge;
			const color = active ? EDGE_COLORS.active : state.treeEdges.includes(index) ? EDGE_COLORS.tree : EDGE_COLORS.idle;
			const removed = !active && state.removedEdges.includes(index);
			edge.setAttribute("class", `transition-colors duration-200 ${color.text} ${removed ? "opacity-20" : ""}`);
		});

		this.nodes.forEach((node, index) => {
			const [circle, , badge] = node.children;
			const value = state.badges[index];
			const badgeColor = index === neighbor ? "fill-rose-500 stroke-rose-300" : "fill-slate-800 stroke-slate-500";

			circle.setAttribute("class", `transition-colors duration-200 ${NODE_COLORS[nodeStatus(state, index)].fill}`);
			badge.setAttribute("class", this.compact || value === undefined ? "hidden" : badgeColor);
			badge.lastElementChild!.textContent = value ?? "";
		});

		this.lists.forEach((list, index) => {
			list.innerHTML = chipsHtml(state, state[this.options.lists[index].nodes]);
		});
	}

	private draw(graph: Graph): void {
		this.graph = graph;
		this.svg.innerHTML = graph.edges.map((_, edge) => edgeHtml(graph, edge)).join("") + graph.nodes.map(nodeHtml).join("");
		this.edges = [...this.svg.querySelectorAll<SVGGElement>("[data-edge]")];
		this.nodes = [...this.svg.querySelectorAll<SVGGElement>("[data-node]")];
	}
}
