import { describe, expect, it } from 'vitest';
import { canOptimizeImage, parseImageHosts, remotePatternsFor } from '../lib/image-hosts';

describe('parseImageHosts', () => {
  it('splits, trims, lowercases and drops empties', () => {
    expect(parseImageHosts(' Cdn.Example.com,images.example.org ,, ')).toEqual([
      'cdn.example.com',
      'images.example.org',
    ]);
  });

  it('is empty when unset', () => {
    expect(parseImageHosts(undefined)).toEqual([]);
    expect(parseImageHosts('')).toEqual([]);
  });

  it.each([
    'https://a.com',
    'a.com/path',
    'a.com:3000',
    'a b.com',
    '*.a.com',
    'a..com',
    '-a.com',
    'a-.com',
    '.a.com',
    'a.com.',
  ])('rejects %j, which is not a bare hostname', (entry) => {
    expect(() => parseImageHosts(entry)).toThrow(/IMAGE_HOSTS/);
  });
});

describe('remotePatternsFor', () => {
  it('allows https only', () => {
    expect(remotePatternsFor(['a.com'])).toEqual([{ protocol: 'https', hostname: 'a.com' }]);
  });
});

describe('canOptimizeImage', () => {
  const hosts = ['images.example.com'];

  it('accepts a site-relative path', () => {
    expect(canOptimizeImage('/images/me.png', [])).toBe(true);
  });

  it.each(['/\\evil.com/a.png', '/\\\\evil.com', '//evil.com/a.png', '/a b.png', '/a\\b.png'])(
    'rejects %j, which a browser may read as another host',
    (src) => {
      expect(canOptimizeImage(src, ['evil.com'])).toBe(false);
    },
  );

  it('accepts https on an allow-listed host, ignoring case', () => {
    expect(canOptimizeImage('https://images.example.com/a.png', hosts)).toBe(true);
    expect(canOptimizeImage('https://IMAGES.example.com/a.png', hosts)).toBe(true);
  });

  it.each([
    ['an unknown host', 'https://evil.example.net/a.png'],
    ['plain http', 'http://images.example.com/a.png'],
    ['a protocol-relative URL', '//images.example.com/a.png'],
    ['garbage', 'not a url'],
    ['an empty string', ''],
    ['a lookalike host', 'https://images.example.com.evil.net/a.png'],
  ])('rejects %s', (_label, src) => {
    expect(canOptimizeImage(src, hosts)).toBe(false);
  });
});
