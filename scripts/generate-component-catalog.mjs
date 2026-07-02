import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { componentCatalogOutputPath, writeComponentCatalogModule } from './lib/component-catalog.mjs';

const projectRoot = path.dirname(fileURLToPath(new URL('../package.json', import.meta.url)));

/**
 * Generates the source-backed component metadata catalog.
 *
 * @returns {void}
 */
function main() {
	writeComponentCatalogModule(projectRoot);
	console.log(`Generated ${path.relative(projectRoot, componentCatalogOutputPath(projectRoot))}`);
}

main();
