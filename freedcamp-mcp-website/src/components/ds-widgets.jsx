// Class-based ports of the four Freedcamp design-system widgets used by the
// docs page. Behaviour and visuals mirror the design system's components
// (SearchInput, SegmentedControl, ThemeSwitch) exactly.

export function SearchInput({ value, placeholder = 'Search', onChange, onClear }) {
    return (
        <span className="ds-search">
            <svg className="ds-search__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                <path d="M20 20l-3.6-3.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
                className="ds-search__input"
                type="text"
                value={value}
                placeholder={placeholder}
                onChange={onChange}
                aria-label="Search tools"
            />
            {value ? (
                <button className="ds-search__clear" type="button" aria-label="Clear search" onClick={onClear}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                </button>
            ) : null}
        </span>
    );
}

export function SegmentedControl({ options = [], value, onChange }) {
    return (
        <div className="ds-seg" role="tablist" aria-label="Quickstart client">
            {options.map((o) => (
                <button
                    key={o.id}
                    type="button"
                    role="tab"
                    aria-selected={o.id === value}
                    title={o.label}
                    className={`ds-seg__btn ${o.id === value ? 'is-active' : ''}`}
                    onClick={() => onChange && onChange(o.id)}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}

export function ThemeSwitch({ theme = 'light', onChange }) {
    const dark = theme === 'dark';
    return (
        <button
            type="button"
            role="switch"
            aria-checked={dark}
            aria-label="Toggle dark mode"
            className={`ds-theme ${dark ? 'is-dark' : ''}`}
            onClick={() => onChange && onChange(dark ? 'light' : 'dark')}
        >
            <span className="ds-theme__knob">
                {dark ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
                    </svg>
                ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <circle cx="12" cy="12" r="5" />
                        <path d="M12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                )}
            </span>
        </button>
    );
}
