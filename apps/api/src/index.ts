import { config } from './config.js';
import { buildApp } from './app.js';

const app = buildApp();

try {
  await app.listen({ host: config.host, port: config.port });
  app.log.info(`Infinite World API listening on http://${config.host}:${config.port}`);
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}
