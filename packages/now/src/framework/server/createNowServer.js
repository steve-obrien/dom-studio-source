import fs from 'node:fs'
import { createServer as createHttpServer } from 'node:http'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import dotenv from 'dotenv'
import express from 'express'
import { defineApiRoutes } from './defineApiRoutes.js'
import { createSsrContext, renderTemplateHtml, serializePayload } from './renderTemplate.js'
import { requestContextMiddleware } from './requestContext.js'

/**
 * Creates a Now HTTP server with API routing and the active SSR renderer.
 *
 * @param {{ config?: object, root?: string }} [options] Server options.
 * @returns {Promise<{ app: import('express').Express, server: import('node:http').Server, config: object, listen: Function }>} Now server wrapper.
 */
export async function createNowServer({ config = {}, root } = {}) {
	const app = express()
	const httpServer = createHttpServer(app)
	const isProduction = process.env.NODE_ENV === 'production'
	const resolved = resolveConfig(config, root)

	dotenv.config({ path: path.join(resolved.root, '.env') })

	app.disable('x-powered-by')
	app.use(requestContextMiddleware())
	app.use(redirectLocalhostAlias)
	app.use(ignoreChromeDevtoolsProbe)

	await installApi(app, resolved)

	if (isProduction) {
		await installProductionRenderer(app, resolved)
	} else {
		await installDevelopmentRenderer(app, resolved, httpServer)
	}

	return {
		app,
		server: httpServer,
		config: resolved,
		/**
		 * Starts the HTTP server on the configured host and port.
		 *
		 * @returns {Promise<void>} Resolves when the server is listening.
		 */
		async listen() {
			const port = process.env.PORT || resolved.server.port
			const host = process.env.HOST || resolved.server.host
			const listenHost = host === 'localhost' ? '0.0.0.0' : host

			return new Promise((resolve) => {
				httpServer.listen(port, listenHost, () => {
					console.log(`Now is listening on http://${host}:${port}`)
					resolve()
				})
			})
		}
	}
}

/**
 * Redirects loopback IP page requests to localhost so browser cookies share one origin.
 *
 * @param {import('express').Request} req Incoming request.
 * @param {import('express').Response} res Outgoing response.
 * @param {import('express').NextFunction} next Express continuation callback.
 * @returns {void}
 */
function redirectLocalhostAlias(req, res, next) {
	if (req.hostname !== '127.0.0.1' || req.path.startsWith('/api')) {
		next()
		return
	}

	const target = new URL(`${req.protocol}://localhost${req.originalUrl}`)
	if (req.socket.localPort) target.port = String(req.socket.localPort)
	res.redirect(307, target.toString())
}

/**
 * Ignores Chrome's local DevTools probe so it does not hit the app renderer.
 *
 * @param {import('express').Request} req Incoming request.
 * @param {import('express').Response} res Outgoing response.
 * @param {import('express').NextFunction} next Express continuation callback.
 * @returns {void}
 */
function ignoreChromeDevtoolsProbe(req, res, next) {
	if (req.path !== '/.well-known/appspecific/com.chrome.devtools.json') {
		next()
		return
	}

	res.status(204).end()
}

/**
 * Registers file-based API routes and the default health endpoint.
 *
 * @param {import('express').Express} app Express app.
 * @param {object} config Resolved Now config.
 * @returns {Promise<void>}
 */
async function installApi(app, config) {
	const jsonMiddleware = express.json({ limit: config.server.bodyLimit })
	const rawJsonMiddleware = express.raw({ type: 'application/json', limit: config.server.bodyLimit })

	await defineApiRoutes(app, {
		root: config.root,
		apiDir: path.resolve(config.root, config.server.apiDir),
		prefix: config.server.apiPrefix,
		middleware: [jsonMiddleware],
		rawMiddleware: [rawJsonMiddleware]
	})

	app.get(`${config.server.apiPrefix}/health`, (req, res) => {
		res.json({ ok: true })
	})
}

/**
 * Mounts the production static asset server and SSR fallback renderer.
 *
 * @param {import('express').Express} app Express app.
 * @param {object} config Resolved Now config.
 * @returns {Promise<void>}
 */
async function installProductionRenderer(app, config) {
	const compression = (await import('compression')).default
	const clientDir = path.resolve(config.root, config.ssr.clientOutDir)
	const templatePath = path.join(clientDir, 'index.html')
	const serverEntryPath = path.resolve(config.root, config.ssr.serverEntry)
	const manifestPath = path.resolve(config.root, config.ssr.manifest)

	app.use(compression())
	app.use(express.static(clientDir, { index: false }))

	app.use('*', async (req, res) => {
		try {
			const template = fs.readFileSync(templatePath, 'utf-8')
			const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
			const { render } = await import(pathToFileURL(serverEntryPath).href)
			await renderPage({ req, res, render, template, manifest })
		} catch (error) {
			sendRenderError(res, error)
		}
	})
}

