import { describe, expect, it, vi, type Mock } from 'vitest';
import type { RedisStatus } from 'ioredis';
import { closeRedis } from '../../src/lib/redis.js';

function client(status: RedisStatus): {
  status: RedisStatus;
  quit: Mock<() => Promise<'OK'>>;
  disconnect: Mock<() => void>;
} {
  return {
    status,
    quit: vi.fn<() => Promise<'OK'>>().mockResolvedValue('OK'),
    disconnect: vi.fn<() => void>(),
  };
}

describe('closeRedis', () => {
  it('quits gracefully when the connection is ready', async () => {
    const redis = client('ready');
    await closeRedis(redis);
    expect(redis.quit).toHaveBeenCalledOnce();
    expect(redis.disconnect).not.toHaveBeenCalled();
  });

  it.each<RedisStatus>(['wait', 'connecting', 'reconnecting', 'end'])(
    'disconnects without waiting when the status is %s',
    async (status) => {
      const redis = client(status);
      await closeRedis(redis);
      expect(redis.disconnect).toHaveBeenCalledOnce();
      expect(redis.quit).not.toHaveBeenCalled();
    },
  );
});
