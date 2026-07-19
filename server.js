import config from './now.config.js';
import { createNowServer } from './packages/now/src/framework/server/createNowServer.js';
import { installDocumentEditorCollaborationServer } from './server/lib/documentEditorCollaborationServer.js';

const server = await createNowServer({ config });
installDocumentEditorCollaborationServer(server.server);
await server.listen();
