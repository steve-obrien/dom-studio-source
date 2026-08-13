import config from './now.config.js';
import { createNowServer } from './packages/now/src/framework/server/createNowServer.js';
import { installDocumentEditorCollaborationServer } from './server/lib/documentEditorCollaborationServer.js';
import { installSitemapRoute } from './server/lib/sitemapRoute.js';

const server = await createNowServer({ config, configure: configureApplication });
installDocumentEditorCollaborationServer(server.server);
await server.listen();

/**
 * Registers application-owned HTTP routes before Now installs static and SSR fallbacks.
 *
 * @param {{ app: import('express').Express }} context Now application context.
 * @returns {void}
 */
function configureApplication({ app }) {
	installSitemapRoute(app);
}
