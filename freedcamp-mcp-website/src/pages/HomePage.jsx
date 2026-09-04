import Layout from '../components/Layout.jsx';
import SEO from '../components/SEO.jsx';
import {
    MCP_URL,
    TOTAL_TOOLS,
    TOTAL_TOOLS_DESCRIBED,
    TOOL_GROUPS,
} from '../data/content.js';

const HERO_QUOTES = [
    'Create a "Fix login race condition" task in the API project, due Friday, assigned to me, In Progress.',
    "Show all tasks I'm assigned to that are overdue, grouped by project.",
    'Log 45 minutes against today on the Acme refactor and mark it billable.',
];

const WHY_CARDS = [
    {
        icon: '⚡',
        title: 'Hosted, no install',
        body: 'Point your client at one URL. No server to run, no Docker, no cron. The endpoint is maintained for you.',
    },
    {
        icon: '🔐',
        title: 'One-time OAuth sign-in',
        body: 'Standard OAuth 2.1. Enter your Freedcamp API key + secret once in your browser — your client stores and refreshes the token. No headers, no plaintext secrets in config files.',
    },
    {
        icon: '🧰',
        title: `${TOTAL_TOOLS}+ tools, one endpoint`,
        body: 'Tasks, lists, comments, events, discussions, files, issues, milestones, CRM, time, wikis, notifications, calendar, projects — all live in one place.',
    },
];

const HEALTH_ROWS = [
    { endpoint: 'GET /healthz', what: 'Process liveness.' },
    {
        endpoint: 'GET /.well-known/oauth-authorization-server',
        what: 'OAuth metadata — authorization, token, and registration endpoints.',
    },
    {
        endpoint: 'GET /authorize',
        what: 'The sign-in page — enter your Freedcamp API key + secret.',
    },
    {
        endpoint: 'ALL /mcp',
        what: 'The MCP endpoint itself — requires a bearer token from the flow above.',
    },
];

