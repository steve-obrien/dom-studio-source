const appDir = process.env.APP_DIR || process.cwd();
const port = process.env.PORT || 3333;
const host = process.env.HOST || '127.0.0.1';
const webConcurrency = Number(process.env.WEB_CONCURRENCY || 2);

module.exports = {
	apps: [
		{
			name: 'getdom-studio',
			script: 'server.js',
			cwd: `${appDir}/current`,
			instances: webConcurrency,
			exec_mode: 'cluster',
			env: {
				NODE_ENV: 'production',
				PORT: port,
				HOST: host,
			},
		},
	],
};
