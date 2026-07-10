import { useEffect, useRef, useState } from 'react';

interface Option {
  value: string;
  label: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
}

export default function Select({ value, onChange, options, placeholder = '请选择' }: Props) {
  const [open, setOpen] = useState(false);
  const [focusIdx, setFocusIdx] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  // close on outside click / escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        listRef.current && !listRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  // position dropdown below trigger
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left, width: r.width });
  }, [open]);

  const select = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); }
      return;
    }
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setFocusIdx((i) => Math.min(i + 1, options.length - 1)); break;
      case 'ArrowUp': e.preventDefault(); setFocusIdx((i) => Math.max(i - 1, 0)); break;
      case 'Enter': e.preventDefault(); if (focusIdx >= 0) select(options[focusIdx].value); break;
    }
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKey}
        className="flex h-10 w-full items-center justify-between rounded-md border border-border bg-transparent px-3 text-sm transition-colors focus:border-accent focus:outline-none"
      >
        <span className={selected ? 'text-text' : 'text-muted'}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          width="10" height="6" viewBox="0 0 10 6" fill="none"
          className={`shrink-0 text-muted transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          ref={listRef}
          className="fixed z-[100] rounded-md border border-border bg-elevated py-1 shadow-lg"
          style={{ top: pos.top, left: pos.left, width: pos.width }}
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted">无选项</div>
          ) : (
            options.map((opt, i) => (
              <button
                key={opt.value}
                type="button"
                className={`w-full px-3 py-1.5 text-left text-sm transition-colors ${
                  i === focusIdx ? 'bg-accent/10 text-accent' : 'text-text hover:bg-surface'
                } ${opt.value === value ? 'text-accent' : ''}`}
                onClick={() => select(opt.value)}
                onMouseEnter={() => setFocusIdx(i)}
              >
                {opt.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
