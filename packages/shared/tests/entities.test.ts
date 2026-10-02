import { describe, expect, it } from 'vitest';
import {
  blogPostInputSchema,
  blogPostSchema,
  blogPostUpdateSchema,
  certificationInputSchema,
  certificationSchema,
  certificationUpdateSchema,
  experienceItemInputSchema,
  experienceItemSchema,
  experienceItemUpdateSchema,
  languageInputSchema,
  languageSchema,
  languageUpdateSchema,
  profileDetailInputSchema,
  profileDetailSchema,
  profileDetailUpdateSchema,
  projectInputSchema,
  projectSchema,
  projectUpdateSchema,
  skillInputSchema,
  skillSchema,
  skillUpdateSchema,
  socialLinkInputSchema,
  socialLinkSchema,
  socialLinkUpdateSchema,
} from '../src/index.js';
import * as f from './fixtures.js';

describe('projectSchema', () => {
  it('accepts a valid project', () => {
    expect(projectSchema.safeParse(f.project).success).toBe(true);
  });
  it('rejects a bad slug, a non-http url and a missing id', () => {
    expect(projectSchema.safeParse({ ...f.project, slug: 'Bad Slug' }).success).toBe(false);
    expect(projectSchema.safeParse({ ...f.project, repoUrl: 'javascript:alert(1)' }).success).toBe(
      false,
    );
    expect(projectSchema.safeParse({ ...f.project, id: undefined }).success).toBe(false);
  });
  it('derives input (no id/timestamps) and partial update schemas', () => {
    const input = f.without(f.project, 'id', 'createdAt', 'updatedAt');
    expect(projectInputSchema.safeParse(input).success).toBe(true);
    expect(projectInputSchema.safeParse({ ...input, title: '' }).success).toBe(false);
    expect(projectUpdateSchema.safeParse({ featured: false }).success).toBe(true);
    expect(projectUpdateSchema.safeParse({ featured: 'no' }).success).toBe(false);
  });
});

describe('blogPostSchema', () => {
  it('accepts a valid post', () => {
    expect(blogPostSchema.safeParse(f.blogPost).success).toBe(true);
  });
  it('rejects an invalid publishedAt', () => {
    expect(blogPostSchema.safeParse({ ...f.blogPost, publishedAt: 'yesterday' }).success).toBe(
      false,
    );
  });
  it('derives input and update schemas', () => {
    const input = f.without(f.blogPost, 'id', 'createdAt', 'updatedAt');
    expect(blogPostInputSchema.safeParse(input).success).toBe(true);
    expect(blogPostInputSchema.safeParse({ ...input, tags: 'a' }).success).toBe(false);
    expect(blogPostUpdateSchema.safeParse({ title: 'New' }).success).toBe(true);
    expect(blogPostUpdateSchema.safeParse({ title: '' }).success).toBe(false);
  });
});

describe('skillSchema', () => {
  it('accepts proficiency 1-5 only', () => {
    expect(skillSchema.safeParse(f.skill).success).toBe(true);
    expect(skillSchema.safeParse({ ...f.skill, proficiency: 0 }).success).toBe(false);
    expect(skillSchema.safeParse({ ...f.skill, proficiency: 6 }).success).toBe(false);
    expect(skillSchema.safeParse({ ...f.skill, proficiency: 2.5 }).success).toBe(false);
  });
  it('derives input and update schemas', () => {
    expect(
      skillInputSchema.safeParse({ name: 'Go', category: 'Languages', proficiency: 3 }).success,
    ).toBe(true);
    expect(skillInputSchema.safeParse({ name: 'Go' }).success).toBe(false);
    expect(skillUpdateSchema.safeParse({ proficiency: 4 }).success).toBe(true);
    expect(skillUpdateSchema.safeParse({ proficiency: 9 }).success).toBe(false);
  });
});

describe('languageSchema', () => {
  it('accepts every CEFR level and NATIVE', () => {
    for (const level of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'NATIVE']) {
      expect(languageSchema.safeParse({ ...f.language, level }).success).toBe(true);
    }
  });
  it('rejects unknown levels and negative order', () => {
    expect(languageSchema.safeParse({ ...f.language, level: 'D1' }).success).toBe(false);
    expect(languageSchema.safeParse({ ...f.language, order: -1 }).success).toBe(false);
  });
  it('derives input and update schemas', () => {
    expect(languageInputSchema.safeParse({ name: 'English', level: 'C1', order: 1 }).success).toBe(
      true,
    );
    expect(languageInputSchema.safeParse({ name: 'English' }).success).toBe(false);
    expect(languageUpdateSchema.safeParse({ level: 'B2' }).success).toBe(true);
    expect(languageUpdateSchema.safeParse({ level: 'B3' }).success).toBe(false);
  });
});

