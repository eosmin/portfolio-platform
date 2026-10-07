import type { ReactNode } from 'react';

/** Renders a plain-text body as paragraphs (blank-line separated); Markdown is not interpreted. */
export function Prose({ text }: { text: string }): ReactNode {
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim() !== '');
  return (
    <div className="space-y-4 leading-relaxed text-fg">
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="whitespace-pre-line">
          {paragraph}
        </p>
      ))}
    </div>
  );
}
