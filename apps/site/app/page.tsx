import { cacheLife } from 'next/cache';
import type { ReactNode } from 'react';
import { ContactCta } from '../components/sections/contact';
import { GithubStats } from '../components/sections/github-stats';
import { Hero } from '../components/sections/hero';
import { Projects } from '../components/sections/projects';
import { Skills } from '../components/sections/skills';
import { ButtonLink } from '../components/ui/button';
import { getGithubStats } from '../lib/api/github';
import { getProfile } from '../lib/api/profile';
import { getFeaturedProjects } from '../lib/api/projects';
import { getSkills } from '../lib/api/skills';
import { profileValue } from '../lib/profile';

export default async function HomePage(): Promise<ReactNode> {
  'use cache';
  cacheLife('fresh');
  const [profile, featured, skills, stats] = await Promise.all([
    getProfile(),
    getFeaturedProjects(),
    getSkills(),
    getGithubStats(),
  ]);
  return (
    <>
      <Hero
        name={profileValue(profile, 'name', 'Portfolio')}
        headline={profileValue(profile, 'headline', 'Full-stack TypeScript developer')}
        meta={[profileValue(profile, 'location', ''), profileValue(profile, 'available_for', '')]
          .filter((part) => part !== '')
          .join(' · ')}
        photoSrc={profileValue(profile, 'photo', '')}
      >
        <ButtonLink href="/projects">View projects</ButtonLink>
        <ButtonLink href="/contact" variant="secondary">
          Contact me
        </ButtonLink>
      </Hero>
      <Projects projects={featured.items} title="Featured projects" />
      <Skills skills={skills} />
      <GithubStats stats={stats} />
      <ContactCta />
    </>
  );
}
