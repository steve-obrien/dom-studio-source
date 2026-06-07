import { readFile } from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const routesFilePath = path.join(rootDir, 'src', 'routes.js');

const loadRoutesFromRoutesFile = async () => {
	const routesFile = await readFile(routesFilePath, 'utf8');
	const matches = [...routesFile.matchAll(/path:\s*['"`]([^'"`]+)['"`]/g)];
	return [
		...new Set(
			matches
				.map((match) => match[1]?.trim())
				.filter(Boolean)
				.filter((routePath) => routePath.startsWith("/"))
				.filter((routePath) => !routePath.includes(":") && !routePath.includes("*") && !routePath.includes("$")),
		),
	];
};

export const loadStaticRoutes = async () => {
	try {
		const routes = await loadRoutesFromRoutesFile();
		return routes.length ? routes : ["/", "/docs"];
	} catch {
		return ["/", "/docs"];
	}
};
