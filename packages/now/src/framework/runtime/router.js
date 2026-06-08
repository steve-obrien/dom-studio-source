import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router'
import { createRoutesFromPages } from './routes.js'

export function createNowRouter(options = {}) {
	const {
		routes,
		pages,
		history,
		scrollBehavior = defaultScrollBehavior
	} = options
	const resolvedRoutes = routes || (pages ? createRoutesFromPages(pages) : [])

	return createRouter({
		history: history || (import.meta.env.SSR
			? createMemoryHistory(import.meta.env.BASE_URL)
			: createWebHistory(import.meta.env.BASE_URL)),
		routes: resolvedRoutes,
		scrollBehavior
	})
}

function defaultScrollBehavior() {
	return { top: 0 }
}
