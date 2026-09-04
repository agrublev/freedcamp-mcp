import { useState } from 'react';
import Layout from '../components/Layout.jsx';
import SEO, { techArticleJsonLd } from '../components/SEO.jsx';
import { MCP_URL, TOTAL_TOOLS, CLAUDE_DESKTOP_SETUP } from '../data/content.js';

const TABS = [
    { id: 'claude-desktop', label: 'Claude Desktop' },
    { id: 'claude-code', label: 'Claude Code' },
    { id: 'cursor', label: 'Cursor / Cline / Continue' },
    { id: 'codex', label: 'Codex CLI' },
    { id: 'chatgpt', label: 'ChatGPT' },
    { id: 'curl', label: 'Verify with curl' },
];

function Tab({ tab, active, onSelect }) {
    return (
        <button
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={active}
            aria-controls={`panel-${tab.id}`}
            tabIndex={active ? 0 : -1}
            className={`tab ${active ? 'is-active' : ''}`}
            onClick={() => onSelect(tab.id)}
        >
            {tab.label}
        </button>
    );
}

function TabPanel({ tab, active, children }) {
    return (
        <div
            role="tabpanel"
            id={`panel-${tab.id}`}
            aria-labelledby={`tab-${tab.id}`}
            hidden={!active}
            className="tabpanel"
        >
            {children}
        </div>
    );
}

function ClaudeDesktopTabContent() {
    return (
        <>
            <p>
                Every client below uses <strong>OAuth 2.1</strong> — no headers, no config-file secrets.
                Claude Desktop&apos;s connector UI walks you through it. The visual walkthrough is on the{' '}
                <a href="/walkthrough/">Claude Desktop walkthrough page</a>; this list is the same flow as
                click-by-click steps.
            </p>
            <ol className="steps">
                {CLAUDE_DESKTOP_SETUP.map((s, i) => (
                    <li key={s.src}>
                        {s.title} —{' '}
                        <span dangerouslySetInnerHTML={{ __html: s.body }} />
                        <a href={s.src} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: 8 }}>
                            <img src={s.src} alt={`Step ${i + 1}: ${s.title}`} loading="lazy"
                                 style={{ maxWidth: 360, borderRadius: 8, border: '1px solid var(--border-subtle)' }} />
                        </a>
                    </li>
                ))}
            </ol>
            <div className="callout">
                <strong>That&apos;s it</strong> — Claude Desktop stores and refreshes the token itself.
                The {TOTAL_TOOLS}+ Freedcamp tools appear in the tools menu right away, no restart needed.
            </div>
        </>
    );
}

function ClaudeCodeTabContent() {
    return (
        <>
            <p>Register the server, then finish the one-time browser sign-in.</p>
            <pre><code>{`claude mcp add --transport http freedcamp ${MCP_URL}`}</code></pre>
            <p>
                <code>claude mcp list</code> will show it as &ldquo;Needs authentication&rdquo; — finish it by
                selecting <code>freedcamp</code> and choosing <em>Authenticate</em>, or from inside a session:
            </p>
            <pre><code>/mcp</code></pre>
            <p>
                Your browser opens Freedcamp&apos;s sign-in page — enter your API key + secret once.
                Claude Code stores the token and refreshes it automatically after that.
            </p>
        </>
    );
}

function CursorTabContent() {
    return (
        <>
            <p>
                Any MCP client with OAuth discovery (Cursor, Cline, Continue, Windsurf, …) just needs
                the URL — no headers to manage.
            </p>
            <pre><code>{`{
  "mcpServers": {
    "freedcamp": {
      "url": "${MCP_URL}"
    }
  }
}`}</code></pre>
            <p>
                The client detects the <code>WWW-Authenticate</code> challenge, registers itself automatically
                (Dynamic Client Registration), and opens your browser to Freedcamp&apos;s sign-in page. Enter your
                API key + secret once — the client stores and refreshes the token from then on.
            </p>
        </>
    );
}

function CodexTabContent() {
    return (
        <>
            <p>
                Requires a recent Codex CLI — check whether yours has the <code>mcp add</code>/<code>login</code>{' '}
                command group:
            </p>
            <pre><code>codex mcp add --help</code></pre>
            <p>
                If that errors, or doesn&apos;t list a <code>--url</code> flag, update first — older builds&apos;
                <code>codex mcp</code> only runs Codex itself as a server and won&apos;t recognize{' '}
                <code>add</code>/<code>login</code> at all:
            </p>
            <pre><code>npm install -g @openai/codex@latest</code></pre>
            <p>Then add the server and sign in:</p>
            <pre><code>{`codex mcp add freedcamp --url ${MCP_URL}
codex mcp login freedcamp`}</code></pre>
            <p>
                Or edit <code>~/.codex/config.toml</code> by hand instead of <code>mcp add</code>:
            </p>
            <pre><code>{`[mcp_servers.freedcamp]
url = "${MCP_URL}"`}</code></pre>
            <div className="callout">
                <code>codex mcp login</code> opens your browser to Freedcamp&apos;s sign-in page — enter
                your API key + secret once. Codex stores and refreshes the token after that. Check status any
                time with <code>codex mcp list</code>.
            </div>
        </>
    );
}

