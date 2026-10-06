const FORCE_EXIT_MS = 10_000;

export interface ShutdownOptions {
  /** The subset of `http.Server` used here. */
  server: { close(cb: (err?: Error) => void): unknown; closeIdleConnections(): void };
  /** Connections to release once the server stopped accepting requests (pg Pool, Redis). */
  closers: readonly (() => Promise<unknown>)[];
  logger: { info(obj: object, msg: string): void; error(obj: object, msg: string): void };
  exit?: (code: number) => void;
  forceExitMs?: number;
}

/**
 * Stops accepting connections, lets in-flight requests finish, then closes the clients.
 * A timer forces the exit when something hangs; it is unref'd so it never keeps a clean exit alive.
 */
export function createShutdown({
  server,
  closers,
  logger,
  exit = (code) => process.exit(code),
  forceExitMs = FORCE_EXIT_MS,
}: ShutdownOptions): (signal: string) => Promise<void> {
  let running = false;
  return async (signal) => {
    if (running) return;
    running = true;
    logger.info({ signal }, 'shutting down');

    const timer = setTimeout(() => {
      logger.error({ forceExitMs }, 'shutdown timed out, forcing exit');
      exit(1);
    }, forceExitMs);
    timer.unref();

    try {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
        server.closeIdleConnections();
      });
      await Promise.all(closers.map((close) => close()));
      exit(0);
    } catch (err) {
      logger.error({ err }, 'shutdown failed');
      exit(1);
    }
  };
}
