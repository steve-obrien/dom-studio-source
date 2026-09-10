export default {
	app: {
		name: 'DOM Studio',
		lang: 'en-GB',
	},
	server: {
		host: '0.0.0.0',
		port: process.env.NODE_ENV === 'production' ? 3333 : 8100,
		apiPrefix: '/api',
		apiDir: 'server/api',
		// Caddy locally, and the production reverse proxy, terminate HTTPS.
		useSSL: false,
	},
	ssr: {
		template: 'index.html',
		devServerEntry: '/src/entry-server.js',
		clientOutDir: 'dist/client',
		developmentStaticFiles: [
			'/robots.txt',
		],
		serverEntry: 'dist/server/entry-server.js',
		manifest: 'dist/client/.vite/ssr-manifest.json',
	},
};
