import { logger } from 'firebase-functions';

export const start = (): void => {
  logger.log('...');
};

export { logger } from 'firebase-functions';
