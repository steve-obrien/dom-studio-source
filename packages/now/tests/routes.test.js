import { describe, expect, it } from 'vitest'
import { fileToRoutePath } from '../src/framework/runtime/routes.js'
import { fileToApiRoute } from '../src/framework/server/defineApiRoutes.js'

describe('page route conventions', () => {
	it('maps index pages', () => {
		expect(fileToRoutePath('/src/pages/index.vue')).toBe('/')
		expect(fileToRoutePath('/src/pages/docs/index.vue')).toBe('/docs')
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
})
