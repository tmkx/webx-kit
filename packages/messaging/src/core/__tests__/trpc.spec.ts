import { createTRPCClient } from '@trpc/client';
import { initTRPC } from '@trpc/server';
import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { applyMessagingHandler, messagingLink } from '../trpc';
import { Messaging, fromMessagePort } from '../index';

function expectMessagingIsNotLeaked(messaging: Messaging) {
  // @ts-expect-error
  expect(messaging.ongoingRequestResolvers).toHaveLength(0);
  // @ts-expect-error
  expect(messaging.ongoingStreamObservers).toHaveLength(0);
}

describe('Basic', () => {
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
  });
  const server = applyMessagingHandler({ port: fromMessagePort(port1), router: appRouter });

  // Client
  const client = createTRPCClient<typeof appRouter>({
    links: [messagingLink({ port: fromMessagePort(port2) })],
  });

  afterEach(() => {
    expectMessagingIsNotLeaked(server);
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
});
