import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Badge } from '../../components/ui/badge';
import { Button, ButtonLink } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';

afterEach(cleanup);

describe('Button', () => {
  it('defaults to type=button so it never submits a form by accident', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' }).getAttribute('type')).toBe('button');
  });

  it('forwards type and click handlers', () => {
    const onClick = vi.fn();
    render(
      <Button type="submit" onClick={onClick}>
        Send
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Send' });
    fireEvent.click(button);
    expect(button.getAttribute('type')).toBe('submit');
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not fire when disabled', () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Nope
      </Button>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Nope' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies variant classes and merges className', () => {
    render(
      <Button variant="secondary" className="extra">
        Go
      </Button>,
    );
    const { className } = screen.getByRole('button', { name: 'Go' });
    expect(className).toContain('border-neutral-300');
    expect(className).toContain('extra');
  });
});

describe('ButtonLink', () => {
  it('renders an anchor with the href', () => {
    render(<ButtonLink href="/projects">See projects</ButtonLink>);
    expect(screen.getByRole('link', { name: 'See projects' }).getAttribute('href')).toBe(
      '/projects',
    );
  });
});

describe('Card and Badge', () => {
  it('Card renders an article with its children', () => {
    render(<Card aria-label="Project">content</Card>);
    expect(screen.getByRole('article', { name: 'Project' }).textContent).toBe('content');
  });

  it('Badge renders its text', () => {
    render(<Badge>TypeScript</Badge>);
    expect(screen.getByText('TypeScript')).toBeTruthy();
  });
});

describe('Input', () => {
  it('associates the label with the input', () => {
    render(<Input label="Email" type="email" />);
    const input = screen.getByLabelText('Email');
    expect(input.getAttribute('type')).toBe('email');
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });

  it('exposes the error through aria-describedby and aria-invalid', () => {
    render(<Input label="Name" error="Name is required" />);
    const input = screen.getByLabelText('Name');
    const error = screen.getByText('Name is required');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(error.id);
  });

  it('keeps a caller aria-describedby and appends the error id', () => {
    render(<Input label="Name" aria-describedby="hint" error="Required" />);
    const input = screen.getByLabelText('Name');
    const errorId = screen.getByText('Required').id;
    expect(input.getAttribute('aria-describedby')).toBe(`hint ${errorId}`);
  });

  it('keeps a caller aria-describedby when there is no error', () => {
    render(<Input label="Name" aria-describedby="hint" />);
    expect(screen.getByLabelText('Name').getAttribute('aria-describedby')).toBe('hint');
  });

  it('never lets a caller prop hide the invalid state', () => {
    render(<Input label="Name" aria-invalid={false} error="Required" />);
    expect(screen.getByLabelText('Name').getAttribute('aria-invalid')).toBe('true');
  });

  it('uses exactly one border color, red on error', () => {
    render(
      <>
        <Input label="Ok" />
        <Input label="Bad" error="Nope" />
      </>,
    );
    const ok = screen.getByLabelText('Ok').className;
    const bad = screen.getByLabelText('Bad').className;
    expect(ok).toContain('border-neutral-300');
    expect(ok).not.toContain('border-red-600');
    expect(bad).toContain('border-red-600');
    expect(bad).not.toContain('border-neutral-300');
  });

  it('gives every input a unique id', () => {
    render(
      <>
        <Input label="First" />
        <Input label="Second" />
      </>,
    );
    expect(screen.getByLabelText('First').id).not.toBe(screen.getByLabelText('Second').id);
  });
});
