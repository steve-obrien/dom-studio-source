import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
	plugins: [
		vue()
	],
	build: {
		cssCodeSplit: true
	},
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
			'#now': fileURLToPath(new URL('./src/framework', import.meta.url))
		}
	}
})