/**
 * Mounts the development Vite middleware and SSR fallback renderer.
 *
 * @param {import('express').Express} app Express app.
 * @param {object} config Resolved Now config.
 * @param {import('node:http').Server} httpServer HTTP server used for HMR.
 * @returns {Promise<void>}
 */
async function installDevelopmentRenderer(app, config, httpServer) {
	installDevelopmentStaticFiles(app, config)

	const { createServer: createViteServer } = await import('vite')
	const vite = await createViteServer({
		root: config.root,
		server: {
			middlewareMode: true,
			hmr: {
				server: httpServer
			}
		},
		appType: 'custom'
	})

	app.use(vite.middlewares)

	app.use('*', async (req, res) => {
		try {
			const templatePath = path.resolve(config.root, config.ssr.template)
			const rawTemplate = fs.readFileSync(templatePath, 'utf-8')
			const template = await vite.transformIndexHtml(req.originalUrl, rawTemplate)
			const { render } = await vite.ssrLoadModule(config.ssr.devServerEntry)

			await renderPage({ req, res, render, template, manifest: {} })
		} catch (error) {
			vite.ssrFixStacktrace?.(error)
			sendRenderError(res, error)
		}
	})
}

/**
 * Serves allowlisted generated static files from the client build output in development.
 *
 * @param {import('express').Express} app Express app.
 * @param {object} config Resolved Now config.
 * @returns {void}
 */
function installDevelopmentStaticFiles(app, config) {
	const staticFiles = Array.isArray(config.ssr.developmentStaticFiles)
		? config.ssr.developmentStaticFiles
		: []
	if (!staticFiles.length) return

	const clientDir = path.resolve(config.root, config.ssr.clientOutDir)
	app.get(staticFiles, (req, res, next) => {
		const fileName = req.path.replace(/^\/+/, '')
		const filePath = path.resolve(clientDir, fileName)

		if (!isPathInsideDirectory(filePath, clientDir)) {
			next()
			return
		}

		res.sendFile(filePath, (error) => {
			if (!error) return
			if (isMissingStaticFileError(error)) {
				next()
				return
			}

			next(error)
		})
	})
}

/**
 * Checks whether a file path stays within an expected directory.
 *
 * @param {string} filePath Absolute file path.
 * @param {string} directory Absolute directory path.
 * @returns {boolean} True when the file path is inside the directory.
 */
function isPathInsideDirectory(filePath, directory) {
	const relative = path.relative(directory, filePath)
	return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative)
}

/**
 * Checks whether a static send error means the file simply does not exist.
 *
 * @param {Error & { code?: string, status?: number, statusCode?: number }} error Static file error.
 * @returns {boolean} True when Express should fall through to later middleware.
 */
function isMissingStaticFileError(error) {
	return error?.code === 'ENOENT' || error?.status === 404 || error?.statusCode === 404
}

/**
 * Renders an SSR page response for the current request URL.
 *
 * @param {{ req: import('express').Request, res: import('express').Response, render: Function, template: string, manifest: object }} options Render options.
 * @returns {Promise<void>}
 */
async function renderPage({ req, res, render, template, manifest }) {
	const ssrContext = createSsrContext()
	const { appHtml, payload, status } = await render(req.originalUrl, ssrContext, { req, res })
	const html = renderTemplateHtml(template, {
		appHtml,
		context: ssrContext,
		manifest,
		payload: serializePayload(payload)
	})

	res
		.status(status || ssrContext.status || 200)
		.set({ 'Content-Type': 'text/html' })
		.end(html)
}

/**
 * Sends a plain HTTP error when SSR rendering fails.
 *
 * @param {import('express').Response} res Outgoing response.
 * @param {Error & { code?: number|string }} error Render error.
 * @returns {void}
 */
function sendRenderError(res, error) {
	const status = error?.code === 404 ? 404 : 500
	const message = status === 404 ? 'Page not found' : 'Internal Server Error'

	console.error(error)
	res.status(status).set({ 'Content-Type': 'text/plain' }).end(message)
}

/**
 * Resolves user config against Now's runtime defaults.
 *
 * @param {object} config User config.
 * @param {string} [root] Optional root directory override.
 * @returns {object} Resolved config.
 */
function resolveConfig(config, root) {
	const projectRoot = path.resolve(root || config.root || process.cwd())

	return {
		root: projectRoot,
		app: {
			name: 'Now',
			lang: 'en-GB',
			...(config.app || {})
		},
		server: {
			host: '0.0.0.0',
			port: 3000,
			apiPrefix: '/api',
			apiDir: 'server/api',
			bodyLimit: '1mb',
			...(config.server || {})
		},
		ssr: {
			template: 'index.html',
			devServerEntry: '/src/entry-server.js',
			clientOutDir: 'dist/client',
			developmentStaticFiles: [],
			serverEntry: 'dist/server/entry-server.js',
			manifest: 'dist/client/.vite/ssr-manifest.json',
			...(config.ssr || {})
		}
	}
}
