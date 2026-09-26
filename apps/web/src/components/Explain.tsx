'use client';

import { useId, useState } from 'react';
import { WORDS, type WordKey } from '@/lib/terms';

/**
 * A small "?" that explains a technical word when you hover or tap it.
 *
 * Usage:
 *   <Explain term="ballot">ballot</Explain>
 *   <Explain term="elo" />                 // shows the plain word itself
 *
 * Props:
 *   term     - the key from WORDS in src/lib/terms.ts
 *   children - optional. Use when the on-screen word differs from the plain one.
 */
export default function Explain({
  term,
  children,
  className = '',
}: {
  term: WordKey;
  children?: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const entry = WORDS[term];
  const label = children ?? entry.plain;

  return (
    <span className={`relative inline-block ${className}`}>
      <button
        type="button"
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="mx-0.5 inline-flex items-baseline gap-0.5 rounded border-b border-dotted border-slate-500 text-left text-inherit hover:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal"
      >
        <span>{label}</span>
        <span
          aria-hidden="true"
          className="inline-flex h-3.5 w-3.5 shrink-0 translate-y-[-1px] items-center justify-center rounded-full bg-slate-700 text-[9px] font-bold text-slate-300"
        >
          ?
        </span>
        <span className="sr-only">What does this mean?</span>
      </button>

      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute bottom-full left-0 z-50 mb-2 block w-64 rounded-lg border border-slate-700 bg-slate-900 p-3 text-xs font-normal leading-relaxed text-slate-200 shadow-xl"
        >
          {entry.means}
        </span>
      )}
    </span>
  );
}
