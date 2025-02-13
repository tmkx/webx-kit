import {
  AnyTRPCRouter,
  TRPCError,
  callTRPCProcedure,
  getTRPCErrorFromUnknown,
  transformTRPCResponse,
} from '@trpc/server';
import {
  MaybePromise,
  TRPCResponseMessage,
  getErrorShape,
  inferClientTypes,
  inferRouterContext,
  transformResult,
} from '@trpc/server/unstable-core-do-not-import';
import { isObservable, observable } from '@trpc/server/observable';
import { Operation, TRPCClientError, TRPCLink } from '@trpc/client';
import { TransformerOptions, getTransformer } from '@trpc/client/unstable-internals';
import { Messaging, OriginMessage, Port, createMessaging } from './index';

export type CreateContextFnOptions = {
  originMessage: OriginMessage;
};

export interface MessagingHandlerOptions<TRouter extends AnyTRPCRouter> {
  port: Port;
  router: TRouter;
  intercept?(data: unknown, abort: symbol): unknown | symbol;
  createContext?(opts: CreateContextFnOptions): MaybePromise<inferRouterContext<TRouter>>;
}

export function applyMessagingHandler<TRouter extends AnyTRPCRouter>(options: MessagingHandlerOptions<TRouter>) {
  const { port, router, intercept, createContext } = options;
  const { _config: rootConfig } = router._def;

  const server = createMessaging(port, {
    intercept,
    async onRequest(message, context) {
      const { type, path, input, context: ctx, signal } = message as Operation<unknown>;
      try {
        const result = await callTRPCProcedure({
          router,
          path,
          getRawInput: () => Promise.resolve(input),
          ctx: createContext ? { ...ctx, ...(await createContext(context)) } : ctx,
          type,
          signal: signal || undefined,
        });
        return transformTRPCResponse(rootConfig, { result: { data: result } });
      } catch (cause) {
        const error = getTRPCErrorFromUnknown(cause);
        return transformTRPCResponse(rootConfig, {
          error: getErrorShape({ config: rootConfig, error, type, path, input, ctx }),
        });
      }
    },
    async onStream(message, subscriber, context) {
      const { type, path, input, context: ctx, signal } = message as Operation<unknown>;

      try {
        const result = await callTRPCProcedure({
          router,
          path,
          getRawInput: () => Promise.resolve(input),
          ctx: createContext ? { ...ctx, ...(await createContext(context)) } : ctx,
          type,
          signal: signal || new AbortController().signal,
        });

        if (!isObservable(result)) {
          throw new TRPCError({
            message: `Subscription ${path} did not return an observable`,
            code: 'INTERNAL_SERVER_ERROR',
          });
        }

        subscriber.next(transformTRPCResponse(rootConfig, { result: { type: 'started' } } as TRPCResponseMessage));

        const observable = result;
        const sub = observable.subscribe({
          next(data) {
            subscriber.next(transformTRPCResponse(rootConfig, { result: { data } }));
          },
          error(err) {
            const error = getTRPCErrorFromUnknown(err);
            subscriber.next(
              transformTRPCResponse(rootConfig, {
                error: getErrorShape({ config: rootConfig, error, type, path, input, ctx }),
              })
            );
            subscriber.complete();
          },
          complete() {
            subscriber.next(transformTRPCResponse(rootConfig, { result: { type: 'stopped' } } as TRPCResponseMessage));
            subscriber.complete();
          },
        });

        return sub.unsubscribe;
      } catch (cause) {
        const error = getTRPCErrorFromUnknown(cause);
        subscriber.error(
          transformTRPCResponse(rootConfig, {
            error: getErrorShape({ config: rootConfig, error, type, path, input, ctx }),
          })
        );
      }
    },
  });

  return server;
}

export interface MessagingLinkOptions<TRouter extends AnyTRPCRouter> {
  messaging: Messaging;
}

export function messagingLink<TRouter extends AnyTRPCRouter>(
  options: MessagingLinkOptions<TRouter> & TransformerOptions<inferClientTypes<TRouter>>
): TRPCLink<TRouter> {
  const { messaging } = options;
  const transformer = getTransformer(options.transformer);
  return () => {
    return ({ op }) => {
      const { type, path, id, context } = op;
      const input = transformer.input.serialize(op.input);

      if (op.type !== 'subscription') {
        return observable((observer) => {
          messaging
            .request({ type, path, input, id, context })
            .then((response) => {
              const transformed = transformResult(response as any, transformer.output);

              if (!transformed.ok) {
                observer.error(TRPCClientError.from(transformed.error));
                return;
              }
              observer.next({ result: transformed.result });
              observer.complete();
            })
            .catch((err) => {
              observer.error(err as TRPCClientError<any>);
            });
        });
      }

      return observable((observer) => {
        const unsub = messaging.stream(
          { type, path, input, id, context },
          {
            error(err) {
              observer.error(err as TRPCClientError<any>);
              unsub();
            },
            complete() {
              observer.complete();
            },
            next(message) {
              const transformed = transformResult(message, transformer.output);

              if (!transformed.ok) {
                observer.error(TRPCClientError.from(transformed.error));
                return;
              }
              observer.next({
                result: transformed.result,
              });
            },
          }
        );
        return unsub;
      });
    };
  };
}
