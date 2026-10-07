import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import Markdown, { type Components } from 'react-markdown';
import { cx } from '../../lib/cx';

type WithoutNode<T> = Omit<T, 'node'>;

// The page title is the only h1, so a Markdown `#` becomes an h2 and every other level steps down one.
const heading = (Tag: 'h2' | 'h3' | 'h4', className: string) =>
  function Heading({
    node: _node,
    ...props
  }: WithoutNode<ComponentPropsWithoutRef<'h2'>> & { node?: unknown }): ReactNode {
    return <Tag {...props} className={cx('text-balance font-semibold', className)} />;
  };

const components: Components = {
  h1: heading('h2', 'mt-10 text-h2'),
  h2: heading('h2', 'mt-10 text-h2'),
  h3: heading('h3', 'mt-8 text-h3'),
  h4: heading('h4', 'mt-6 text-base'),
  h5: heading('h4', 'mt-6 text-base'),
  h6: heading('h4', 'mt-6 text-base'),
  ul: ({ node: _node, ...props }) => <ul {...props} className="list-disc space-y-1 pl-6" />,
  ol: ({ node: _node, ...props }) => <ol {...props} className="list-decimal space-y-1 pl-6" />,
  a: ({ node: _node, href, ...props }) => {
    const external = href !== undefined && /^(https?:)?\/\//i.test(href);
    return (
      <a
        {...props}
        {...(href ? { href } : {})}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className="text-accent underline underline-offset-4 hover:no-underline"
      />
    );
  },
  blockquote: ({ node: _node, ...props }) => (
    <blockquote {...props} className="border-l-2 border-border pl-4 text-fg-muted" />
  ),
  hr: ({ node: _node, ...props }) => <hr {...props} className="border-border" />,
  pre: ({ node: _node, ...props }) => (
    <pre
      {...props}
      className="overflow-x-auto rounded-md border border-border bg-surface p-4 font-mono text-meta [&_code]:border-0 [&_code]:bg-transparent [&_code]:p-0"
    />
  ),
  code: ({ node: _node, ...props }) => (
    <code
      {...props}
      className="rounded-sm border border-border bg-surface px-1.5 py-0.5 font-mono text-meta"
    />
  ),
};

/**
 * Renders a project or post body written in Markdown. Raw HTML is dropped and URLs go through
 * react-markdown's default sanitizer; images are not rendered yet (cover images have their own field).
 */
export function Prose({ text }: { text: string }): ReactNode {
  return (
    <div className="max-w-[68ch] space-y-4 leading-relaxed text-fg">
      <Markdown components={components} skipHtml disallowedElements={['img']}>
        {text}
      </Markdown>
    </div>
  );
}
