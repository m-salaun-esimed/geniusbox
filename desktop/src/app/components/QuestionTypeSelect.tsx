import { useEffect, useRef, useState } from 'react';
import { QuestionType } from '../../game-engine/types';
import {
  QUESTION_TYPE_COLOR,
  QUESTION_TYPE_LABELS,
  QUESTION_TYPE_ORDER,
} from '../questionTypeColors';

type QuestionTypeSelectProps = {
  value: QuestionType;
  onChange: (next: QuestionType) => void;
};

export const QuestionTypeSelect = ({ value, onChange }: QuestionTypeSelectProps) => {
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

  const currentColor = QUESTION_TYPE_COLOR[value];

  return (
    <div className='color-select' ref={containerRef}>
      <button
        type='button'
        className='color-select-trigger'
        onClick={() => setIsOpen((previous) => !previous)}
        aria-haspopup='listbox'
        aria-expanded={isOpen}
      >
        <span className='color-dot' style={{ backgroundColor: currentColor.hex }} />
        <span className='color-select-label'>{QUESTION_TYPE_LABELS[value]}</span>
        <span className='color-select-caret' aria-hidden='true'>▾</span>
      </button>
      {isOpen ? (
        <ul className='color-select-options' role='listbox'>
          {QUESTION_TYPE_ORDER.map((type) => {
            const color = QUESTION_TYPE_COLOR[type];
            return (
              <li key={`type_opt_${type}`}>
                <button
                  type='button'
                  role='option'
                  aria-selected={type === value}
                  className={
                    type === value ? 'color-select-option is-active' : 'color-select-option'
                  }
                  onClick={() => {
                    onChange(type);
                    setIsOpen(false);
                  }}
                >
                  <span className='color-dot' style={{ backgroundColor: color.hex }} />
                  <span>{QUESTION_TYPE_LABELS[type]}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
};
