import config from './now.config.js';
import { createNowServer } from './packages/now/src/framework/server/createNowServer.js';

const server = await createNowServer({ config });
await server.listen();
