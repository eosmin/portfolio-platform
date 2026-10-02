const ID = '3f2b8c1e-9a4d-4e7b-8c55-2d1f6a7b9c10';
const TS = '2026-01-15T10:30:00.000Z';

export const project = {
  id: ID,
  slug: 'portfolio-platform',
  title: 'Portfolio Platform',
  description: 'Monorepo with an Express API and a Next.js site.',
  body: '# Overview',
  repoUrl: 'https://github.com/example/portfolio-platform',
  demoUrl: null,
  coverImage: null,
  tech: ['TypeScript', 'Express'],
  featured: true,
  publishedAt: TS,
  createdAt: TS,
  updatedAt: TS,
};

export const blogPost = {
  id: ID,
  slug: 'hello-world',
  title: 'Hello world',
  excerpt: 'First post.',
  body: 'Body',
  coverImage: null,
  tags: ['meta'],
  publishedAt: TS,
  createdAt: TS,
  updatedAt: TS,
};

export const skill = { id: ID, name: 'TypeScript', category: 'Languages', proficiency: 5 };

export const language = { id: ID, name: 'Spanish', level: 'NATIVE', order: 0 };

export const certification = {
  id: ID,
  name: 'AWS Certified Solutions Architect – Associate',
  issuer: 'Amazon Web Services',
  category: 'Cloud',
  description: 'Designing distributed systems on AWS.',
  credentialId: 'ABC123',
  credentialUrl: 'https://www.credly.com/badges/abc123',
  badgeImageUrl: null,
  issuedAt: '2025-03-01',
  expiresAt: '2028-03-01',
  skills: ['EC2', 'VPC'],
  order: 0,
  createdAt: TS,
  updatedAt: TS,
};

export const experienceItem = {
  id: ID,
  title: 'Software Engineer',
  company: 'Acme',
  startDate: '2022-01-01',
  endDate: null,
  summary: 'Built things.',
  highlights: ['Shipped X'],
};

export const profileDetail = {
  id: ID,
  key: 'location',
  value: 'Mexico City',
  group: 'basics',
  order: 0,
};

export const socialLink = {
  id: ID,
  platform: 'GITHUB',
  url: 'https://github.com/example',
  label: null,
  icon: null,
  order: 0,
  visible: true,
};

export const contactInput = {
  name: 'Ada',
  email: 'ada@example.com',
  message: 'Hello, I would like to talk.',
};

export function without<T extends object, K extends keyof T>(obj: T, ...keys: K[]): Omit<T, K> {
  const copy = { ...obj };
  for (const key of keys) delete copy[key];
  return copy;
}
