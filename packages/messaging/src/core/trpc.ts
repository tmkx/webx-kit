import {
  AnyRouter,
  TRPCError,
  callProcedure,
  getErrorShape,
  getTRPCErrorFromUnknown,
  transformTRPCResponse,
} from '@trpc/server';
import { TRPCResponseMessage, transformResult } from '@trpc/server/unstable-core-do-not-import';
import { isObservable, observable } from '@trpc/server/observable';
import { Port, createMessaging } from './index';
import { Operation, TRPCClientError, TRPCLink } from '@trpc/client';

export interface MessagingHandlerOptions<TRouter extends AnyRouter> {
  port: Port;
  router: TRouter;
}

export function applyMessagingHandler<TRouter extends AnyRouter>(options: MessagingHandlerOptions<TRouter>) {
  const { port, router } = options;
  const { procedures, _config: rootConfig } = router._def;

  const server = createMessaging(port, {
    async onRequest(message) {
      const { type, path, input, context: ctx } = message as Operation<unknown>;
      try {
        const result = await callProcedure({ procedures, path, getRawInput: () => Promise.resolve(input), ctx, type });
        return transformTRPCResponse(rootConfig, { result: { data: result } });
      } catch (cause) {
        const error = getTRPCErrorFromUnknown(cause);
        return transformTRPCResponse(rootConfig, {
          error: getErrorShape({ config: rootConfig, error, type, path, input, ctx }),
        });
      }
    },
    async onStream(message, subscriber) {
      const { type, path, input, context: ctx } = message as Operation<unknown>;

      try {
        const result = await callProcedure({ procedures, path, getRawInput: () => Promise.resolve(input), ctx, type });

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

export interface MessagingLinkOptions<TRouter extends AnyRouter> {
  port: Port;
}

export function messagingLink<TRouter extends AnyRouter>(options: MessagingLinkOptions<TRouter>): TRPCLink<TRouter> {
  const { port } = options;
  const client = createMessaging(port);
  const link: TRPCLink<TRouter> = (runtime) => {
    return ({ op }) => {
      const { type, path, id, context } = op;
      const input = runtime.transformer.serialize(op.input);

      if (op.type !== 'subscription') {
        return observable((observer) => {
          client
            .request({ type, path, input, id, context })
            .then((response) => {
              const transformed = transformResult(response as any, runtime.transformer);

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
        const unsub = client.stream(
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
              const transformed = transformResult(message, runtime.transformer);

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

  if (process.env.NODE_ENV === 'test') {
    // @ts-expect-error
    link.client = client;
  }

  return link;
}