describe('certificationSchema', () => {
  it('accepts a valid certification with free-text issuer', () => {
    expect(certificationSchema.safeParse(f.certification).success).toBe(true);
    expect(
      certificationSchema.safeParse({
        ...f.certification,
        issuer: 'Cambridge',
        category: 'Language',
      }).success,
    ).toBe(true);
  });
  it('accepts optional fields as null and no expiry', () => {
    const minimal = {
      ...f.certification,
      category: null,
      credentialId: null,
      credentialUrl: null,
      badgeImageUrl: null,
      expiresAt: null,
    };
    expect(certificationSchema.safeParse(minimal).success).toBe(true);
  });
  it('rejects expiresAt before issuedAt, bad urls and bad dates', () => {
    expect(
      certificationSchema.safeParse({ ...f.certification, expiresAt: '2020-01-01' }).success,
    ).toBe(false);
    expect(
      certificationSchema.safeParse({ ...f.certification, credentialUrl: 'ftp://x.io' }).success,
    ).toBe(false);
    expect(
      certificationSchema.safeParse({ ...f.certification, issuedAt: '2025-13-40' }).success,
    ).toBe(false);
  });
  it('derives input and update schemas keeping the date rule', () => {
    const input = f.without(f.certification, 'id', 'createdAt', 'updatedAt');
    expect(certificationInputSchema.safeParse(input).success).toBe(true);
    expect(certificationInputSchema.safeParse({ ...input, expiresAt: '2020-01-01' }).success).toBe(
      false,
    );
    expect(certificationUpdateSchema.safeParse({ name: 'Renamed' }).success).toBe(true);
    expect(
      certificationUpdateSchema.safeParse({ issuedAt: '2025-01-01', expiresAt: '2024-01-01' })
        .success,
    ).toBe(false);
  });
});

describe('experienceItemSchema', () => {
  it('accepts an ongoing and a finished position', () => {
    expect(experienceItemSchema.safeParse(f.experienceItem).success).toBe(true);
    expect(
      experienceItemSchema.safeParse({ ...f.experienceItem, endDate: '2023-01-01' }).success,
    ).toBe(true);
  });
  it('rejects endDate before startDate and empty summary', () => {
    expect(
      experienceItemSchema.safeParse({ ...f.experienceItem, endDate: '2021-01-01' }).success,
    ).toBe(false);
    expect(experienceItemSchema.safeParse({ ...f.experienceItem, summary: '' }).success).toBe(
      false,
    );
  });
  it('derives input and update schemas keeping the date rule', () => {
    const input = f.without(f.experienceItem, 'id');
    expect(experienceItemInputSchema.safeParse(input).success).toBe(true);
    expect(experienceItemInputSchema.safeParse({ ...input, endDate: '2000-01-01' }).success).toBe(
      false,
    );
    expect(experienceItemUpdateSchema.safeParse({ company: 'Globex' }).success).toBe(true);
    expect(
      experienceItemUpdateSchema.safeParse({ startDate: '2022-01-01', endDate: '2021-01-01' })
        .success,
    ).toBe(false);
  });
});

describe('profileDetailSchema', () => {
  it('accepts a valid detail and rejects an empty key', () => {
    expect(profileDetailSchema.safeParse(f.profileDetail).success).toBe(true);
    expect(profileDetailSchema.safeParse({ ...f.profileDetail, key: '' }).success).toBe(false);
  });
  it('derives input and update schemas', () => {
    expect(
      profileDetailInputSchema.safeParse({ key: 'k', value: 'v', group: 'g', order: 0 }).success,
    ).toBe(true);
    expect(profileDetailInputSchema.safeParse({ key: 'k' }).success).toBe(false);
    expect(profileDetailUpdateSchema.safeParse({ value: 'x' }).success).toBe(true);
    expect(profileDetailUpdateSchema.safeParse({ order: -3 }).success).toBe(false);
  });
});

describe('socialLinkSchema', () => {
  it('accepts https and mailto urls', () => {
    expect(socialLinkSchema.safeParse(f.socialLink).success).toBe(true);
    expect(
      socialLinkSchema.safeParse({ ...f.socialLink, platform: 'EMAIL', url: 'mailto:foo@bar.com' })
        .success,
    ).toBe(true);
  });
  it('rejects unknown platforms and unsafe schemes', () => {
    expect(socialLinkSchema.safeParse({ ...f.socialLink, platform: 'MYSPACE' }).success).toBe(
      false,
    );
    expect(
      socialLinkSchema.safeParse({ ...f.socialLink, url: 'javascript:alert(1)' }).success,
    ).toBe(false);
  });
  it('derives input and update schemas', () => {
    const input = f.without(f.socialLink, 'id');
    expect(socialLinkInputSchema.safeParse(input).success).toBe(true);
    expect(socialLinkInputSchema.safeParse({ ...input, visible: 'yes' }).success).toBe(false);
    expect(socialLinkUpdateSchema.safeParse({ visible: false }).success).toBe(true);
    expect(socialLinkUpdateSchema.safeParse({ url: 'nope' }).success).toBe(false);
  });
});
