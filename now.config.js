export default {
	app: {
		name: 'DOM Studio',
		lang: 'en-GB',
	},
	server: {
		host: '0.0.0.0',
		port: 3333,
		apiPrefix: '/api',
		apiDir: 'server/api',
	},
	ssr: {
		template: 'index.html',
		devServerEntry: '/src/entry-server.js',
		clientOutDir: 'dist/client',
		developmentStaticFiles: [
			'/robots.txt',
			'/sitemap.xml',
		],
		serverEntry: 'dist/server/entry-server.js',
		manifest: 'dist/client/.vite/ssr-manifest.json',
	},
};
