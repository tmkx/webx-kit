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
  isAsyncIterable,
  iteratorResource,
  run,
  transformResult,
} from '@trpc/server/unstable-core-do-not-import';
import { isObservable, observable, observableToAsyncIterable } from '@trpc/server/observable';
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
      const { type, path, input, context: ctx } = message as Operation<unknown>;
      const ac = new AbortController();
      const signal = ac.signal;

      try {
        const result = await callTRPCProcedure({
          router,
          path,
          getRawInput: () => Promise.resolve(input),
          ctx: createContext ? { ...ctx, ...(await createContext(context)) } : ctx,
          type,
          signal,
        });

        const isIterableResult = isAsyncIterable(result) || isObservable(result);

        if (!isIterableResult) {
          throw new TRPCError({
            message: `Subscription ${path} did not return an observable or a AsyncGenerator`,
            code: 'INTERNAL_SERVER_ERROR',
          });
        }

        const iterable = isObservable(result)
          ? observableToAsyncIterable(result, signal || new AbortController().signal)
          : result;

        const abortPromise = new Promise<'abort'>((resolve) => {
          signal.addEventListener('abort', () => resolve('abort'));
        });

        const iterator = iteratorResource(iterable);

        subscriber.next(transformTRPCResponse(rootConfig, { result: { type: 'started' } } as TRPCResponseMessage));

        run(async () => {
          while (true) {
            const next = await Promise.race([iterator.next().catch(getTRPCErrorFromUnknown), abortPromise]);

            if (next === 'abort') {
              await iterator.return?.();
              break;
            }

            if (next instanceof Error) {
              const error = getTRPCErrorFromUnknown(next);
              subscriber.next(
                transformTRPCResponse(rootConfig, {
                  error: getErrorShape({ config: rootConfig, error, type, path, input, ctx }),
                })
              );
              subscriber.complete();
              break;
            }

            if (next.done) {
              subscriber.next(
                transformTRPCResponse(rootConfig, { result: { type: 'stopped' } } as TRPCResponseMessage)
              );
              subscriber.complete();
              break;
            }

            subscriber.next(transformTRPCResponse(rootConfig, { result: { data: next.value } }));
          }
        }).catch((err) => {
          const error = getTRPCErrorFromUnknown(err);
          subscriber.next(
            transformTRPCResponse(rootConfig, {
              error: getErrorShape({ config: rootConfig, error, type, path, input, ctx }),
            })
          );
          subscriber.complete();
        });
      } catch (cause) {
        const error = getTRPCErrorFromUnknown(cause);
        subscriber.error(
          transformTRPCResponse(rootConfig, {
            error: getErrorShape({ config: rootConfig, error, type, path, input, ctx }),
          })
        );
      }

      return ac.abort.bind(ac);
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
