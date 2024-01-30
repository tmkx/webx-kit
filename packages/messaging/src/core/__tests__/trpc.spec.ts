import { setTimeout as sleep } from 'node:timers/promises';
import { createTRPCClient } from '@trpc/client';
import { initTRPC } from '@trpc/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { applyMessagingHandler, messagingLink } from '../trpc';
import { Messaging, fromMessagePort } from '../index';
import { observable } from '@trpc/server/observable';
import { withResolvers } from '../utils';

function expectMessagingIsNotLeaked(messaging: Messaging) {
  // @ts-expect-error
  expect(messaging.ongoingRequestResolvers).toHaveLength(0);
  // @ts-expect-error
  expect(messaging.ongoingStreamObservers).toHaveLength(0);
}

describe('Basic', () => {
  const streamCleanupFn = vi.fn();
  const { port1, port2 } = new MessageChannel();

  // Server
  const t = initTRPC.create();
  const appRouter = t.router({
    getUser: t.procedure.input(z.object({ id: z.number() })).query(({ input }) => {
      return { id: input.id, name: 'Tmk' };
    }),

    queryFail: t.procedure.query(() => {
      throw new Error('Internal Error');
    }),

    createUser: t.procedure.input(z.object({ id: z.number() })).mutation(({ input }) => {
      return { id: input.id, name: 'Tmk' };
    }),

    mutationFail: t.procedure.mutation(() => {
      throw new Error('Internal Error');
    }),

    streamBasic: t.procedure.subscription(() => {
      return observable<number>((observer) => {
        observer.next(1);
        observer.next(2);
        observer.next(3);
        observer.complete();
      });
    }),

    streamError: t.procedure.subscription(() => {
      return observable<number>((observer) => {
        observer.next(1);
        observer.error(new Error('Internal Error'));
      });
    }),

    streamInterval: t.procedure
      .input(z.object({ from: z.number(), interval: z.number() }))
      .subscription(({ input }) => {
        return observable<number>((observer) => {
          let i = input.from;
          const timer = setInterval(() => observer.next(i++), input.interval);
          return () => {
            streamCleanupFn();
            clearInterval(timer);
          };
        });
      }),
  });
  const server = applyMessagingHandler({ port: fromMessagePort(port1), router: appRouter });

  // Client
  const link = messagingLink({ port: fromMessagePort(port2) });
  const client = createTRPCClient<typeof appRouter>({
    links: [link],
  });

  afterEach(() => {
    expectMessagingIsNotLeaked(server);
    expectMessagingIsNotLeaked(link.messaging);
  });

  it('should support query', async () => {
    const user = await client.getUser.query({ id: 666 });
    expect(user).toEqual({ id: 666, name: 'Tmk' });
  });

  it('should support query input validation', async () => {
    // @ts-expect-error
    await expect(client.getUser.query({ id: '666' })).rejects.toThrowErrorMatchingInlineSnapshot(`
      [TRPCClientError: [
        {
          "code": "invalid_type",
          "expected": "number",
          "received": "string",
          "path": [
            "id"
          ],
          "message": "Expected number, received string"
        }
      ]]
    `);
  });

  it('should support query internal error', async () => {
    await expect(client.queryFail.query()).rejects.toThrowErrorMatchingInlineSnapshot(
      `[TRPCClientError: Internal Error]`
    );
  });

  it('should support mutation', async () => {
    const user = await client.createUser.mutate({ id: 666 });
    expect(user).toEqual({ id: 666, name: 'Tmk' });
  });

  it('should support mutation input validation', async () => {
    // @ts-expect-error
    await expect(client.createUser.mutate({ id: '666' })).rejects.toThrowErrorMatchingInlineSnapshot(`
      [TRPCClientError: [
        {
          "code": "invalid_type",
          "expected": "number",
          "received": "string",
          "path": [
            "id"
          ],
          "message": "Expected number, received string"
        }
      ]]
    `);
  });

  it('should support mutation internal error', async () => {
    await expect(client.mutationFail.mutate()).rejects.toThrowErrorMatchingInlineSnapshot(
      `[TRPCClientError: Internal Error]`
    );
  });

  it('should support stream', async () => {
    const onStartedFn = vi.fn();
    const onDataFn = vi.fn();
    const onErrorFn = vi.fn();
    const onStoppedFn = vi.fn();
    const { promise, resolve } = withResolvers<void>();
    client.streamBasic.subscribe(undefined, {
      onStarted: onStartedFn,
      onComplete: resolve,
      onData: onDataFn,
      onError: onErrorFn,
      onStopped: onStoppedFn,
    });
    await promise;
    expect(onStartedFn).toBeCalledTimes(1);
    expect(onDataFn.mock.calls).toEqual([[1], [2], [3]]);
    expect(onErrorFn).not.toBeCalled();
    expect(onStoppedFn).toBeCalledTimes(1);
  });

  it('should support stream internal error', async () => {
    const onStartedFn = vi.fn();
    const onCompleteFn = vi.fn();
    const onDataFn = vi.fn();
    const onStoppedFn = vi.fn();
    const { promise, reject } = withResolvers();
    client.streamError.subscribe(undefined, {
      onStarted: onStartedFn,
      onComplete: onCompleteFn,
      onData: onDataFn,
      onError: reject,
      onStopped: onStoppedFn,
    });
    await expect(promise).rejects.toThrow('Internal Error');
    expect(onStartedFn).toBeCalledTimes(1);
    expect(onDataFn.mock.calls).toEqual([[1]]);
    expect(onCompleteFn).not.toBeCalled();
    expect(onStoppedFn).not.toBeCalled();
    await sleep();
  });

  it('should support unsubscribe stream', async () => {
    const onStartedFn = vi.fn();
    const onCompleteFn = vi.fn();
    const onDataFn = vi.fn();
    const onErrorFn = vi.fn();
    const onStoppedFn = vi.fn();
    const unsubscribeResolver = withResolvers<void>();
    const unsubscribe = client.streamInterval.subscribe(
      { from: 666, interval: 10 },
      {
        onStarted: onStartedFn,
        onComplete: onCompleteFn,
        onData(value) {
          onDataFn(value);
          if (onDataFn.mock.calls.length === 2) {
            unsubscribe.unsubscribe();
            unsubscribeResolver.resolve();
          }
        },
        onError: onErrorFn,
        onStopped: onStoppedFn,
      }
    );
    await unsubscribeResolver.promise;
    expect(streamCleanupFn).not.toBeCalled();
    await sleep();
    expect(onStartedFn).toBeCalledTimes(1);
    expect(onCompleteFn).not.toBeCalled();
    expect(onDataFn.mock.calls).toEqual([[666], [667]]);
    expect(onErrorFn).not.toBeCalled();
    expect(onStoppedFn).not.toBeCalled();
    expect(streamCleanupFn).toBeCalledTimes(1);
    await sleep();
  });
});
