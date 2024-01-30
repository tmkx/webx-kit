import { AnyTRPCRouter } from '@trpc/server';
import { SetOptional } from 'type-fest';
import {
  CustomHandlerOptions,
  TrpcHandlerOptions,
  createCustomHandler as internalCreateCustomHandler,
  createTrpcHandler as internalCreateTrpcHandler,
} from './client-base';

export const createCustomHandler = (options: SetOptional<CustomHandlerOptions, 'type'>) =>
  internalCreateCustomHandler({ type: 'content-script', ...options });

export const createTrpcHandler = <TRouter extends AnyTRPCRouter>(options: SetOptional<TrpcHandlerOptions, 'type'>) =>
  internalCreateTrpcHandler<TRouter>({ type: 'content-script', ...options });
