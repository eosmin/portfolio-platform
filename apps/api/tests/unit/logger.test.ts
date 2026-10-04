import { Writable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { createLogger, devTransport } from '../../src/config/logger.js';

function capture(): { lines: string[]; stream: Writable } {
  const lines: string[] = [];
  const stream = new Writable({
    write(chunk: Buffer, _encoding, done): void {
      lines.push(chunk.toString());
      done();
    },
  });
  return { lines, stream };
}

describe('createLogger', () => {
  it('redacts authorization headers', () => {
    const { lines, stream } = capture();
    const log = createLogger('info', stream);
    log.info({ req: { headers: { authorization: 'Bearer secret-token' } } }, 'request');
    log.info({ headers: { authorization: 'Bearer secret-token' } }, 'headers');
    log.info({ authorization: 'Bearer secret-token' }, 'top-level');
    const output = lines.join('');
    expect(output).not.toContain('secret-token');
    expect(output).toContain('[Redacted]');
  });

  it('writes the level as a label outside development', () => {
    const { lines, stream } = capture();
    createLogger('info', stream).info('hello');
    expect(JSON.parse(lines.join('')) as unknown).toMatchObject({ level: 'info', msg: 'hello' });
  });

  it('uses pino-pretty only in development', () => {
    expect(devTransport('development')).toMatchObject({ target: 'pino-pretty' });
    expect(devTransport('test')).toBeUndefined();
    expect(devTransport('production')).toBeUndefined();
  });

  it('keeps JSON output with an explicit destination even in development', () => {
    const { lines, stream } = capture();
    createLogger('info', stream, 'development').info('plain');
    expect(JSON.parse(lines.join('')) as { msg: string }).toMatchObject({ msg: 'plain' });
  });

  it('respects the level', () => {
    const { lines, stream } = capture();
    createLogger('warn', stream).info('hidden');
    expect(lines).toHaveLength(0);
  });
});
