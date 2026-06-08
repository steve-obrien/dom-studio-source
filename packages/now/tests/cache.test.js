import { describe, expect, it } from 'vitest'
import { createMemoryCache } from '../src/framework/server/cache.js'

describe('memory cache', () => {
	it('stores and clears values', () => {
		const cache = createMemoryCache()

		cache.set('answer', 42)

		expect(cache.exists('answer')).toBe(true)
		expect(cache.get('answer')).toBe(42)

		cache.clear('answer')
		expect(cache.exists('answer')).toBe(false)
	})
})
