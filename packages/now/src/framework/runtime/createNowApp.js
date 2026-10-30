import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import { createNowRouter } from './router.js'

export function createNowApp({
	App,
	routes,
	plugins = [],
	routerOptions = {},
	install
} = {}) {
	if (!App) {
		throw new Error('createNowApp requires an App component.')
	}

	const app = createSSRApp(App)
	const pinia = createPinia()
	const router = createNowRouter({
		routes,
		...routerOptions
	})

	app.use(pinia)
	app.use(router)

	for (const module of plugins) {
		const pluginInstall = module.default || module.install
		if (typeof pluginInstall === 'function') {
			pluginInstall({ app, router, pinia })
		}
	}

	if (typeof install === 'function') {
		install({ app, router, pinia })
	}

	return { app, router, pinia }
}
