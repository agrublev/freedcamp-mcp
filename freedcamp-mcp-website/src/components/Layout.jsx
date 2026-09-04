// Page shell — sidebar nav + main content. Renders a skip-link for
// keyboard users, breadcrumb for context, and footer with cross-links.

import { Link, useLocation } from 'react-router-dom';
import { MCP_URL } from '../data/content.js';

const NAV_ITEMS = [
    { path: '/', label: 'Overview', exact: true },
    { path: '/quickstart/', label: 'Quickstart' },
    { path: '/walkthrough/', label: 'Claude Desktop walkthrough' },
    { path: '/auth/', label: 'Authentication' },
    { path: '/workflow/', label: 'How the AI should work' },
    { path: '/tools/', label: 'Tool reference' },
    { path: '/recipes/', label: 'Prompt recipes' },
    { path: '/security/', label: 'Security & limits' },
    { path: '/errors/', label: 'Errors & troubleshooting' },
    { path: '/faq/', label: 'FAQ' },
];

function isActive(navPath, currentPath, exact) {
    if (exact) return currentPath === navPath;
    return currentPath === navPath || currentPath.startsWith(navPath);
}

export default function Layout({ children, breadcrumb }) {
    const location = useLocation();
    return (
        <div className="page">
            <a href="#main" className="skip-link">Skip to content</a>

            <aside className="sidebar" aria-label="Primary navigation">
                <Link to="/" className="sidebar__brand" aria-label="Freedcamp MCP home">
                    <img src="/favicon.svg" alt="" width="158" height="40" style={{height: 40}} />
                </Link>

                <div className="sidebar__eyebrow">Guide</div>
                <nav className="sidebar__nav" aria-label="Documentation sections">
                    {NAV_ITEMS.map((item) => {
                        const active = isActive(item.path, location.pathname, item.exact);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className="sidebar__link"
                                aria-current={active ? 'page' : undefined}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="sidebar__eyebrow">External</div>
                <nav className="sidebar__nav" aria-label="External resources">
                    <a className="sidebar__link" href={MCP_URL} target="_blank" rel="noreferrer">
                        MCP endpoint
                    </a>
                    <a className="sidebar__link" href="https://modelcontextprotocol.io" target="_blank" rel="noreferrer">
                        MCP Spec
                    </a>
                    <a className="sidebar__link" href="https://freedcamp.com" target="_blank" rel="noreferrer">
                        Freedcamp
                    </a>
                    <a className="sidebar__link" href="https://freedcamp.com/manage/account#api" target="_blank" rel="noreferrer">
                        API credentials
                    </a>
                </nav>
            </aside>

            <main id="main" className="main">
                {breadcrumb && (
                    <nav aria-label="Breadcrumb" className="muted" style={{ fontSize: 12, marginBottom: 16 }}>
                        <Link to="/">Home</Link>
                        {' / '}
                        <span aria-current="page">{breadcrumb}</span>
                    </nav>
                )}
                {children}

                <footer className="footer" role="contentinfo">
                    <div>
                        <strong style={{ color: 'var(--text-primary)' }}>Freedcamp MCP</strong>
                        <span className="muted"> · MIT License · {new Date().getFullYear()}</span>
                    </div>
                    <div className="footer__links">
                        <a href={MCP_URL}>Endpoint</a>
                        <a href="https://mcp.freedcamp.com/healthz" target="_blank" rel="noreferrer">Health</a>
                        <a href="https://modelcontextprotocol.io" target="_blank" rel="noreferrer">MCP Spec</a>
                        <a href="https://freedcamp.com" target="_blank" rel="noreferrer">Freedcamp</a>
                        <a href="/llms.txt">llms.txt</a>
                    </div>
                </footer>
            </main>

            <div className="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Screenshot preview">
                <button className="lightbox__close" type="button" aria-label="Close">&times;</button>
                <img className="lightbox__img" id="lightbox-img" alt="" />
            </div>
        </div>
    );
}
