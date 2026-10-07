import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Hero } from '../../components/sections/hero';
import { CoverImage } from '../../components/ui/cover-image';
import { Prose } from '../../components/ui/prose';
import { stubBrowser } from '../helpers/browser';

beforeEach(() => {
  stubBrowser(false);
});

afterEach(() => {
  cleanup();
});

describe('CoverImage', () => {
  it('renders an allow-listed cover as a decorative image', () => {
    const { container } = render(
      <CoverImage src="https://images.example.com/c.png" sizes="100vw" />,
    );
    const img = container.querySelector('img');
    expect(img?.getAttribute('alt')).toBe('');
    expect(img?.getAttribute('src')).toContain('images.example.com');
  });

  it('renders nothing for a host that is not allow-listed, instead of throwing', () => {
    const { container } = render(
      <CoverImage src="https://unknown.example.net/c.png" sizes="100vw" />,
    );
    expect(container.innerHTML).toBe('');
  });
});

describe('Hero photo', () => {
  it('shows the photo with the owner name as alt text', () => {
    render(<Hero name="Ada Lovelace" headline="Engineer" photoSrc="/images/me.png" />);
    const photo = screen.getByRole('img', { name: 'Ada Lovelace' });
    expect(photo.getAttribute('width')).toBe('320');
    expect(photo.getAttribute('height')).toBe('320');
  });

  it('keeps the text before the photo in the DOM', () => {
    render(<Hero name="Ada Lovelace" headline="Engineer" photoSrc="/images/me.png" />);
    const heading = screen.getByRole('heading', { name: 'Ada Lovelace' });
    const photo = screen.getByRole('img');
    expect(heading.compareDocumentPosition(photo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('is text only, with no empty image, without a usable photo', () => {
    const { container, rerender } = render(<Hero name="Ada" headline="Engineer" />);
    expect(container.querySelector('img')).toBeNull();
    rerender(<Hero name="Ada" headline="Engineer" photoSrc="" />);
    expect(container.querySelector('img')).toBeNull();
    rerender(<Hero name="Ada" headline="Engineer" photoSrc="https://unknown.example.net/me.png" />);
    expect(container.querySelector('img')).toBeNull();
  });

  it('shows the mono meta line only when given', () => {
    const { rerender } = render(
      <Hero name="Ada" headline="Engineer" meta="Mexico City · Remote" />,
    );
    expect(screen.getByText('Mexico City · Remote')).toBeTruthy();
    rerender(<Hero name="Ada" headline="Engineer" meta="" />);
    expect(screen.queryByText('Mexico City · Remote')).toBeNull();
  });
});

describe('Prose (Markdown)', () => {
  it('steps headings down so the page keeps a single h1', () => {
    const { container } = render(<Prose text={'# One\n\n## Two\n\n### Three\n\n#### Four'} />);
    expect(container.querySelector('h1')).toBeNull();
    expect([...container.querySelectorAll('h2')].map((h) => h.textContent)).toEqual(['One', 'Two']);
    expect(container.querySelector('h3')?.textContent).toBe('Three');
    expect(container.querySelector('h4')?.textContent).toBe('Four');
  });

  it('renders lists, emphasis, inline code and fenced code', () => {
    const { container } = render(
      <Prose text={'- a\n- **b**\n\nUse `pnpm dev`.\n\n```bash\npnpm install\n```'} />,
    );
    expect(container.querySelectorAll('ul > li')).toHaveLength(2);
    expect(container.querySelector('strong')?.textContent).toBe('b');
    expect(container.querySelector('pre code')?.textContent).toContain('pnpm install');
    expect(container.querySelector('p code')?.textContent).toBe('pnpm dev');
  });

  it('opens web links in a new tab safely and keeps site links in the tab', () => {
    render(<Prose text={'[repo](https://github.com/x/y) and [about](/about)'} />);
    const repo = screen.getByRole('link', { name: 'repo' });
    expect(repo.getAttribute('target')).toBe('_blank');
    expect(repo.getAttribute('rel')).toBe('noopener noreferrer');
    expect(screen.getByRole('link', { name: 'about' }).getAttribute('target')).toBeNull();
  });

  it('drops raw HTML, javascript: links and images', () => {
    const { container } = render(
      <Prose
        text={
          '<script>alert(1)</script>\n\n[x](javascript:alert(1))\n\n![pic](https://a.com/p.png)'
        }
      />,
    );
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('a')?.getAttribute('href') ?? '').not.toContain('javascript:');
  });

  it('separates paragraphs and renders nothing for an empty body', () => {
    const { container, rerender } = render(<Prose text={'First\n\nSecond'} />);
    expect(container.querySelectorAll('p')).toHaveLength(2);
    rerender(<Prose text="" />);
    expect(container.querySelectorAll('p')).toHaveLength(0);
  });
});

describe('CoverImage ratio', () => {
  it('is 16:9 by default and 21:9 for the detail-page banner', () => {
    const { container, rerender } = render(
      <CoverImage src="https://images.example.com/c.png" sizes="100vw" />,
    );
    expect(container.firstElementChild?.className).toContain('aspect-video');
    rerender(<CoverImage src="https://images.example.com/c.png" sizes="100vw" ratio="wide" />);
    expect(container.firstElementChild?.className).toContain('aspect-[21/9]');
    expect(container.firstElementChild?.className).not.toContain('aspect-video');
  });
});

describe('Prose external links', () => {
  it.each([
    ['https://a.com/x', true],
    ['HTTPS://a.com/x', true],
    ['//a.com/x', true],
    ['/about', false],
    ['httpbin-notes', false],
    ['/http-docs', false],
  ])('%s opens in a new tab: %s', (href, external) => {
    render(<Prose text={`[go](${href})`} />);
    const link = screen.getByRole('link', { name: 'go' });
    expect(link.getAttribute('target') === '_blank').toBe(external);
  });
});
