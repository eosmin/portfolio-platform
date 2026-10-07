import type { Metadata } from 'next';
import { cacheLife } from 'next/cache';
import type { ReactNode } from 'react';
import { About } from '../../components/sections/about';
import { Certifications } from '../../components/sections/certifications';
import { Experience } from '../../components/sections/experience';
import { Languages } from '../../components/sections/languages';
import { Skills } from '../../components/sections/skills';
import { getCertifications } from '../../lib/api/certifications';
import { getExperience } from '../../lib/api/experience';
import { getLanguages } from '../../lib/api/languages';
import { getProfile } from '../../lib/api/profile';
import { getSkills } from '../../lib/api/skills';

export const metadata: Metadata = { title: 'About' };

export default async function AboutPage(): Promise<ReactNode> {
  'use cache';
  cacheLife('stable');
  const [experience, skills, languages, certifications, profile] = await Promise.all([
    getExperience(),
    getSkills(),
    getLanguages(),
    getCertifications(),
    getProfile(),
  ]);
  return (
    <>
      <h1 className="sr-only">About</h1>
      <About details={profile} />
      <Experience items={experience} />
      <Skills skills={skills} />
      <Languages languages={languages} />
      <Certifications certifications={certifications} now={new Date()} />
    </>
  );
}
