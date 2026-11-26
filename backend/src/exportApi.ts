import path from "node:path";
import { loadAlgorithmRepository } from "./algorithmRepository.js";
import { writeStaticApi } from "./staticApi.js";

const repository = loadAlgorithmRepository(path.resolve(import.meta.dirname, "../data"));
const apiDir = path.resolve(import.meta.dirname, "../../frontend/dist/api");
const files = writeStaticApi(repository, apiDir);

console.log(`Exported ${files.length} API responses to ${apiDir}`);
