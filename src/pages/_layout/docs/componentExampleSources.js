const npmEntry = '@getdom/studio';
const npmStyle = '@getdom/studio/style.css';
const sourceEntry = './dom-studio/pages/lib/vue/index.js';

/**
 * Builds package and app-owned variants of a repository example so either can
 * be pasted into an application without DOM Studio's internal import paths.
 *
 * @param {string} source Raw Vue single-file-component source.
 * @returns {{ npm: string, source: string }} Copy-ready source variants.
 */
export function createComponentExampleSources(source) {
	return {
		npm: addStyleImport(replaceDomStudioImports(source, npmEntry), npmStyle),
		source: replaceDomStudioImports(source, sourceEntry),
	};
}

/**
 * Replaces package and repository-only DOM Studio imports with one consumer
 * entry point while leaving example-owned helper files untouched.
 *
 * @param {string} source Raw Vue single-file-component source.
 * @param {string} entry Consumer-facing Vue entry point.
 * @returns {string} Source with portable component imports.
 */
function replaceDomStudioImports(source, entry) {
	return source
		.replace(
			/import\s+(Dom[A-Za-z0-9]+)\s+from\s+['"](?:\.\.\/)+Dom[A-Za-z0-9]+\.vue['"];?/g,
			(_match, componentName) => `import { ${componentName} } from '${entry}';`,
		)
		.replace(
			/from\s+['"](?:\.\.\/)+Dom[A-Za-z0-9]+\.vue['"]/g,
			`from '${entry}'`,
		)
		.replace(
			/from\s+['"](?:@getdom\/studio(?:\/vue)?|(?:\.\.\/)+lib\/vue(?:\/index\.js)?)['"]/g,
			`from '${entry}'`,
		);
}

/**
 * Adds the stylesheet needed by the selected installation method directly to
 * a Vue example, unless that stylesheet is already present.
 *
 * @param {string} source Portable Vue single-file-component source.
 * @param {string} stylesheet Consumer-facing stylesheet entry point.
 * @returns {string} Copy-ready source with its required style import.
 */
function addStyleImport(source, stylesheet) {
	if (source.includes(`import '${stylesheet}';`) || source.includes(`import "${stylesheet}";`)) return source;
	if (/<script\b[^>]*>/.test(source)) {
		return source.replace(/(<script\b[^>]*>\s*\n)/, `$1import '${stylesheet}';\n`);
	}
	return `<script setup>\nimport '${stylesheet}';\n</script>\n\n${source}`;
}
