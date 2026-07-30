import { inject, provide } from 'vue';

export const scrollMenuContextKey = Symbol('DomScrollMenuContext');

/**
 * Provides the parent scroll-menu contract to nested items.
 *
 * @param {object} context Scroll-menu registration and selection contract.
 * @returns {void}
 */
export function provideScrollMenuContext(context) {
	provide(scrollMenuContextKey, context);
}

/**
 * Reads the nearest parent scroll-menu contract.
 *
 * @returns {object|null} Parent scroll-menu contract when available.
 */
export function useScrollMenuContext() {
	return inject(scrollMenuContextKey, null);
}
