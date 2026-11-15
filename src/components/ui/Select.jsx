import { useEffect, useId, useRef, useState } from 'react';

export default function Select({ value, options, onChange, label, className = '', disabled = false }) {
  const rootRef = useRef(null);
  const listId = useId();
  const selectedIndex = options.findIndex((option) => option.value === value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(Math.max(0, selectedIndex));
  const selectedOption = options[selectedIndex];

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, [open]);

  const openAt = (index = selectedIndex) => {
    setActiveIndex(Math.max(0, index));
    setOpen(true);
  };

  const choose = (option) => {
    onChange(option.value);
    setOpen(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      if (!open) {
        openAt(selectedIndex >= 0 ? selectedIndex : direction > 0 ? 0 : options.length - 1);
        return;
      }
      setActiveIndex((index) => (index + direction + options.length) % options.length);
      return;
    }

    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      setActiveIndex(event.key === 'Home' ? 0 : options.length - 1);
      setOpen(true);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (open) choose(options[activeIndex]);
      else openAt();
    }
  };

  return (
    <div ref={rootRef} className={`select ${className}`.trim()}>
      <button
        type="button"
        className={`select__trigger ${open ? 'is-open' : ''}`}
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-option-${activeIndex}` : undefined}
        disabled={disabled || options.length === 0}
        onClick={() => (open ? setOpen(false) : openAt())}
        onKeyDown={handleKeyDown}
      >
        <span className="select__value">{selectedOption?.label ?? label}</span>
        <svg className="select__chevron" aria-hidden="true" viewBox="0 0 20 20" fill="none">
          <path d="m5 7.5 5 5 5-5" />
        </svg>
      </button>
      {open && (
        <div id={listId} className="select__menu" role="listbox" aria-label={label}>
          {options.map((option, index) => (
            <div
              id={`${listId}-option-${index}`}
              key={option.value}
              className={`select__option ${index === activeIndex ? 'is-active' : ''} ${option.value === value ? 'is-selected' : ''}`}
              role="option"
              aria-selected={option.value === value}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => choose(option)}
            >
              <span>{option.label}</span>
              {option.value === value && (
                <svg className="select__check" aria-hidden="true" viewBox="0 0 20 20" fill="none">
                  <path d="m4 10 4 4 8-8" />
                </svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
