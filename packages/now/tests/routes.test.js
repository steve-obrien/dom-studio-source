import { describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import express from 'express'
import { fileToRoutePath } from '../src/framework/runtime/routes.js'
import { defineApiRoutes, fileToApiRoute } from '../src/framework/server/defineApiRoutes.js'

describe('page route conventions', () => {
	it('maps index pages for both lowercase and PascalCase conventions', () => {
		expect(fileToRoutePath('/src/pages/index.vue')).toBe('/')
		expect(fileToRoutePath('/src/pages/docs/index.vue')).toBe('/docs')
		expect(fileToRoutePath('/src/pages/Index.vue')).toBe('/')
		expect(fileToRoutePath('/src/pages/docs/Index.vue')).toBe('/docs')
	})

	it('maps dynamic and catch-all pages', () => {
		expect(fileToRoutePath('/src/pages/blog/[slug].vue')).toBe('/blog/:slug')
		expect(fileToRoutePath('/src/pages/[...all].vue')).toBe('/:all(.*)*')
	})
})

describe('api route conventions', () => {
	it('maps method suffixed files', () => {
		const route = fileToApiRoute('/app/server/api/users/[id].post.js', '/app/server/api', '/api')

		expect(route.method).toBe('post')
		expect(route.path).toBe('/api/users/:id')
	})

	it('maps controller files without a method suffix', () => {
		const route = fileToApiRoute('/app/server/api/ai/theme.js', '/app/server/api', '/api')

		expect(route.method).toBeNull()
		expect(route.path).toBe('/api/ai/theme')
	})

	it('mounts named method exports from controller files', async () => {
		const root = mkdtempSync(path.join(process.cwd(), '.tmp-api-routes-'))
		const apiDir = path.join(root, 'server/api')
		mkdirSync(path.join(apiDir, 'ai'), { recursive: true })
		writeFileSync(path.join(apiDir, 'ai/theme.js'), `
export function options(request, response) {
	response.status(204).end()
}

export function post(request) {
	return {
		method: request.method,
		body: request.body
	}
}
`)

		const app = express()
		await defineApiRoutes(app, {
			apiDir,
			prefix: '/api',
			middleware: [express.json()]
		})

		const mountedRoutes = app._router.stack
			.filter((layer) => layer.route)
			.map((layer) => ({
				path: layer.route.path,
				methods: layer.route.methods
			}))

		try {
			expect(mountedRoutes).toContainEqual({
				path: '/api/ai/theme',
				methods: { options: true }
			})
			expect(mountedRoutes).toContainEqual({
				path: '/api/ai/theme',
				methods: { post: true }
			})
		} finally {
			rmSync(root, { recursive: true, force: true })
		}
	})
})
