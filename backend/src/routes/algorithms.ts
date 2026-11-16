import { Router } from "express";
import type { AlgorithmRepository } from "../algorithmRepository.js";

export function createAlgorithmRouter(repository: AlgorithmRepository): Router {
	const router = Router();

	router.get("/categories", (_req, res) => {
		res.json(repository.getCategories());
	});

	router.get("/algorithms/:category/:slug", (req, res) => {
		const algorithm = repository.getAlgorithm(req.params.category, req.params.slug);
		if (!algorithm) {
			res.status(404).json({ error: "Algorithm not found" });
			return;
		}
		res.json(algorithm);
	});

	return router;
}
