import { AnyTRPCRouter } from '@trpc/server';
import { SetOptional } from 'type-fest';
import {
  CustomHandlerOptions,
  TrpcClientOptions,
  createCustomHandler as internalCreateCustomHandler,
  createTrpcClient as internalCreateTrpcClient,
} from './client-base';

export const createCustomHandler = (options: SetOptional<CustomHandlerOptions, 'type'>) =>
  internalCreateCustomHandler({ type: 'content-script', ...options });

export const createTrpcClient = <TRouter extends AnyTRPCRouter>(options: SetOptional<TrpcClientOptions, 'type'>) =>
  internalCreateTrpcClient<TRouter>({ type: 'content-script', ...options });
