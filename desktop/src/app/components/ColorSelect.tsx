import { useEffect, useRef, useState } from 'react';
import { COLOR_PALETTE } from '../../game-engine/types';

type ColorSelectProps = {
  value: string;
  onChange: (next: string) => void;
};

export const ColorSelect = ({ value, onChange }: ColorSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handlePointer = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('mousedown', handlePointer);
    return () => window.removeEventListener('mousedown', handlePointer);
  }, [isOpen]);

  const normalized = value.trim().toLowerCase();
  const current = COLOR_PALETTE.find((entry) => entry.id === normalized) ?? COLOR_PALETTE[0];

  return (
    <div className='color-select' ref={containerRef}>
      <button
        type='button'
        className='color-select-trigger'
        onClick={() => setIsOpen((previous) => !previous)}
      >
        <span className='color-dot' style={{ backgroundColor: current.hex }} />
        <span className='color-select-label'>{current.label}</span>
        <span className='color-select-caret' aria-hidden='true'>▾</span>
      </button>
      {isOpen ? (
        <ul className='color-select-options' role='listbox'>
          {COLOR_PALETTE.map((entry) => (
            <li key={`color_opt_${entry.id}`}>
              <button
                type='button'
                role='option'
                aria-selected={entry.id === current.id}
                className={
                  entry.id === current.id
                    ? 'color-select-option is-active'
                    : 'color-select-option'
                }
                onClick={() => {
                  onChange(entry.id);
                  setIsOpen(false);
                }}
              >
                <span className='color-dot' style={{ backgroundColor: entry.hex }} />
                <span>{entry.label}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};
