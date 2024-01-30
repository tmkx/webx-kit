import { SetOptional } from 'type-fest';
import { CustomHandlerOptions, createCustomHandler as internalCreateCustomHandler } from './client-base';

export const createCustomHandler = (options: SetOptional<CustomHandlerOptions, 'type'>) =>
  internalCreateCustomHandler({ type: 'popup', ...options });
