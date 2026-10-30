/** Internal context shared by a material editor and its section/colour controls. */
export const cssEditorContextKey = Symbol('css-component-editor');

/**
 * Resolves simple semantic variable references against the active preview palette.
 * The original model value stays untouched so linked colours remain linked.
 * Unknown references and cycles are preserved for the browser's CSS fallback.
 *
 * @param {string} value CSS colour or expression containing variable references.
 * @param {Record<string, string>} variables Active preview CSS variables.
 * @param {Set<string>} visited References already being resolved in this branch.
 * @returns {string} CSS expression with known variables substituted.
 */
export function resolveEditorColor(value, variables = {}, visited = new Set()) {
	return String(value ?? '').replace(/var\(\s*(--[\w-]+)\s*\)/g, (reference, name) => {
		if (visited.has(name) || variables[name] == null) return reference;
		return resolveEditorColor(variables[name], variables, new Set([...visited, name]));
	});
}
