import type { AlgorithmModule, StepAction } from "../types";
import type { Grid, GridState, GridStep } from "./gridState";
import { GridView, type GridViewOptions } from "./gridView";
import { randomGrid } from "./randomGrid";

export interface PathfindingConfig {
	run: (grid: Grid) => GridStep[];
	actions: Record<string, StepAction>;
	view: GridViewOptions;
}

export function createPathfindingModule({ run, actions, view }: PathfindingConfig): AlgorithmModule<GridState> {
	return {
		generateSteps: () => run(randomGrid()),
		createVisualizer: (compact) => new GridView(view, compact),
		actionOf: (step) => actions[step.line] ?? "other",
	};
}
