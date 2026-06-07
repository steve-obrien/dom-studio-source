import { inject, provide } from 'vue';

export const menuContextKey = Symbol('DomMenuContext');

export function useParentMenuContext() {
	return inject(menuContextKey, null);
}

export function provideMenuContext(context) {
	provide(menuContextKey, context);
}
