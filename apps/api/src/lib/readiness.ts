const READINESS_TIMEOUT_MS = 2000;
// /readyz is public: within this window every caller shares one probe (success or failure).
const RESULT_TTL_MS = 1000;

/** The subsets of `pg.Pool` and ioredis used by the readiness probe. */
export interface ReadinessProbes {
  pool: { query(sql: string): Promise<unknown> };
  redis: { ping(): Promise<unknown> };
}

/** Pings Postgres and Redis; a dependency that does not answer in time counts as down. */
export function createReadinessCheck({ pool, redis }: ReadinessProbes): () => Promise<void> {
  const probe = async (): Promise<void> => {
    const timeout = AbortSignal.timeout(READINESS_TIMEOUT_MS);
    const expired = new Promise<never>((_resolve, reject) => {
      timeout.addEventListener('abort', () => {
        reject(new Error('readiness check timed out'));
      });
    });
    await Promise.race([Promise.all([pool.query('SELECT 1'), redis.ping()]), expired]);
  };

  let last: { startedAt: number; result: Promise<void> } | undefined;
  return () => {
    const now = Date.now();
    if (last === undefined || now - last.startedAt >= RESULT_TTL_MS) {
      last = { startedAt: now, result: probe() };
    }
    return last.result;
  };
}
