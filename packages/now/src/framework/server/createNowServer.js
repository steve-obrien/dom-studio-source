import fs from 'node:fs'
import { createServer as createHttpServer } from 'node:http'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import dotenv from 'dotenv'
import express from 'express'
import { defineApiRoutes } from './defineApiRoutes.js'
import { createSsrContext, renderTemplateHtml, serializePayload } from './renderTemplate.js'
import { requestContextMiddleware } from './requestContext.js'

export async function createNowServer({ config = {}, root } = {}) {
	const app = express()
	const httpServer = createHttpServer(app)
	const isProduction = process.env.NODE_ENV === 'production'
	const resolved = resolveConfig(config, root)

	dotenv.config({ path: path.join(resolved.root, '.env') })

	app.disable('x-powered-by')
	app.use(requestContextMiddleware())
	app.use(redirectLocalhostAlias)

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

function redirectLocalhostAlias(req, res, next) {
	if (req.hostname !== '127.0.0.1' || req.path.startsWith('/api')) {
		next()
		return
	}

	const target = new URL(`${req.protocol}://localhost${req.originalUrl}`)
	if (req.socket.localPort) target.port = String(req.socket.localPort)
	res.redirect(307, target.toString())
}

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

async function installDevelopmentRenderer(app, config, httpServer) {
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

function sendRenderError(res, error) {
	const status = error?.code === 404 ? 404 : 500
	const message = status === 404 ? 'Page not found' : 'Internal Server Error'

	console.error(error)
	res.status(status).set({ 'Content-Type': 'text/plain' }).end(message)
}

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
			serverEntry: 'dist/server/entry-server.js',
			manifest: 'dist/client/.vite/ssr-manifest.json',
			...(config.ssr || {})
		}
	}
}
