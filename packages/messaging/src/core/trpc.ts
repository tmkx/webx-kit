import {
  AnyTRPCRouter,
  TRPCError,
  callTRPCProcedure,
  getErrorShape,
  getTRPCErrorFromUnknown,
  transformTRPCResponse,
} from '@trpc/server';
import { TRPCResponseMessage, transformResult } from '@trpc/server/unstable-core-do-not-import';
import { isObservable, observable } from '@trpc/server/observable';
import { Operation, TRPCClientError, TRPCLink } from '@trpc/client';
import { CreateMessagingOptions, Messaging, Port, createMessaging } from './index';

export interface MessagingHandlerOptions<TRouter extends AnyTRPCRouter> {
  port: Port;
  router: TRouter;
  intercept?(data: unknown, abort: symbol): unknown | symbol;
}

export function applyMessagingHandler<TRouter extends AnyTRPCRouter>(options: MessagingHandlerOptions<TRouter>) {
  const { port, router, intercept } = options;
  const { procedures, _config: rootConfig } = router._def;

  const server = createMessaging(port, {
    intercept,
    async onRequest(message) {
      const { type, path, input, context: ctx } = message as Operation<unknown>;
      try {
        const result = await callTRPCProcedure({
          procedures,
          path,
          getRawInput: () => Promise.resolve(input),
          ctx,
          type,
        });
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
        const result = await callTRPCProcedure({
          procedures,
          path,
          getRawInput: () => Promise.resolve(input),
          ctx,
          type,
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
  options: MessagingLinkOptions<TRouter>
): TRPCLink<TRouter> {
  const { messaging } = options;

  return (runtime) => {
    return ({ op }) => {
      const { type, path, id, context } = op;
      const input = runtime.transformer.serialize(op.input);

      if (op.type !== 'subscription') {
        return observable((observer) => {
          messaging
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
}
