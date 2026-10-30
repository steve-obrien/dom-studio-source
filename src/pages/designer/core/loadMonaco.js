/**
 * Loads Monaco from the site's own monaco-editor install, with its CSS and
 * editor worker. Pass it as `load` to DomMonacoCodeView. Apps using the
 * package write their own loader, since Monaco is not a DOM Studio dependency.
 *
 * @returns {Promise<object>} The Monaco editor API.
 */
export async function loadMonaco() {
	const [, api, worker] = await Promise.all([
		import('monaco-editor/min/vs/editor/editor.main.css'),
		import('monaco-editor/esm/vs/editor/editor.api'),
		import('monaco-editor/esm/vs/editor/editor.worker?worker'),
	]);
	if (!window.MonacoEnvironment) window.MonacoEnvironment = { getWorker: () => new worker.default() };
	return api;
}
