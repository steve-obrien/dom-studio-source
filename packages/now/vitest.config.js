import { defineConfig } from 'vitest/config'
import viteConfig from './vite.config.js'

export default defineConfig({
	...viteConfig,
	test: {
		environment: 'jsdom',
		include: ['tests/**/*.test.js'],
		exclude: ['wad2/**', 'node_modules/**', 'dist/**']
	}
})