function ChatGPTTabContent() {
    return (
        <>
            <p>
                ChatGPT <em>Custom Connectors</em> (Pro / Team / Enterprise / Edu) now connect directly — the
                OAuth flow removes the old two-header limitation, no proxy needed.
            </p>
            <ol className="steps">
                <li>
                    Enable <strong>Developer mode</strong> (Settings → Apps → Advanced settings, or
                    Settings → Connectors → Advanced, depending on plan/workspace).
                </li>
                <li>
                    Settings → <strong>Connectors</strong> → <strong>Create</strong>.
                </li>
                <li>
                    Name it &ldquo;Freedcamp&rdquo;, paste <code>{MCP_URL}</code> as the MCP server URL, and set
                    Authentication to <strong>OAuth</strong>.
                </li>
                <li>
                    Click <strong>Create</strong> — ChatGPT redirects you to Freedcamp&apos;s sign-in page.
                    Enter your API key + secret once.
                </li>
            </ol>
        </>
    );
}

function CurlTabContent() {
    return (
        <>
            <p>
                OAuth means <code>tools/list</code> needs a bearer token from a completed sign-in — but you
                can sanity-check the server without one:
            </p>
            <pre><code>curl -s https://mcp.freedcamp.com/.well-known/oauth-authorization-server | jq</code></pre>
            <p>Confirm the process is alive:</p>
            <pre><code>curl -s https://mcp.freedcamp.com/healthz</code></pre>
            <p>
                To list all ~{TOTAL_TOOLS} tools with curl, complete the browser sign-in through any client
                above first, then reuse the resulting bearer token:
            </p>
            <pre><code>{`curl -X POST ${MCP_URL} \\
  -H 'Content-Type: application/json' \\
  -H 'Accept: application/json, text/event-stream' \\
  -H 'Authorization: Bearer ***' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | jq '.result.tools[].name'`}</code></pre>
        </>
    );
}

const TAB_CONTENT = {
    'claude-desktop': ClaudeDesktopTabContent,
    'claude-code': ClaudeCodeTabContent,
    'cursor': CursorTabContent,
    'codex': CodexTabContent,
    'chatgpt': ChatGPTTabContent,
    'curl': CurlTabContent,
};

export default function QuickstartPage() {
    const [active, setActive] = useState('claude-desktop');

    const onKeyDown = (e) => {
        const idx = TABS.findIndex((t) => t.id === active);
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            setActive(TABS[(idx + 1) % TABS.length].id);
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            setActive(TABS[(idx - 1 + TABS.length) % TABS.length].id);
        }
    };

    return (
        <Layout breadcrumb="Quickstart">
            <SEO
                path="/quickstart/"
                title="Quickstart — connect any AI client to Freedcamp"
                description="Step-by-step instructions for connecting Claude Desktop, Claude Code, Cursor, Cline, Codex CLI, and ChatGPT to the Freedcamp MCP server. OAuth 2.1, no config files."
                jsonLd={techArticleJsonLd({
                    title: 'Quickstart — Freedcamp MCP',
                    description: 'Connect any MCP-compatible AI client to Freedcamp.',
                    path: '/quickstart/',
                })}
            />

            <section className="section" aria-labelledby="qs-title">
                <div className="section__head">
                    <div className="section__eyebrow">
                        <span className="section__num">02</span> Step 2
                    </div>
                    <h1 className="section__title" id="qs-title">Connect your AI client.</h1>
                    <p className="section__lead">
                        Every client speaks the same OAuth 2.1 flow — point it at the URL below and sign
                        in when prompted. The URL must end in <code>/mcp</code>.
                    </p>
                </div>

                <div className="tabs" role="tablist" aria-label="Quickstart for each client" onKeyDown={onKeyDown}>
                    {TABS.map((t) => (
                        <Tab key={t.id} tab={t} active={active === t.id} onSelect={setActive} />
                    ))}
                </div>

                {TABS.map((t) => {
                    const Content = TAB_CONTENT[t.id];
                    return (
                        <TabPanel key={t.id} tab={t} active={active === t.id}>
                            <Content />
                        </TabPanel>
                    );
                })}
            </section>
        </Layout>
    );
}
