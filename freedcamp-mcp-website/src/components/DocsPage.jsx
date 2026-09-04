// GENERATED from Freedcamp MCP Docs.dc.html (claude_design import).
// Static markup + class names are the design itself; dynamic behaviour
// (search, client tabs, walkthrough steps, theme, copy) is React state.

import { useEffect, useRef, useState } from 'react';
import { Head } from 'vite-react-ssg';
import {
    NAV_GROUPS, CLIENTS, RECIPES, ERRORS, FAQ, DARK,
    filterCatalog, TOTAL_TOOLS, MCP_URL, REPO_URL, API_KEYS_URL,
} from '../data/content.js';
import { SearchInput, SegmentedControl, ThemeSwitch } from './ds-widgets.jsx';

function GroupBlock({ g, showExamples, showAnnotations, onCopy }) {
    return (
      <div id={g.anchor} className="dc-89fa13b5">
        <div className="dc-6bc8ab6b">
          <h3 className="dc-343d15b4">{g.name}</h3>
          <span className="dc-04f0c4dc">{g.countLabel}</span>
          <span className="dc-3524551e"></span>
        </div>
        <p className="dc-73cab02d">{g.blurb}</p>

        <div className="dc-3e7f6ac1">
          {g.tools.map((t) => (
            <div id={t.name} key={t.name} className="dc-59e44a87 dc-0901074a">
              <div className="dc-202e0f67">
                <code className="dc-3f093f06">{t.name}</code>
                {showAnnotations && (
                  <span className={`ds-badge ds-badge--${t.tone}`}>{t.badge}</span>
                )}
                <p className="dc-27fd3b3a">{t.desc}</p>
              </div>

              {t.hasParams && (
                <div className="dc-ecb022f0">
                  <div className="dc-7e5941ec">
                    <span>PARAMETER</span><span>TYPE</span><span>NOTES</span>
                  </div>
                  {t.params.map((p) => (
                    <div className="dc-5ec8f3be" key={p.name}>
                      <code className="dc-346104d8">{p.name}</code>
                      <span className="dc-941dbc5b">{p.type}</span>
                      <span className="dc-589ac059">{p.note}</span>
                    </div>
                  ))}
                </div>
              )}

              {t.noParams && <div className="dc-7db983cb">Takes no arguments.</div>}

              {showExamples && (
                <div className="dc-9aa2e741">
                  <button onClick={onCopy} className="dc-12e253c5 dc-56448dda">Copy</button>
                  <pre className="dc-8c98b666">{t.example}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
}

export default function DocsPage() {
    const [query, setQuery] = useState('');
    const [client, setClient] = useState('claude-desktop');
    const [theme, setTheme] = useState('light');
    const [step, setStep] = useState(1);
    const [activeSection, setActiveSection] = useState('overview');
    const [showExamples] = useState(true);
    const [showAnnotations] = useState(true);

    const { groups, total } = filterCatalog(query);
    const noResults = groups.length === 0;
    const resultLabel = query.trim()
        ? total + (total === 1 ? ' tool' : ' tools') + ' matching'
        : '102 tools';
    const stepLabel = 'Step ' + step + ' of 6';

    // theme
    useEffect(() => {
        const root = document.documentElement;
        Object.keys(DARK).forEach((k) => {
            if (theme === 'dark') root.style.setProperty(k, DARK[k]);
            else root.style.removeProperty(k);
        });
        root.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
    }, [theme]);

    // scroll spy for the sidebar
    useEffect(() => {
        const onScroll = () => {
            const links = document.querySelectorAll('aside nav a[href^="#"]');
            let active = null;
            let bestTop = -Infinity;
            links.forEach((a) => {
                const el = document.getElementById(a.getAttribute('href').slice(1));
                if (!el) return;
                const top = el.getBoundingClientRect().top - 120;
                if (top <= 0 && top > bestTop) { bestTop = top; active = a; }
            });
            if (!active) active = links[0];
            if (active) setActiveSection(active.getAttribute('href').slice(1));
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const onSearch = (e) => setQuery(e.target.value);
    const onClearSearch = () => setQuery('');
    const onClient = (id) => setClient(id);
    const onTheme = (next) => setTheme(next);
    const goStep = (e) => {
        const n = parseInt(e.currentTarget.getAttribute('data-step'), 10);
        if (n) setStep(n);
    };
    const nextStep = () => setStep((s) => (s >= 6 ? 1 : s + 1));
    const prevStep = () => setStep((s) => (s <= 1 ? 6 : s - 1));

    const onCopy = (e) => {
        const btn = e.currentTarget;
        const pre = btn.parentElement && btn.parentElement.querySelector('pre');
        if (!pre) return;
        const text = pre.innerText;
        const done = () => {
            btn.textContent = 'Copied';
            window.setTimeout(() => { btn.textContent = 'Copy'; }, 1400);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done, done);
        } else {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); } catch (err) { /* ignore */ }
            document.body.removeChild(ta);
            done();
        }
    };
    const onCopyAsk = (e) => {
        const btn = e.currentTarget;
        const card = btn.closest('[data-recipe]');
        const p = card && card.querySelector('p');
        if (!p) return;
        const text = p.innerText;
        const done = () => {
            btn.textContent = 'Copied';
            window.setTimeout(() => { btn.textContent = 'Copy'; }, 1400);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done, done);
        } else {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); } catch (err) { /* ignore */ }
            document.body.removeChild(ta);
            done();
        }
    };

    const navLinkStyle = (href, bold) => {
        const on = activeSection === href.slice(1);
        return {
            background: on ? 'var(--color-primary-tint)' : 'transparent',
            color: on ? 'var(--color-primary)' : bold ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: on || bold ? 600 : 500,
            boxShadow: on ? 'inset 2px 0 0 0 var(--color-primary)' : 'none',
        };
    };
    const stepBtnStyle = (n) => ({
        background: step === n ? 'var(--color-primary-tint)' : 'transparent',
        boxShadow: step === n ? 'inset 2px 0 0 0 var(--color-primary)' : 'none',
    });
    const stepNumStyle = (n) => ({
        background: step === n ? 'var(--color-primary)' : 'var(--surface-sunken)',
        color: step === n ? '#fff' : 'var(--text-secondary)',
    });

    return (
        <>
            <Head>
                <title>Freedcamp MCP — run your whole workspace by asking</title>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
                <meta name="theme-color" content="#4a86f7" />
                <meta name="color-scheme" content="light dark" />
                <meta name="generator" content="vite-react-ssg + claude_design import" />
                <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
                <meta
                    name="description"
                    content="Freedcamp MCP exposes tasks, lists, milestones, time tracking, the Issue Tracker, discussions, wikis, files, the calendar and CRM as 102 tools any MCP client can call. Point Claude, Cursor or Codex CLI at it and ask for what you want in plain language."
                />
                <link rel="canonical" href="https://mcp-docs.freedcamp.top/" />
                <meta property="og:type" content="website" />
                <meta property="og:site_name" content="Freedcamp MCP" />
                <meta property="og:title" content="Freedcamp MCP — run your whole workspace by asking" />
                <meta
                    property="og:description"
                    content="102 Freedcamp tools for any MCP client. Hosted endpoint, OAuth only — nothing to install."
                />
                <meta property="og:url" content="https://mcp-docs.freedcamp.top/" />
                <meta property="og:image" content="https://mcp-docs.freedcamp.top/og-image.png" />
                <meta name="twitter:card" content="summary_large_image" />
                <link rel="icon" type="image/svg+xml" href="/assets/img/logo.svg" />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            '@context': 'https://schema.org',
                            '@type': 'SoftwareApplication',
                            name: 'Freedcamp MCP',
                            applicationCategory: 'DeveloperApplication',
                            operatingSystem: 'Any (hosted)',
                            description:
                                'Hosted Model Context Protocol server exposing the Freedcamp API as 102 tools for Claude, Cursor, Codex CLI and any MCP client. OAuth 2.1 only.',
                            url: 'https://mcp-docs.freedcamp.top/',
                            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
                            featureList:
                                '102 MCP tools for tasks, projects, lists, comments, calendar, discussions, issues, milestones, time, wikis, CRM, users, notifications, files',
                        }),
                    }}
                />
            </Head>
<div className="dc-17ae503f">

  <aside className="dc-c406fcea">
    <div className="dc-3cd06cf4">
      <img src="/assets/img/logo.svg" alt="Freedcamp" className="dc-73c13005" />
      
    </div>

    <div className="dc-0eb15fbc">Guide</div>
    <nav className="dc-01b802b5">
      <a href="#overview" className="dc-492626a7 dc-f0aec3ae" style={navLinkStyle('#overview', false)}>Overview</a>
      <a href="#quickstart" className="dc-492626a7 dc-f0aec3ae" style={navLinkStyle('#quickstart', false)}>Quickstart</a>
      <a href="#claude-walkthrough" className="dc-492626a7 dc-f0aec3ae" style={navLinkStyle('#claude-walkthrough', false)}>Claude Desktop walkthrough</a>
      <a href="#auth" className="dc-492626a7 dc-f0aec3ae" style={navLinkStyle('#auth', false)}>Authentication</a>
      <a href="#workflow" className="dc-492626a7 dc-f0aec3ae" style={navLinkStyle('#workflow', false)}>How the AI should work</a>
      <a href="#tools" className="dc-2e7151df dc-77292f57" style={navLinkStyle('#tools', true)}>Tool reference</a>
    </nav>

    <div className="dc-ecbdf280">
      {NAV_GROUPS.map((g) => (
        <a href={g.href} className="dc-a8ce25ff dc-f0aec3ae" style={navLinkStyle(g.href, false)}>
          <span>{g.name}</span>
          <span className="dc-e0bcf7ec">{g.count}</span>
        </a>
      ))}
    </div>

    <div className="dc-0eb15fbc">Practice</div>
    <nav className="dc-80ebd54a">
      <a href="#recipes" className="dc-492626a7 dc-f0aec3ae" style={navLinkStyle('#recipes', false)}>Prompt recipes</a>
      <a href="#security" className="dc-492626a7 dc-f0aec3ae" style={navLinkStyle('#security', false)}>Security &amp; limits</a>
      <a href="#errors" className="dc-492626a7 dc-f0aec3ae" style={navLinkStyle('#errors', false)}>Errors &amp; troubleshooting</a>
      <a href="#faq" className="dc-492626a7 dc-f0aec3ae" style={navLinkStyle('#faq', false)}>FAQ</a>
    </nav>

    <div className="dc-19320238">
      <a href="https://github.com/agrublev/freedcamp-mcp" className="dc-a6fadd5c dc-517c2cf4">GitHub repository ↗</a>
      <a href="https://freedcamp.com/manage/account#api" className="dc-a6fadd5c dc-517c2cf4">Get your API keys ↗</a>
    </div>
  </aside>

  <main className="dc-ff616e25">

    <header className="dc-7de123b9">
      <div className="dc-2aa92f59">
        <SearchInput value={query} onChange={onSearch} onClear={onClearSearch} placeholder="Search 102 tools" />
      </div>
      <div className="dc-b1c05366">
        <span className="dc-ec20e509">{resultLabel}</span>
        <ThemeSwitch theme={theme} onChange={onTheme} />
      </div>
    </header>

    <div className="dc-f33d139b">

      <section id="overview" className="dc-022daa75">
        <div className="dc-bed99b97">
          <div className="dc-b05ab6e4"></div>
          <div className="dc-7faa4c20"></div>
          <div className="dc-0a8bc209">
            <div className="dc-63d42cb7">
              <span className="dc-027f35d6"></span>
              <span className="dc-4118b76d">Model Context Protocol server</span>
            </div>
            <h1 className="dc-641ac1ac">Run your whole workspace by asking.</h1>
            <p className="dc-885387fe">Freedcamp MCP exposes tasks, lists, milestones, time tracking, the Issue Tracker, discussions, wikis, files, the calendar and CRM as 102 tools any MCP client can call. Point Claude, Cursor or Codex CLI at it and ask for what you want in plain language.</p>
            <div className="dc-19d2c2f1">
              <div className="dc-0a16ad61">
                <pre className="dc-8862cb6e">{`https://mcp.freedcamp.com/mcp`}</pre>
                <button onClick={onCopy} className="dc-69650e29 dc-285d58f5">Copy</button>
              </div>
              <a href="#quickstart" className="dc-2917847c dc-b8c3b03d">Set up your client →</a>
            </div>
          </div>
        </div>

        <div className="dc-db2e1d8e">
          <div className="dc-77706c2c">
            <div className="dc-33bc0567">102</div>
            <div className="dc-c8dc4dda">Tools, all prefixed <code className="dc-5d65fcb8">fc_</code></div>
          </div>
          <div className="dc-77706c2c">
            <div className="dc-33bc0567">17</div>
            <div className="dc-c8dc4dda">Freedcamp apps covered</div>
          </div>
          <div className="dc-77706c2c">
            <div className="dc-33bc0567">1</div>
            <div className="dc-c8dc4dda">Endpoint — hosted, OAuth only</div>
          </div>
          <div className="dc-251f812c">
            <div className="dc-33bc0567">0</div>
            <div className="dc-c8dc4dda">Installs, config files or secrets on disk</div>
          </div>
        </div>

        <div className="dc-2bac32ad">
          <div className="dc-c8584145">What this looks like in practice</div>
          <div className="dc-20487c5a">
            <p className="dc-ef0362be">“Create a <em>Fix login race condition</em> task in the API Platform project, due Friday, assigned to me, In Progress.”</p>
            <p className="dc-ef0362be">“Show every task assigned to me that is overdue, grouped by project.”</p>
            <p className="dc-ef0362be">“Log 45 minutes on the Acme refactor for today and mark it billed.”</p>
          </div>
        </div>
      </section>

      <section id="quickstart" className="dc-022daa75">
        <div className="dc-b014d8d6">
          <span className="dc-d133c7aa">01</span>
          <span className="dc-400524b5">Get started</span>
          <span className="dc-7d23e0ae"></span>
        </div>
        <h2 className="dc-b42f7adb">Quickstart</h2>
        <p className="dc-6d0d7427">One way in, and nothing to install: the <strong className="dc-2bbabceb">hosted OAuth endpoint</strong>. Add it to your client as a remote MCP server, authorize once in the browser with your own Freedcamp API key, and all 102 tools are live. Pick your client below.</p>

        <div className="dc-57e800c6">
          <SegmentedControl options={CLIENTS} value={client} onChange={onClient} />
        </div>

        <div data-client="claude-desktop" className="dc-9308e7e1" style={{ display: client === 'claude-desktop' ? 'flex' : undefined }}>
          <div className="dc-2bac32ad">
            <div className="dc-b3e758f8">Claude Desktop</div>
            <p className="dc-0d160d30">Open <strong className="dc-5b3fe104">Settings → Connectors</strong>, choose <strong className="dc-5b3fe104">Add ▾ → Add custom connector</strong>, and paste the endpoint below. Claude walks you through authorization in the browser.</p>
            <div className="dc-b1aea647">
              <button onClick={onCopy} className="dc-ea1a0d59 dc-56448dda">Copy</button>
              <pre className="dc-58ccceb8">{`https://mcp.freedcamp.com/mcp`}</pre>
            </div>
            <a href="#claude-walkthrough" className="dc-5b8a583f dc-7c8e3d5d">See the six screens →</a>
          </div>
        </div>

        <div data-client="claude-code" className="dc-9308e7e1" style={{ display: client === 'claude-code' ? 'flex' : undefined }}>
          <div className="dc-2bac32ad">
            <div className="dc-b3e758f8">Claude Code</div>
            <p className="dc-0d160d30">One command adds the connector. Then run <code>/mcp</code> inside the session and pick <strong className="dc-5b3fe104">Authenticate</strong> to finish in the browser.</p>
            <div className="dc-019b3272">
              <button onClick={onCopy} className="dc-ea1a0d59 dc-56448dda">Copy</button>
              <pre className="dc-58ccceb8">{`claude mcp add --transport http freedcamp https://mcp.freedcamp.com/mcp`}</pre>
            </div>
          </div>
        </div>

        <div data-client="cursor" className="dc-9308e7e1" style={{ display: client === 'cursor' ? 'flex' : undefined }}>
          <div className="dc-2bac32ad">
            <div className="dc-b3e758f8">Cursor</div>
            <p className="dc-0d160d30">Create <code>.cursor/mcp.json</code> in your project, or add the same block to your global Cursor MCP settings. Cursor opens the authorization page on first use.</p>
            <div className="dc-019b3272">
              <button onClick={onCopy} className="dc-ea1a0d59 dc-56448dda">Copy</button>
              <pre className="dc-58ccceb8">{`{
  "mcpServers": {
    "freedcamp": { "url": "https://mcp.freedcamp.com/mcp" }
  }
}`}</pre>
            </div>
          </div>
        </div>

        <div data-client="codex" className="dc-9308e7e1" style={{ display: client === 'codex' ? 'flex' : undefined }}>
          <div className="dc-2bac32ad">
            <div className="dc-b3e758f8">Codex CLI</div>
            <p className="dc-0d160d30">Add the server to <code>~/.codex/config.toml</code>. Remote MCP servers need Codex’s streamable-HTTP client enabled, so keep both lines.</p>
            <div className="dc-019b3272">
              <button onClick={onCopy} className="dc-ea1a0d59 dc-56448dda">Copy</button>
              <pre className="dc-58ccceb8">{`experimental_use_rmcp_client = true

[mcp_servers.freedcamp]
url = "https://mcp.freedcamp.com/mcp"`}</pre>
            </div>
          </div>
        </div>

        <div data-client="cline" className="dc-9308e7e1" style={{ display: client === 'cline' ? 'flex' : undefined }}>
          <div className="dc-2bac32ad">
            <div className="dc-b3e758f8">Cline &amp; Continue</div>
            <p className="dc-0d160d30">Both read the standard <code>mcpServers</code> shape — Cline from its MCP Servers panel, Continue from <code>config.json</code>.</p>
            <div className="dc-019b3272">
              <button onClick={onCopy} className="dc-ea1a0d59 dc-56448dda">Copy</button>
              <pre className="dc-58ccceb8">{`{
  "mcpServers": {
    "freedcamp": {
      "type": "streamableHttp",
      "url": "https://mcp.freedcamp.com/mcp"
    }
  }
}`}</pre>
            </div>
          </div>
        </div>

        <div data-client="vscode" className="dc-9308e7e1" style={{ display: client === 'vscode' ? 'flex' : undefined }}>
          <div className="dc-2bac32ad">
            <div className="dc-b3e758f8">VS Code</div>
            <p className="dc-0d160d30">Add this to <code>.vscode/mcp.json</code> or your User Settings (JSON). VS Code prompts you to sign in the first time the server is used.</p>
            <div className="dc-019b3272">
              <button onClick={onCopy} className="dc-ea1a0d59 dc-56448dda">Copy</button>
              <pre className="dc-58ccceb8">{`{
  "servers": {
    "freedcamp": {
      "type": "http",
      "url": "https://mcp.freedcamp.com/mcp"
    }
  }
}`}</pre>
            </div>
          </div>
        </div>

        <div className="dc-ed7fc429">
          <p className="dc-9741a124">Whichever client you use, the first request opens a Freedcamp authorization page in your browser. Paste your API key and secret there once — they are never stored in a config file. Then ask “list my Freedcamp projects” to confirm the connection.</p>
        </div>
      </section>

      <section id="claude-walkthrough" className="dc-022daa75">
        <div className="dc-b014d8d6">
          <span className="dc-d133c7aa">01b</span>
          <span className="dc-400524b5">Walkthrough</span>
          <span className="dc-7d23e0ae"></span>
        </div>
        <h2 className="dc-b42f7adb">Claude Desktop, click by click</h2>
        <p className="dc-b56eaf3d">No config file, no terminal — six clicks from the menu bar to a working connection. Step through the screens below.</p>

        <div className="dc-40ed286f">
          <div className="dc-4c121e2b">
            <button data-step="1" onClick={goStep} className="dc-0573699d dc-77292f57" style={stepBtnStyle(1)}>
              <span data-step-num="1" className="dc-0539867b" style={stepNumStyle(1)}>1</span>
              <span className="dc-8e782d3d">
                <span className="dc-a26a6953">Open Settings</span>
                <span className="dc-c3de5d6f">Claude menu → Settings…</span>
              </span>
            </button>
            <button data-step="2" onClick={goStep} className="dc-0573699d dc-77292f57" style={stepBtnStyle(2)}>
              <span data-step-num="2" className="dc-0539867b" style={stepNumStyle(2)}>2</span>
              <span className="dc-8e782d3d">
                <span className="dc-a26a6953">Go to Connectors</span>
                <span className="dc-c3de5d6f">Under Customize in the sidebar</span>
              </span>
            </button>
            <button data-step="3" onClick={goStep} className="dc-0573699d dc-77292f57" style={stepBtnStyle(3)}>
              <span data-step-num="3" className="dc-0539867b" style={stepNumStyle(3)}>3</span>
              <span className="dc-8e782d3d">
                <span className="dc-a26a6953">Add a custom connector</span>
                <span className="dc-c3de5d6f">Add ▾ → Add custom connector</span>
              </span>
            </button>
            <button data-step="4" onClick={goStep} className="dc-0573699d dc-77292f57" style={stepBtnStyle(4)}>
              <span data-step-num="4" className="dc-0539867b" style={stepNumStyle(4)}>4</span>
              <span className="dc-8e782d3d">
                <span className="dc-a26a6953">Name it and paste the endpoint</span>
                <span className="dc-c3de5d6f">https://mcp.freedcamp.com/mcp</span>
              </span>
            </button>
            <button data-step="5" onClick={goStep} className="dc-0573699d dc-77292f57" style={stepBtnStyle(5)}>
              <span data-step-num="5" className="dc-0539867b" style={stepNumStyle(5)}>5</span>
              <span className="dc-8e782d3d">
                <span className="dc-a26a6953">Keep the detected defaults</span>
                <span className="dc-c3de5d6f">Authentication and OAuth client</span>
              </span>
            </button>
            <button data-step="6" onClick={goStep} className="dc-0573699d dc-77292f57" style={stepBtnStyle(6)}>
              <span data-step-num="6" className="dc-0539867b" style={stepNumStyle(6)}>6</span>
              <span className="dc-8e782d3d">
                <span className="dc-a26a6953">Authorize with your API keys</span>
                <span className="dc-c3de5d6f">Key and secret from Freedcamp</span>
              </span>
            </button>
          </div>

          <div className="dc-3091312a">
            <div className="dc-f6836f6a" style={{ display: step === 1 ? 'flex' : undefined }}>
              <div className="dc-9ca07f87">
                <img src="/assets/img/step1.png" alt="The Claude menu bar with Settings highlighted" className="dc-a4170643" />
              </div>
              <div className="dc-41f7573f">
                <div className="dc-a3e7f610">Open Settings</div>
                <p className="dc-0ff44575">In the macOS menu bar click <strong className="dc-5b3fe104">Claude</strong>, then <strong className="dc-5b3fe104">Settings…</strong> — or just press ⌘, from anywhere in the app. On Windows it is the same panel, reached from the app menu.</p>
              </div>
            </div>
            <div className="dc-f6836f6a" style={{ display: step === 2 ? 'flex' : undefined }}>
              <div className="dc-9ca07f87">
                <img src="/assets/img/step2.png" alt="The Claude settings window with Connectors selected in the sidebar" className="dc-a4170643" />
              </div>
              <div className="dc-41f7573f">
                <div className="dc-a3e7f610">Go to Connectors</div>
                <p className="dc-0ff44575">Scroll the settings sidebar down to <strong className="dc-5b3fe104">Customize</strong> and pick <strong className="dc-5b3fe104">Connectors</strong>. This is the list of everything Claude can reach — MCP servers show up here as connectors.</p>
              </div>
            </div>
            <div className="dc-f6836f6a" style={{ display: step === 3 ? 'flex' : undefined }}>
              <div className="dc-9ca07f87">
                <img src="/assets/img/step4.png" alt="The Add dropdown open, showing Add custom connector" className="dc-a4170643" />
              </div>
              <div className="dc-41f7573f">
                <div className="dc-a3e7f610">Add a custom connector</div>
                <p className="dc-0ff44575">Top right of the Connectors panel, open <strong className="dc-5b3fe104">Add ▾</strong> and choose <strong className="dc-5b3fe104">Add custom connector</strong>. Freedcamp MCP is not in the browse list — it is your own hosted endpoint.</p>
              </div>
            </div>
            <div className="dc-f6836f6a" style={{ display: step === 4 ? 'flex' : undefined }}>
              <div className="dc-9ca07f87">
                <img src="/assets/img/step5.png" alt="The Add custom connector dialog filled in with Freedcamp-MCP and the endpoint URL" className="dc-a4170643" />
              </div>
              <div className="dc-41f7573f">
                <div className="dc-a3e7f610">Name it and paste the endpoint</div>
                <p className="dc-0ff44575">Call it <strong className="dc-5b3fe104">Freedcamp-MCP</strong> (this is only the label you will see in the list), paste <code className="dc-ddf6a344">https://mcp.freedcamp.com/mcp</code> as the address, and click <strong className="dc-5b3fe104">Continue</strong>.</p>
              </div>
            </div>
            <div className="dc-f6836f6a" style={{ display: step === 5 ? 'flex' : undefined }}>
              <div className="dc-9ca07f87">
                <img src="/assets/img/step3.png" alt="The second page of the dialog showing detected authentication and OAuth client settings" className="dc-a4170643" />
              </div>
              <div className="dc-41f7573f">
                <div className="dc-a3e7f610">Keep the detected defaults</div>
                <p className="dc-0ff44575">Claude probes the server and pre-selects the right options — <strong className="dc-5b3fe104">Always required</strong> authentication and <strong className="dc-5b3fe104">No client ID — register one automatically</strong>, both marked <em>Detected</em>. Leave them alone, skip the headers, and click <strong className="dc-5b3fe104">Add</strong>.</p>
              </div>
            </div>
            <div className="dc-f6836f6a" style={{ display: step === 6 ? 'flex' : undefined }}>
              <div className="dc-9ca07f87">
                <img src="/assets/img/step6.png" alt="The Freedcamp authorization page asking for an API key and secret" className="dc-a4170643" />
              </div>
              <div className="dc-41f7573f">
                <div className="dc-a3e7f610">Authorize with your API keys</div>
                <p className="dc-0ff44575">A browser page opens. Paste the <strong className="dc-5b3fe104">API Key</strong> and <strong className="dc-5b3fe104">API Secret</strong> from <a href="https://freedcamp.com/manage/account#api">Freedcamp → Settings → API</a> and hit <strong className="dc-5b3fe104">Authorize</strong>. Your credentials go to Freedcamp, never to Claude. Back in the app, ask “list my Freedcamp projects” to confirm all 102 tools are live.</p>
              </div>
            </div>

            <div className="dc-8401cafd">
              <span className="dc-a6782c2c">{stepLabel}</span>
              <span className="dc-3524551e"></span>
              <button onClick={prevStep} className="dc-d5c73297 dc-f0aec3ae">← Back</button>
              <button onClick={nextStep} className="dc-fe80385b dc-285d58f5">Next →</button>
            </div>
          </div>
        </div>
      </section>

      <section id="auth" className="dc-022daa75">
        <div className="dc-b014d8d6">
          <span className="dc-d133c7aa">02</span>
          <span className="dc-400524b5">Credentials</span>
          <span className="dc-7d23e0ae"></span>
        </div>
        <h2 className="dc-b42f7adb">Authentication</h2>
        <p className="dc-6d0d7427">Freedcamp MCP supports <strong className="dc-2bbabceb">OAuth only</strong>. Every call is made as <em>you</em>, with your own Freedcamp API key and secret — handed over on a Freedcamp authorization page, never pasted into a config file. The server signs upstream requests with HMAC, so your secret is never sent as a credential.</p>

        <div className="dc-0b54ed00">
          <div className="dc-fb899c12">
            <span className="dc-ca92ba6c">1</span>
            <div>
              <div className="dc-4a238d13">Generate a key pair</div>
              <p className="dc-2608d1a5">In Freedcamp, go to <a href="https://freedcamp.com/manage/account#api">Settings → API</a> and create an API key. You get a <strong className="dc-5b3fe104">key</strong> and a <strong className="dc-5b3fe104">secret</strong>. The secret is shown once.</p>
            </div>
          </div>
          <div className="dc-fb899c12">
            <span className="dc-ca92ba6c">2</span>
            <div>
              <div className="dc-4a238d13">Authorize in the browser</div>
              <p className="dc-2608d1a5">Your client redirects to the Freedcamp authorization page on first use. Paste the key and secret there and press <strong className="dc-5b3fe104">Authorize</strong> — the page talks to Freedcamp, not to your AI client.</p>
            </div>
          </div>
          <div className="dc-fb899c12">
            <span className="dc-ca92ba6c">3</span>
            <div>
              <div className="dc-4a238d13">You get a scoped bearer token</div>
              <p className="dc-2608d1a5">Your credentials are verified against the Freedcamp API, then encrypted into a bearer token with AES-256-GCM. A bad key fails immediately, at authorization time, rather than on your first request.</p>
            </div>
          </div>
        </div>

        <div className="dc-eb707403">
          <div>
            <div className="dc-1c050bd5">No local stdio mode, for now</div>
            <p className="dc-684fba30">OAuth over the hosted HTTPS endpoint is the only supported transport today — there is no <code>npx</code> install, no environment variables and no config file to keep secrets in. If you need a self-hosted or stdio option, say so on the <a href="https://github.com/agrublev/freedcamp-mcp">GitHub repository</a>.</p>
          </div>
        </div>
      </section>

      <section id="workflow" className="dc-022daa75">
        <div className="dc-b014d8d6">
          <span className="dc-d133c7aa">03</span>
          <span className="dc-400524b5">Behaviour</span>
          <span className="dc-7d23e0ae"></span>
        </div>
        <h2 className="dc-b42f7adb">How the AI should work</h2>
        <p className="dc-662a2368">The server ships instructions that MCP clients read on connect. Worth knowing, because it explains why your assistant behaves the way it does.</p>
        <div className="dc-9a24a13d">
          <div className="dc-708579f4">The one rule that matters</div>
          <p className="dc-f09a1171">Call <code className="dc-93d1d394">fc_get_groups_projects</code> once at the start of a conversation to get groups, projects and their apps by human-readable name — then reuse that result instead of re-fetching. Only refresh if the user asks, or after creating or deleting a project.</p>
        </div>
        <div className="dc-fdb95bfa">
          <div className="dc-ac555c0c">
            <div className="dc-90a476ef">Names over IDs</div>
            <p className="dc-8e8e51e5">Prefer the project and app names from that first call when talking to the user. <code>fc_add_item_by_names</code> and <code>fc_add_comment_by_names</code> accept names directly.</p>
          </div>
          <div className="dc-ac555c0c">
            <div className="dc-90a476ef">Tool annotations</div>
            <p className="dc-8e8e51e5">Every <code>fc_fetch_*</code> tool is marked read-only, every <code>fc_delete_*</code> destructive. Clients use those hints to decide what to confirm with you.</p>
          </div>
          <div className="dc-ac555c0c">
            <div className="dc-90a476ef">No false successes</div>
            <p className="dc-8e8e51e5">Silent no-ops are treated as failures. Starting an already-running timer returns <code>isError: true</code> with the entry state, not a cheerful “done”.</p>
          </div>
          <div className="dc-ac555c0c">
            <div className="dc-90a476ef">App IDs</div>
            <p className="dc-8e8e51e5">Comments, links and files are addressed by app: 2 Tasks, 3 Discussions, 4 Milestones, 5 Time, 6 Files, 13 Issue Tracker, 14 Wikis, 16 CRM, 19 Calendar, 37 Overview.</p>
          </div>
        </div>
      </section>

      <section id="tools" className="dc-022daa75">
        <div className="dc-b014d8d6">
          <span className="dc-d133c7aa">04</span>
          <span className="dc-400524b5">Reference</span>
          <span className="dc-7d23e0ae"></span>
        </div>
        <h2 className="dc-b42f7adb">Tool reference</h2>
        <p className="dc-14ba896e">All 102 tools, grouped by the Freedcamp app they drive. Every tool takes a flat JSON object; anything not marked required can be left out. Search filters by tool name, description and parameter name.</p>
        <p className="dc-80691cd4">Values below are illustrative — IDs come from your own workspace via <code>fc_get_groups_projects</code>.</p>

        {groups.map((g) => (
          <GroupBlock key={g.anchor} g={g} showExamples={showExamples} showAnnotations={showAnnotations} onCopy={onCopy} />
        ))}

        {noResults && (
          <div className="dc-872f4ce9">
            <div className="dc-97872d57">No tools match that search</div>
            <p className="dc-0de96e0e">Try a shorter term — “task”, “time”, “wiki”, or a parameter name like “due_date”.</p>
          </div>
        )}
      </section>

      <section id="recipes" className="dc-022daa75">
        <div className="dc-b014d8d6">
          <span className="dc-d133c7aa">05</span>
          <span className="dc-400524b5">Playbook</span>
          <span className="dc-7d23e0ae"></span>
        </div>
        <h2 className="dc-b42f7adb">Prompt recipes</h2>
        <p className="dc-6d0d7427">Things worth asking for, and the tools your assistant will reach for. Copy a line, change the names.</p>
        <div className="dc-bb54950c">
          {RECIPES.map((r) => (
            <div data-recipe="true" className="dc-ffe2e287">
              <button onClick={onCopyAsk} className="dc-85a90c99 dc-7b3c94fa">Copy</button>
              <div className="dc-2e1867a9">{r.label}</div>
              <p className="dc-f721f6f1">{r.ask}</p>
              <div className="dc-221041f6">Calls <code className="dc-ddf6a344">{r.tools}</code></div>
            </div>
          ))}
        </div>
      </section>

      <section id="security" className="dc-022daa75">
        <div className="dc-b014d8d6">
          <span className="dc-d133c7aa">06</span>
          <span className="dc-400524b5">Trust</span>
          <span className="dc-7d23e0ae"></span>
        </div>
        <h2 className="dc-b42f7adb">Security &amp; limits</h2>
        <p className="dc-6d0d7427">The server holds no data of its own. It is a typed, annotated surface over the Freedcamp REST API, running as whoever authorized it.</p>
        <div className="dc-3d8528f3">
          <div className="dc-ac555c0c">
            <div className="dc-90a476ef">Per-user credentials</div>
            <p className="dc-8e8e51e5">Each bearer token carries one user’s own encrypted API credentials, and each token gets its own handler. Two people on the same endpoint never see each other’s workspace.</p>
          </div>
          <div className="dc-ac555c0c">
            <div className="dc-90a476ef">Nothing persisted</div>
            <p className="dc-8e8e51e5">Credentials live only inside the encrypted bearer token your client holds. Nothing is written to disk, and there is no config file on your machine holding an API secret in plain text.</p>
          </div>
          <div className="dc-ac555c0c">
            <div className="dc-90a476ef">HMAC-signed upstream</div>
            <p className="dc-8e8e51e5">Requests to Freedcamp are signed per call. Your API secret is used to compute the signature, not transmitted as a credential.</p>
          </div>
          <div className="dc-ac555c0c">
            <div className="dc-90a476ef">Your own account's limits</div>
            <p className="dc-8e8e51e5">There is no separate quota — you inherit the Freedcamp API's own rate limiting and your plan's permissions. A tool can never do more than you can.</p>
          </div>
        </div>
        <div className="dc-a8b5050d">
          <div>
            <div className="dc-c4560c58">Destructive tools are real</div>
            <p className="dc-5000f6e5"><code>fc_delete_project</code>, <code>fc_delete_account</code> and the other <code>fc_delete_*</code> tools act immediately and are not undoable from here. They are annotated destructive so your client can ask first — leave those confirmations on.</p>
          </div>
        </div>
      </section>

      <section id="errors" className="dc-022daa75">
        <div className="dc-b014d8d6">
          <span className="dc-d133c7aa">07</span>
          <span className="dc-400524b5">When it breaks</span>
          <span className="dc-7d23e0ae"></span>
        </div>
        <h2 className="dc-b42f7adb">Errors &amp; troubleshooting</h2>
        <p className="dc-6d0d7427">Failures come back as a tool result with <code>isError: true</code> and a plain-text message, so your assistant can read and explain them. Here is what the common ones mean.</p>
        <div className="dc-bb54950c">
          {ERRORS.map((e) => (
            <div className="dc-ac555c0c">
              <pre className="dc-57b77e21">{`{e.msg}`}</pre>
              <p className="dc-a7cf3e06">{e.fix}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="dc-28f83755">
        <div className="dc-b014d8d6">
          <span className="dc-d133c7aa">08</span>
          <span className="dc-400524b5">Questions</span>
          <span className="dc-7d23e0ae"></span>
        </div>
        <h2 className="dc-9fb42281">FAQ</h2>
        <div className="dc-bb54950c">
          {FAQ.map((f) => (
            <div className="dc-ac555c0c">
              <div className="dc-67e5881a">{f.q}</div>
              <p className="dc-8c5c30d8">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="dc-531ff350">
        <span className="dc-8c9df278">Freedcamp MCP · 102 tools · MIT licensed</span>
        <a href="https://github.com/agrublev/freedcamp-mcp" className="dc-757117c1">Source on GitHub</a>
        <a href="https://freedcamp.com/manage/account#api" className="dc-05b18997">API keys</a>
      </footer>

    </div>
  </main>
</div>
        </>
    );
}