export default function HomePage() {
    return (
        <Layout breadcrumb="Overview">
            <SEO
                path="/"
                title="Freedcamp MCP — project management for any AI assistant"
                description={`A hosted Model Context Protocol server that exposes ${TOTAL_TOOLS}+ Freedcamp tools to Claude Desktop, Claude Code, ChatGPT, Cursor, Cline, Codex, and any MCP-compatible AI. Sign in once with OAuth.`}
            />

            <header className="hero" aria-labelledby="hero-title">
                <span className="hero__eyebrow">
                    <span aria-hidden="true">✨</span> Hosted · OAuth 2.1 · Zero install
                </span>
                <h1 className="hero__title" id="hero-title">
                    Run your whole workspace by asking.
                </h1>
                <p className="hero__lead">
                    A hosted Model Context Protocol server that exposes the Freedcamp API to Claude Desktop, Claude Code,
                    ChatGPT, Cursor, Cline, Continue, and any other MCP-compatible client. Sign in once with OAuth —
                    no headers, no secrets in config files — <strong>{TOTAL_TOOLS}+ tools</strong> in a single
                    endpoint.
                </p>

                <dl className="hero__stats">
                    <div className="hero__stat">
                        <dt className="hero__stat-label">Endpoint</dt>
                        <dd className="hero__stat-value">
                            <code>{MCP_URL.replace('https://', '')}</code>
                        </dd>
                    </div>
                    <div className="hero__stat">
                        <dt className="hero__stat-label">Tools</dt>
                        <dd className="hero__stat-value">{TOTAL_TOOLS}+</dd>
                    </div>
                    <div className="hero__stat">
                        <dt className="hero__stat-label">Auth</dt>
                        <dd className="hero__stat-value">OAuth 2.1</dd>
                    </div>
                    <div className="hero__stat">
                        <dt className="hero__stat-label">Transport</dt>
                        <dd className="hero__stat-value">Streamable HTTP</dd>
                    </div>
                </dl>

                <div className="hero__cta">
                    <a className="btn btn--primary" href="/quickstart/">Get started in 60 seconds</a>
                    <a className="btn btn--ghost" href="/tools/">Browse {TOTAL_TOOLS}+ tools</a>
                </div>
            </header>

            <section className="section" aria-labelledby="prompts-heading">
                <div className="section__head">
                    <div className="section__eyebrow">Prompts your assistant will hear</div>
                    <h2 className="section__title" id="prompts-heading">Things worth asking for.</h2>
                </div>
                <ul className="recipe-list" aria-label="Sample prompts">
                    {HERO_QUOTES.map((q) => (
                        <li key={q} className="recipe" style={{ gridTemplateColumns: '1fr' }}>
                            <p className="recipe__ask" style={{ margin: 0, fontStyle: 'italic' }}>&ldquo;{q}&rdquo;</p>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="section" aria-labelledby="why-heading">
                <div className="section__head">
                    <div className="section__eyebrow">Why</div>
                    <h2 className="section__title" id="why-heading">Talk to Freedcamp from inside any AI.</h2>
                    <p className="section__lead">
                        Freedcamp is a full-featured PM tool — tasks, milestones, time tracking, CRM, wikis,
                        calendar, files, issues. Stop tab-hopping. Drive it from your AI.
                    </p>
                </div>
                <div className="grid grid--3">
                    {WHY_CARDS.map((c) => (
                        <article key={c.title} className="card">
                            <div className="card__icon" aria-hidden="true">{c.icon}</div>
                            <h3 className="card__title">{c.title}</h3>
                            <p className="card__body">{c.body}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="section" aria-labelledby="tools-heading">
                <div className="section__head">
                    <div className="section__eyebrow">
                        <span className="section__num">04</span> Reference
                    </div>
                    <h2 className="section__title" id="tools-heading">
                        {TOTAL_TOOLS}+ tools across every Freedcamp app.
                    </h2>
                    <p className="section__lead">
                        Live parameter schemas appear inline in any MCP client via <code>tools/list</code> —
                        nothing to memorize. See the full reference on the{' '}
                        <a href="/tools/">tool reference page</a>.
                    </p>
                </div>
                <div className="grid grid--3">
                    {TOOL_GROUPS.slice(0, 9).map((g) => (
                        <article key={g.slug} className="toolgroup">
                            <div className="toolgroup__head">
                                <h3 className="toolgroup__name">{g.name}</h3>
                                <span className="toolgroup__count">{g.tools.length}</span>
                            </div>
                            <p className="toolgroup__desc">{g.desc}</p>
                            <ul className="toolgroup__list" aria-label={`${g.name} tools`}>
                                {g.tools.slice(0, 4).map((t) => (
                                    <li key={t}><code>{t}</code></li>
                                ))}
                                {g.tools.length > 4 && <li><code>+{g.tools.length - 4} more</code></li>}
                            </ul>
                        </article>
                    ))}
                </div>
                <p className="text-center mt-2">
                    <a className="btn btn--ghost" href="/tools/">See all {TOTAL_TOOLS_DESCRIBED} tools →</a>
                </p>
            </section>

            <section className="section" aria-labelledby="health-heading">
                <div className="section__head">
                    <div className="section__eyebrow">Health</div>
                    <h2 className="section__title" id="health-heading">
                        Status &amp; OAuth introspection endpoints.
                    </h2>
                    <p className="section__lead">Quick checks for liveness and the OAuth flow.</p>
                </div>
                <div className="table" role="table" aria-label="HTTP endpoints">
                    <div className="table__row table__row--head" role="row">
                        <div role="columnheader">Endpoint</div>
                        <div role="columnheader">What it tells you</div>
                    </div>
                    {HEALTH_ROWS.map((r) => (
                        <div key={r.endpoint} className="table__row" role="row">
                            <div role="cell"><code>{r.endpoint}</code></div>
                            <div role="cell">{r.what}</div>
                        </div>
                    ))}
                </div>
            </section>
        </Layout>
    );
}
