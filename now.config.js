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
		useSSL: process.env.NODE_ENV !== 'production',
		sslKey: 'localhost+2-key.pem',
		sslCert: 'localhost+2.pem',
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
