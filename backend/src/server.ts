import path from "node:path";
import { loadAlgorithmRepository } from "./algorithmRepository.js";
import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 3000);
const repository = loadAlgorithmRepository(path.resolve(import.meta.dirname, "../data"));
const app = createApp(repository, path.resolve(import.meta.dirname, "../../frontend/dist"));

app.listen(port, () => {
	console.log(`Visualizer API running on http://localhost:${port}`);
});
