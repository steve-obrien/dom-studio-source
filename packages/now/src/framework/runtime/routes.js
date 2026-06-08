export function createRoutesFromPages(pages) {
	return Object.keys(pages)
		.map((file) => ({
			path: fileToRoutePath(file),
			name: fileToRouteName(file),
			component: pages[file]
		}))
		.sort(sortRoutes)
}

export function fileToRoutePath(file) {
	const page = file
		.replace(/^\/src\/pages/, '')
		.replace(/\.vue$/, '')

	const segments = page
		.split('/')
		.filter(Boolean)
		.filter((segment) => segment !== 'index')
		.map((segment) => {
			if (/^\[\.\.\..+\]$/.test(segment)) {
				return `:${segment.slice(4, -1)}(.*)*`
			}

			if (/^\[.+\]$/.test(segment)) {
				return `:${segment.slice(1, -1)}`
			}

			return segment
		})

	return segments.length ? `/${segments.join('/')}` : '/'
}

export function fileToRouteName(file) {
	const path = fileToRoutePath(file)
	if (path === '/') return 'index'

	return path
		.replace(/^\//, '')
		.replace(/[:()*.]+/g, '')
		.replace(/\//g, '-')
}

function sortRoutes(a, b) {
	return routeScore(b.path) - routeScore(a.path)
}

function routeScore(path) {
	return path
		.split('/')
		.reduce((score, segment) => {
			if (!segment) return score
			if (segment.includes('(.*)*')) return score - 10
			if (segment.startsWith(':')) return score + 1
			return score + 10
		}, 0)
}
