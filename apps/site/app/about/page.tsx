import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense, type ReactNode } from 'react';
import { About } from '../../components/sections/about';
import { Certifications } from '../../components/sections/certifications';
import { Experience } from '../../components/sections/experience';
import { Languages } from '../../components/sections/languages';
import { Skills } from '../../components/sections/skills';
import { ListFallback } from '../../components/ui/list-fallback';
import { getCertifications } from '../../lib/api/certifications';
import { getExperience } from '../../lib/api/experience';
import { getLanguages } from '../../lib/api/languages';
import { getProfile } from '../../lib/api/profile';
import { getSkills } from '../../lib/api/skills';

export const metadata: Metadata = { title: 'About' };

async function AboutContent(): Promise<ReactNode> {
  await connection();
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

export default function AboutPage(): ReactNode {
  return (
    <Suspense fallback={<ListFallback>Loading…</ListFallback>}>
      <AboutContent />
    </Suspense>
  );
}
