import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import * as schemas from '../src/schemas/index.js';

describe('schema registry ids', () => {
  it('gives every exported entity schema a unique meta id', () => {
    const ids = (Object.values(schemas) as unknown[])
      .filter((v: unknown): v is z.ZodType => v instanceof z.ZodType)
      .map((s) => z.globalRegistry.get(s)?.id)
      .filter((id): id is string => typeof id === 'string');
    expect(ids.length).toBeGreaterThan(20);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('certification and project carry their documented ids', () => {
    expect(z.globalRegistry.get(schemas.certificationSchema)?.id).toBe('Certification');
    expect(z.globalRegistry.get(schemas.projectSchema)?.id).toBe('Project');
  });
});
