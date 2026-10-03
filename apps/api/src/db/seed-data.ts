import type {
  NewBlogPost,
  NewCertification,
  NewExperienceItem,
  NewLanguage,
  NewProfileDetail,
  NewProject,
  NewSkill,
  NewSocialLink,
} from './schema/index.js';

// Clearly fictional demo content: the owner replaces it through the admin API.
// Certifications deliberately span unrelated issuers and categories: `issuer` is free text.

export const demoProjects: NewProject[] = [
  {
    slug: 'demo-task-board',
    title: 'Demo Task Board',
    description: 'Sample project used to exercise the portfolio API and site.',
    body: '# Demo Task Board\n\nPlaceholder body rendered as Markdown.',
    repoUrl: 'https://github.com/example/demo-task-board',
    demoUrl: 'https://example.com/demo-task-board',
    tech: ['TypeScript', 'PostgreSQL'],
    featured: true,
    publishedAt: new Date('2026-01-15T12:00:00Z'),
  },
  {
    slug: 'demo-cli-tool',
    title: 'Demo CLI Tool',
    description: 'Second sample project, not featured.',
    body: '# Demo CLI Tool\n\nPlaceholder body rendered as Markdown.',
    tech: ['Node.js'],
    featured: false,
    publishedAt: new Date('2025-11-02T12:00:00Z'),
  },
];

export const demoBlogPosts: NewBlogPost[] = [
  {
    slug: 'hello-world',
    title: 'Hello, world',
    excerpt: 'First sample post.',
    body: '# Hello, world\n\nPlaceholder post body.',
    tags: ['meta'],
    publishedAt: new Date('2026-02-01T12:00:00Z'),
  },
];

export const demoSkills: NewSkill[] = [
  { name: 'TypeScript', category: 'Languages', proficiency: 5 },
  { name: 'PostgreSQL', category: 'Databases', proficiency: 4 },
  { name: 'Docker', category: 'Infrastructure', proficiency: 4 },
];

export const demoLanguages: NewLanguage[] = [
  { name: 'Spanish', level: 'NATIVE', order: 0 },
  { name: 'English', level: 'C1', order: 1 },
];

export const demoCertifications: NewCertification[] = [
  {
    name: 'Sample Cloud Practitioner (demo data)',
    issuer: 'Example Cloud Academy',
    category: 'Cloud',
    description: 'Fictional cloud fundamentals certification.',
    credentialId: 'DEMO-CLOUD-0001',
    credentialUrl: 'https://example.com/credentials/DEMO-CLOUD-0001',
    issuedAt: '2025-06-01',
    expiresAt: '2028-06-01',
    skills: ['Compute', 'Storage', 'IAM'],
    order: 0,
  },
  {
    name: 'Sample English Proficiency Exam (demo data)',
    issuer: 'Example Language Institute',
    category: 'Language',
    issuedAt: '2024-03-15',
    order: 1,
  },
];

export const demoExperience: NewExperienceItem[] = [
  {
    title: 'Software Engineer',
    company: 'Example Company',
    startDate: '2022-01-01',
    summary: 'Sample role used to exercise the experience timeline.',
    highlights: ['Built a sample REST API', 'Introduced CI/CD'],
  },
];

export const demoProfileDetails: NewProfileDetail[] = [
  { key: 'location', value: 'Mexico City', group: 'basics', order: 0 },
  { key: 'available_for', value: 'Full-time / Contract', group: 'basics', order: 1 },
];

export const demoSocialLinks: NewSocialLink[] = [
  { platform: 'GITHUB', url: 'https://github.com/example', order: 0, visible: true },
  { platform: 'LINKEDIN', url: 'https://www.linkedin.com/in/example', order: 1, visible: true },
];
