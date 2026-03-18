import pino from 'pino';
import { envConfig } from './envConfig.js';

export const logger =
  envConfig.NODE_ENV !== 'production'
    ? pino({ level: 'debug', transport: { target: 'pino-pretty', options: { colorize: true } } })
    : pino({ level: 'info' });
