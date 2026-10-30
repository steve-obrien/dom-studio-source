const viewportUnit = /(?<![\w-])(-?(?:\d+\.?\d*|\.\d+))(?:s|d|l)?vh\b/g;

/**
 * Rewrites viewport-height lengths in declarations to the artboard's device
 * height. Only declaration blocks (text followed by `}`) change, so selectors
 * such as `.min-h-\[78svh\]` and at-rule preludes stay as written.
 */
export function artboardViewportCss(css) {
	if (!css || !/vh\b/.test(css)) return css;
	return css.split(/([{}])/).map((part, index, parts) => (parts[index + 1] === '}' ? part.replace(viewportUnit, 'calc($1 * var(--artboard-vh, 1vh))') : part)).join('');
}
