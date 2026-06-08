import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const methods = new Set(['get', 'post', 'put', 'patch', 'delete', 'options', 'head'])

export async function defineApiRoutes(app, options) {
	const routes = discoverApiRoutes(options.apiDir, options.prefix)
	const middleware = Array.isArray(options.middleware) ? options.middleware : []
	const rawMiddleware = Array.isArray(options.rawMiddleware) ? options.rawMiddleware : middleware

	for (const route of routes) {
		const module = await import(pathToFileURL(route.file).href)
		const handler = resolveHandler(module, route.method)
		const routeMiddleware = module.config?.body === 'raw' ? rawMiddleware : middleware

		if (!handler) {
			throw new Error(`No handler exported for ${route.method.toUpperCase()} ${route.path}`)
		}

		app[route.method](route.path, ...routeMiddleware, createHandler(handler))
	}
}

export function discoverApiRoutes(apiDir, prefix = '/api') {
	if (!fs.existsSync(apiDir)) return []

	return walk(apiDir)
		.filter((file) => file.endsWith('.js'))
		.map((file) => fileToApiRoute(file, apiDir, prefix))
		.sort((a, b) => routeScore(b.path) - routeScore(a.path))
}

export function fileToApiRoute(file, apiDir, prefix = '/api') {
	const relative = path.relative(apiDir, file)
	const parts = relative.split(path.sep)
	const fileName = parts.pop()
	const nameParts = fileName.replace(/\.js$/, '').split('.')
	const possibleMethod = nameParts.at(-1)
	const method = methods.has(possibleMethod) ? possibleMethod : 'get'

	if (methods.has(possibleMethod)) {
		nameParts.pop()
	}

	const routeParts = [...parts, nameParts.join('.')]
		.filter((part) => part !== 'index')
		.map((part) => {
			if (/^\[\.\.\..+\]$/.test(part)) {
				return `:${part.slice(4, -1)}(.*)*`
			}

			if (/^\[.+\]$/.test(part)) {
				return `:${part.slice(1, -1)}`
			}

			return part
		})

	const routePath = routeParts.length ? `/${routeParts.join('/')}` : ''

	return {
		file,
		method,
		path: `${prefix}${routePath}`
	}
}

function resolveHandler(module, method) {
	if (typeof module[method] === 'function') return module[method]
	if (typeof module.default === 'function') return module.default
	if (module.default && typeof module.default[method] === 'function') return module.default[method]
	return null
}

function createHandler(handler) {
	return async (req, res, next) => {
		try {
			const result = await handler(req, res)

			if (res.headersSent || result === undefined) return
			res.json(result)
		} catch (error) {
			next(error)
		}
	}
}

function walk(dir) {
	const entries = fs.readdirSync(dir, { withFileTypes: true })
	return entries.flatMap((entry) => {
		const file = path.join(dir, entry.name)
		return entry.isDirectory() ? walk(file) : file
	})
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
