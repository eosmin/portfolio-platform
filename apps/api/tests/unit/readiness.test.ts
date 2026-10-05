import { describe, expect, it, vi } from 'vitest';
import { createReadinessCheck } from '../../src/lib/readiness.js';

describe('createReadinessCheck', () => {
  it('resolves when Postgres and Redis answer', async () => {
    const pool = { query: vi.fn().mockResolvedValue({}) };
    const redis = { ping: vi.fn().mockResolvedValue('PONG') };
    await expect(createReadinessCheck({ pool, redis })()).resolves.toBeUndefined();
    expect(pool.query).toHaveBeenCalledWith('SELECT 1');
  });

  it('rejects when either dependency fails', async () => {
    const ok = { query: vi.fn().mockResolvedValue({}) };
    const bad = { ping: vi.fn().mockRejectedValue(new Error('redis down')) };
    await expect(createReadinessCheck({ pool: ok, redis: bad })()).rejects.toThrow('redis down');
  });

  it('rejects when a dependency hangs past the timeout', async () => {
    vi.useFakeTimers();
    const hang = { query: vi.fn(() => new Promise(() => undefined)) };
    const redis = { ping: vi.fn().mockResolvedValue('PONG') };
    const result = createReadinessCheck({ pool: hang, redis })();
    const assertion = expect(result).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(2100);
    await assertion;
    vi.useRealTimers();
  });

  it('shares one probe within a second, then probes again', async () => {
    vi.useFakeTimers();
    const pool = { query: vi.fn().mockResolvedValue({}) };
    const redis = { ping: vi.fn().mockResolvedValue('PONG') };
    const check = createReadinessCheck({ pool, redis });

    await Promise.all([check(), check(), check()]);
    await check();
    expect(pool.query).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1000);
    await check();
    expect(pool.query).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('shares a failure too, so a down dependency is not hammered', async () => {
    const pool = { query: vi.fn().mockRejectedValue(new Error('db down')) };
    const redis = { ping: vi.fn().mockResolvedValue('PONG') };
    const check = createReadinessCheck({ pool, redis });
    await expect(check()).rejects.toThrow('db down');
    await expect(check()).rejects.toThrow('db down');
    expect(pool.query).toHaveBeenCalledTimes(1);
  });
});
