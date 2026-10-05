import { describe, expect, it, vi, type Mock } from 'vitest';
import { createShutdown } from '../../src/lib/shutdown.js';

const logger = { info: vi.fn(), error: vi.fn() };

type CloseCallback = (err?: Error) => void;

function fakeServer(closeError?: Error): {
  close: Mock<(cb: CloseCallback) => void>;
  closeIdleConnections: Mock<() => void>;
} {
  return {
    close: vi.fn<(cb: CloseCallback) => void>((cb) => {
      cb(closeError);
    }),
    closeIdleConnections: vi.fn<() => void>(),
  };
}

describe('createShutdown', () => {
  it('closes the server first, then every client, then exits 0', async () => {
    const order: string[] = [];
    const server = fakeServer();
    server.close.mockImplementation((cb) => {
      order.push('server');
      cb();
    });
    const exit = vi.fn();
    const shutdown = createShutdown({
      server,
      closers: [
        () => Promise.resolve(order.push('pool')),
        () => Promise.resolve(order.push('redis')),
      ],
      logger,
      exit,
    });

    await shutdown('SIGTERM');

    expect(order).toEqual(['server', 'pool', 'redis']);
    expect(server.closeIdleConnections).toHaveBeenCalledOnce();
    expect(exit).toHaveBeenCalledExactlyOnceWith(0);
  });

  it('runs once even when the signal arrives twice', async () => {
    const server = fakeServer();
    const shutdown = createShutdown({ server, closers: [], logger, exit: vi.fn() });
    await shutdown('SIGTERM');
    await shutdown('SIGINT');
    expect(server.close).toHaveBeenCalledOnce();
  });

  it('exits 1 when closing fails', async () => {
    const exit = vi.fn();
    const shutdown = createShutdown({
      server: fakeServer(new Error('boom')),
      closers: [],
      logger,
      exit,
    });
    await shutdown('SIGTERM');
    expect(exit).toHaveBeenCalledExactlyOnceWith(1);
  });

  it('forces exit 1 when a client never closes', async () => {
    vi.useFakeTimers();
    const exit = vi.fn();
    const shutdown = createShutdown({
      server: fakeServer(),
      closers: [() => new Promise(() => undefined)],
      logger,
      exit,
      forceExitMs: 50,
    });
    void shutdown('SIGTERM');
    await vi.advanceTimersByTimeAsync(60);
    expect(exit).toHaveBeenCalledExactlyOnceWith(1);
    vi.useRealTimers();
  });
});
