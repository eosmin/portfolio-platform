import { getTableConfig, type PgTable } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';
import * as schema from '../../src/db/schema/index.js';

const tables: Record<string, PgTable> = {
  projects: schema.projects,
  blog_posts: schema.blogPosts,
  skills: schema.skills,
  languages: schema.languages,
  certifications: schema.certifications,
  experience_items: schema.experienceItems,
  profile_details: schema.profileDetails,
  social_links: schema.socialLinks,
  contact_messages: schema.contactMessages,
  page_views: schema.pageViews,
  admin_users: schema.adminUsers,
};

function indexedColumns(table: PgTable): string[][] {
  return getTableConfig(table).indexes.map((i) =>
    i.config.columns.map((c) => ('name' in c ? (c.name ?? '') : '')),
  );
}

describe('db schema', () => {
  it('exposes every table of TDD §10 under its snake_case plural name', () => {
    for (const [name, table] of Object.entries(tables)) {
      expect(getTableConfig(table).name).toBe(name);
    }
  });

  it('uses uuid primary keys', () => {
    for (const table of Object.values(tables)) {
      const idColumn = getTableConfig(table).columns.find((c) => c.name === 'id');
      expect(idColumn?.primary).toBe(true);
      expect(idColumn?.getSQLType()).toBe('uuid');
    }
  });

  it('declares the documented indexes', () => {
    expect(indexedColumns(schema.projects)).toEqual([['featured', 'published_at']]);
    expect(indexedColumns(schema.blogPosts)).toEqual([['published_at']]);
    expect(indexedColumns(schema.certifications)).toEqual([['order', 'issued_at']]);
    expect(indexedColumns(schema.pageViews)).toEqual([['page', 'viewed_at']]);
    expect(indexedColumns(schema.contactMessages)).toEqual([['created_at']]);
  });

  it('adds no index on a UNIQUE column', () => {
    for (const table of Object.values(tables)) {
      const config = getTableConfig(table);
      const uniqueCols = config.columns.filter((c) => c.isUnique).map((c) => c.name);
      const indexed = indexedColumns(table).flat();
      for (const col of uniqueCols) expect(indexed).not.toContain(col);
    }
  });

  it('enforces the documented constraints', () => {
    expect(getTableConfig(schema.projects).columns.find((c) => c.name === 'slug')?.isUnique).toBe(
      true,
    );
    expect(getTableConfig(schema.blogPosts).columns.find((c) => c.name === 'slug')?.isUnique).toBe(
      true,
    );
    expect(
      getTableConfig(schema.adminUsers).columns.find((c) => c.name === 'email')?.isUnique,
    ).toBe(true);
    expect(getTableConfig(schema.profileDetails).uniqueConstraints.map((u) => u.name)).toEqual([
      'profile_details_group_key_unique',
    ]);
    expect(getTableConfig(schema.skills).checks.map((c) => c.name)).toEqual([
      'skills_proficiency_range',
    ]);
    expect(getTableConfig(schema.certifications).checks.map((c) => c.name)).toEqual([
      'certifications_expires_after_issued',
    ]);
  });

  it('keeps certification issuer free text (no enum)', () => {
    const issuer = getTableConfig(schema.certifications).columns.find((c) => c.name === 'issuer');
    expect(issuer?.getSQLType()).toBe('text');
  });

  it('derives enums from the shared constants', () => {
    expect(schema.cefrLevel.enumValues).toEqual(['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'NATIVE']);
    expect(schema.socialPlatform.enumValues).toContain('GITHUB');
  });
});
