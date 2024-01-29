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

  const server = createMessaging(port, {
    async onStream(message, subscriber) {
      const { type, path, input, context: ctx } = message as Operation<unknown>;

      try {
        const result = await callProcedure({
          procedures: router._def.procedures,
          path,
          getRawInput: async () => input,
          ctx,
          type,
        });

        if (type === 'subscription') {
          if (!isObservable(result)) {
            throw new TRPCError({
              message: `Subscription ${path} did not return an observable`,
              code: 'INTERNAL_SERVER_ERROR',
            });
          }
        } else {
          subscriber.next(
            transformTRPCResponse(router._def._config, {
              result: { data: result },
            })
          );
          subscriber.complete();
          return;
        }

        subscriber.next(
          transformTRPCResponse(router._def._config, {
            result: { type: 'started' },
          } as TRPCResponseMessage)
        );

        const observable = result;
        const sub = observable.subscribe({
          next(data) {
            subscriber.next(
              transformTRPCResponse(router._def._config, {
                result: { data },
              })
            );
          },
          error(err) {
            const error = getTRPCErrorFromUnknown(err);
            subscriber.next(
              transformTRPCResponse(router._def._config, {
                error: getErrorShape({
                  config: router._def._config,
                  error,
                  type,
                  path,
                  input,
                  ctx,
                }),
              })
            );
          },
          complete() {
            subscriber.next(
              transformTRPCResponse(router._def._config, {
                result: { type: 'stopped' },
              } as TRPCResponseMessage)
            );
            subscriber.complete();
          },
        });

        return sub.unsubscribe;
      } catch (cause) {
        const error = getTRPCErrorFromUnknown(cause);
        subscriber.error(
          transformTRPCResponse(router._def._config, {
            error: getErrorShape({
              config: router._def._config,
              error,
              type,
              path,
              input,
              ctx,
            }),
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
  return (runtime) => {
    return ({ op }) => {
      return observable((observer) => {
        const { type, path, id, context } = op;

        const input = runtime.transformer.serialize(op.input);

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

              if (op.type !== 'subscription') {
                // if it isn't a subscription we don't care about next response
                unsub();
                observer.complete();
              }
            },
          }
        );
        return () => {
          unsub();
        };
      });
    };
  };
}
