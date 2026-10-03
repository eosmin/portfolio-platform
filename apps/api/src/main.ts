import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

createApp().listen(env.API_PORT, () => {
  logger.info({ port: env.API_PORT }, 'api listening');
});
