/**
 * Serializes a theme into a light root and explicit dark-mode overrides.
 * Dark skin defaults must be emitted when needed to cancel a custom light skin;
 * otherwise the light value would continue to inherit in dark mode.
 *
 * @param {object} theme Normalized appearance, palette and skin variable maps.
 * @param {Record<string, string>} theme.appearance Shared appearance values.
 * @param {{light: object, dark: object}} theme.colors Mode-specific colour variables.
 * @param {{light: object, dark: object}} theme.skins Mode-specific skin variables.
 * @param {Record<string, string>} theme.skinDefaults Default skin CSS values.
 * @returns {string} Copyable CSS preserving each mode's skin values.
 */
export function serializeThemeCss({ appearance, colors, skins, skinDefaults }) {
	const lightSkins = Object.fromEntries(Object.entries(skins.light).filter(([name, value]) => value !== skinDefaults[name]));
	const darkSkins = Object.fromEntries(Object.entries(skins.dark).filter(([name, value]) => value !== skins.light[name]));
	return [
		formatCssRule(':root', { ...appearance, ...colors.light, ...lightSkins }),
		formatCssRule('[data-theme="dark"]', { ...colors.dark, ...darkSkins }),
	].join('\n\n');
}

/**
 * Formats a CSS variable map with stable insertion order and tab indentation.
 *
 * @param {string} selector CSS rule selector.
 * @param {Record<string, string>} values Normalized CSS variable values.
 * @returns {string} Complete CSS rule.
 */
function formatCssRule(selector, values) {
	const declarations = Object.entries(values).map(([name, value]) => `\t${name}: ${value};`);
	return `${selector} {\n${declarations.join('\n')}\n}`;
}
