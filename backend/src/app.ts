import { existsSync } from "node:fs";
import path from "node:path";
import express, { type Express } from "express";
import type { AlgorithmRepository } from "./algorithmRepository.js";
import { createAlgorithmRouter } from "./routes/algorithms.js";

export function createApp(repository: AlgorithmRepository, frontendDir?: string): Express {
	const app = express();

	app.use("/api", createAlgorithmRouter(repository));
	app.use("/api", (_req, res) => {
		res.status(404).json({ error: "Not found" });
	});

	if (frontendDir && existsSync(frontendDir)) {
		app.use(express.static(frontendDir, { extensions: ["html"] }));
		app.use((req, res, next) => {
			if (req.method !== "GET") return next();
			res.sendFile(path.join(frontendDir, "index.html"));
		});
	}

	return app;
}
