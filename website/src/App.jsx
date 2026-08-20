import React, { useState, useEffect } from 'react';

const MCP_URL = 'https://mcp.freedcamp.top/mcp';

const TOOL_GROUPS = [
  {
    name: 'High-level helpers',
    desc: 'Friendly name-based actions',
    tools: ['get-groups-projects', 'add-app-item', 'add-comment', 'update-status'],
  },
  {
    name: 'Tasks',
    desc: 'Filter, query, and mutate tasks',
    tools: ['tasks_list', 'tasks_get', 'tasks_get_by_project', 'tasks_add', 'tasks_edit', 'tasks_delete'],
  },
  {
    name: 'Lists',
    desc: 'Task list groupings',
    tools: ['lists_get', 'lists_add', 'lists_edit', 'lists_delete'],
  },
  {
    name: 'Comments',
    desc: 'HTML-formatted threaded comments',
    tools: ['comments_add', 'comments_edit', 'comments_delete'],
  },
  {
    name: 'Calendar Events',
    desc: 'Schedule and update events',
    tools: ['events_list', 'events_get', 'events_add', 'events_edit', 'events_delete'],
  },
  {
    name: 'Discussions',
    desc: 'Project-level conversations',
    tools: ['discussions_list', 'discussions_get', 'discussions_add', 'discussions_edit', 'discussions_delete'],
  },
  {
    name: 'Files',
    desc: 'Read, upload (multipart), and manage files',
    tools: ['files_get', 'files_add_meta', 'files_upload', 'files_delete'],
  },
  {
    name: 'Issues',
    desc: 'Bug tracker',
    tools: ['issues_list', 'issues_get', 'issues_add', 'issues_edit', 'issues_delete'],
  },
  {
    name: 'Milestones',
    desc: 'Project milestones',
    tools: ['milestones_list', 'milestones_get', 'milestones_add', 'milestones_edit', 'milestones_delete'],
  },
  {
    name: 'CRM — Tasks',
    desc: 'Sales pipeline tasks',
    tools: ['crm_tasks_list', 'crm_tasks_get', 'crm_tasks_add', 'crm_tasks_edit', 'crm_tasks_delete'],
  },
  {
    name: 'CRM — Calls',
    desc: 'Call logs & follow-ups',
    tools: ['crm_calls_list', 'crm_calls_get', 'crm_calls_add', 'crm_calls_edit', 'crm_calls_delete'],
  },
  {
    name: 'Time Tracking',
    desc: 'Timer + manual entries, billing',
    tools: ['times_list', 'times_get', 'times_add', 'times_edit', 'times_delete', 'times_start', 'times_stop', 'times_bill', 'times_unbill'],
  },
  {
    name: 'Wikis',
    desc: 'Versioned wiki documents',
    tools: ['wikis_list', 'wikis_get', 'wikis_add', 'wikis_edit', 'wikis_delete', 'wikis_add_version'],
  },
  {
    name: 'Notifications',
    desc: 'Inbox, mark-as-read, and project-scoped feed',
    tools: ['notifications_list', 'notifications_recent', 'notifications_edit', 'notifications_list_by_project'],
  },
  {
    name: 'Calendar (aggregated)',
    desc: 'Cross-app calendar feed',
    tools: ['calendar_items_get'],
  },
  {
    name: 'Projects',
    desc: 'Lifecycle & membership',
    tools: ['projects_list', 'projects_get', 'projects_recent', 'projects_add', 'projects_edit', 'projects_leave', 'projects_delete'],
  },
  {
    name: 'Linked items',
    desc: 'Cross-link tasks, issues, milestones',
    tools: ['linked_items_get', 'linked_items_add'],
  },
  {
    name: 'Favorites',
    desc: 'Pin frequent projects',
    tools: ['favorite_projects_add', 'favorite_projects_delete'],
  },
  {
    name: 'Workspace',
    desc: 'Groups, custom fields, users, timezones, backups',
    tools: ['groups_get', 'cf_templates_get', 'users_get', 'timezones_get', 'backups_list'],
  },
  {
    name: 'Overviews',
    desc: 'Project overview application data',
    tools: ['overviews_get'],
  },
  {
    name: 'Sessions & current user',
    desc: 'Authenticated session and profile management',
    tools: ['sessions_current_get', 'users_current_get', 'users_get_by_id', 'users_current_edit', 'users_register'],
  },
  {
    name: 'Invitations',
    desc: 'Pending project invitations',
    tools: ['invitations_list', 'invitations_respond'],
  },
  {
    name: 'Avatars',
    desc: 'Upload (multipart) or reset profile avatar',
    tools: ['avatar_upload', 'avatar_delete'],
  },
  {
    name: 'Validations',
    desc: 'Validate addressable identifiers',
    tools: ['validations_email'],
  },
  {
    name: 'Account lifecycle',
    desc: 'Destructive — password reset and account deletion',
    tools: ['wipe_current_get', 'wipe_current_delete', 'password_reset_request', 'password_reset_apply'],
  },
];

const TOTAL_TOOLS = TOOL_GROUPS.reduce((n, g) => n + g.tools.length, 0);

function Code({ children, lang }) {
  const [copied, setCopied] = useState(false);
  const text = String(children).trim();
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch (e) {
      // ignore
    }
  };
  return (
    <div className="code">
      <div className="code__bar">
        <span className="code__lang">{lang || 'shell'}</span>
        <button className="code__copy" onClick={onCopy} type="button">
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre>
        <code>{text}</code>
      </pre>
    </div>
  );
}

const TABS = [
  { id: 'claude-code', label: 'Claude Code' },
  { id: 'claude-desktop', label: 'Claude Desktop' },
  { id: 'cursor', label: 'Cursor / Cline / Continue' },
  { id: 'codex', label: 'Codex CLI' },
  { id: 'chatgpt', label: 'ChatGPT Desktop' },
  { id: 'curl', label: 'Verify with curl' },
];

function Quickstart() {
  const [tab, setTab] = useState('claude-code');
  return (
    <div className="quickstart">
      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tabs__btn ${tab === t.id ? 'is-active' : ''}`}
            onClick={() => setTab(t.id)}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'claude-code' && (
        <div className="tabs__panel">
          <p>One command — registers the server with the Claude Code CLI.</p>
          <Code lang="bash">{`claude mcp add freedcamp \\
  --transport http \\
  ${MCP_URL} \\
  --header "X-Freedcamp-Api-Key: YOUR_KEY" \\
  --header "X-Freedcamp-Api-Secret: YOUR_SECRET"`}</Code>
          <p className="muted">Verify it registered:</p>
          <Code lang="bash">{`claude mcp list`}</Code>
        </div>
      )}

      {tab === 'claude-desktop' && (
        <div className="tabs__panel">
          <p>
            <strong>One-command install</strong> — autodetects your Claude Desktop config
            path, preserves existing servers, and backs up the previous file.
          </p>
          <Code lang="bash">{`curl -fsSL https://mcp.freedcamp.top/install.js | node - YOUR_KEY YOUR_SECRET`}</Code>
          <p className="muted">Or with environment variables:</p>
          <Code lang="bash">{`FREEDCAMP_API_KEY=... FREEDCAMP_API_SECRET=... \\
  curl -fsSL https://mcp.freedcamp.top/install.js | node -`}</Code>
          <p className="muted">Or edit the config by hand:</p>
          <Code lang="json">{`{
  "mcpServers": {
    "freedcamp": {
      "command": "npx",
      "args": [
        "-y",
        "fc-remote-mcp",
        "${MCP_URL}",
        "--transport",
        "http-only",
        "--header",
        "X-Freedcamp-Api-Key: YOUR_KEY",
        "--header",
        "X-Freedcamp-Api-Secret: YOUR_SECRET"
      ]
    }
  }
}`}</Code>
          <div className="callout">
            <strong>Then fully quit and restart Claude Desktop</strong> (Cmd+Q on macOS — closing
            the window isn't enough). The 100+ Freedcamp tools will appear in the tools menu.
          </div>
        </div>
      )}

      {tab === 'cursor' && (
        <div className="tabs__panel">
          <p>Most MCP clients support HTTP transport with custom headers natively.</p>
          <Code lang="json">{`{
  "mcpServers": {
    "freedcamp": {
      "url": "${MCP_URL}",
      "transport": "http",
      "headers": {
        "X-Freedcamp-Api-Key":    "YOUR_KEY",
        "X-Freedcamp-Api-Secret": "YOUR_SECRET"
      }
    }
  }
}`}</Code>
          <p className="muted">
            If a client doesn't accept custom headers, fall back to the <code>fc-remote-mcp</code>{' '}
            stdio bridge from the Claude Desktop tab.
          </p>
        </div>
      )}

      {tab === 'codex' && (
        <div className="tabs__panel">
          <p>
            <strong>One-command install</strong> — autodetects <code>~/.codex/config.toml</code>,
            preserves every other <code>[mcp_servers.*]</code> block and top-level key, backs up
            the previous file.
          </p>
          <Code lang="bash">{`curl -fsSL https://mcp.freedcamp.top/install-codex.js | node - YOUR_KEY YOUR_SECRET`}</Code>
          <p className="muted">Or with environment variables:</p>
          <Code lang="bash">{`FREEDCAMP_API_KEY=... FREEDCAMP_API_SECRET=... \\
  curl -fsSL https://mcp.freedcamp.top/install-codex.js | node -`}</Code>
          <p className="muted">Or edit the config by hand:</p>
          <Code lang="toml">{`[mcp_servers.freedcamp]
command = "npx"
args = [
  "-y",
  "fc-remote-mcp",
  "${MCP_URL}",
  "--transport", "http-only",
  "--header", "X-Freedcamp-Api-Key: YOUR_KEY",
  "--header", "X-Freedcamp-Api-Secret: YOUR_SECRET"
]`}</Code>
          <div className="callout">
            Then <strong>restart Codex CLI</strong> — the Freedcamp tools become available on the
            next session.
          </div>
        </div>
      )}

      {tab === 'chatgpt' && (
        <div className="tabs__panel">
          <p>
            ChatGPT <em>Custom Connectors</em> (Pro / Team / Enterprise / Edu) currently accept
            either an OAuth-discoverable MCP server or <strong>one</strong> auth header. Because
            Freedcamp needs <strong>two</strong> headers (key + secret), it doesn't drop in
            directly.
          </p>
          <div className="callout">
            <strong>Recommended:</strong> use <strong>Codex CLI</strong> (next tab) instead — it
            runs <code>fc-remote-mcp</code> as a local stdio bridge and supports multiple headers
            natively.
          </div>
          <p className="muted">
            Alternative: stand up a tiny one-header proxy that accepts{' '}
            <code>Authorization: Bearer KEY:SECRET</code>, splits it back into the two Freedcamp
            headers, and forwards to <code>{MCP_URL}</code>. Then point a custom connector at
            your proxy URL. Any small Cloudflare Worker or Express handler works.
          </p>
        </div>
      )}

      {tab === 'curl' && (
        <div className="tabs__panel">
          <p>Sanity-check the endpoint and list all advertised tools:</p>
          <Code lang="bash">{`curl -X POST ${MCP_URL} \\
  -H 'Content-Type: application/json' \\
  -H 'Accept: application/json, text/event-stream' \\
  -H 'X-Freedcamp-Api-Key: YOUR_KEY' \\
  -H 'X-Freedcamp-Api-Secret: YOUR_SECRET' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | jq '.result.tools[].name'`}</Code>
          <p className="muted">You should see ~{TOTAL_TOOLS} tool names.</p>
        </div>
      )}
    </div>
  );
}

function Section({ id, eyebrow, title, lead, children }) {
  return (
    <section id={id} className="section">
      <div className="section__head">
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2>{title}</h2>
        {lead && <p className="lead">{lead}</p>}
      </div>
      {children}
    </section>
  );
}

function Lightbox({ src, onClose }) {
  useEffect(() => {
    if (!src) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      className="lightbox"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Screenshot preview"
    >
      <button
        type="button"
        className="lightbox__close"
        onClick={onClose}
        aria-label="Close"
      >
        ×
      </button>
      <img
        className="lightbox__img"
        src={src}
        alt=""
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export default function App() {
  const [lightbox, setLightbox] = useState(null);
  return (
    <div className="page">
      <div className="bg" aria-hidden="true">
        <div className="bg__grid" />
        <div className="bg__glow bg__glow--a" />
        <div className="bg__glow bg__glow--b" />
      </div>

      <header className="nav">
        <a href="#top" className="brand">
          <span className="brand__mark" />
          <span className="brand__text">Freedcamp <em>MCP</em></span>
        </a>
        <nav className="nav__links">
          <a href="#quickstart">Quickstart</a>
          <a href="#gallery">Gallery</a>
          <a href="#n8n">n8n</a>
          <a href="#tools">Tools</a>
          <a href="#health">Health</a>
          <a
            href="https://github.com/modelcontextprotocol"
            target="_blank"
            rel="noreferrer"
            className="nav__cta"
          >
            What is MCP?
          </a>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero__pill">
            <span className="dot" /> Hosted &middot; Multi-tenant &middot; Zero install
          </div>
          <h1>
            Project management for <span className="grad">any AI assistant</span>.
          </h1>
          <p className="hero__lead">
            A hosted Model Context Protocol server that exposes the Freedcamp API to Claude
            Desktop, Claude Code, ChatGPT, Cursor, Cline, Continue, and any other MCP-compatible
            client — <strong>{TOTAL_TOOLS}+ tools</strong> in a single endpoint.
          </p>

          <div className="hero__endpoint">
            <span className="hero__endpointLabel">Endpoint</span>
            <code>{MCP_URL}</code>
          </div>

          <div className="hero__cta">
            <a className="btn btn--primary" href="#quickstart">
              Get started in 60 seconds
            </a>
            <a className="btn btn--ghost" href="#tools">
              Browse {TOTAL_TOOLS}+ tools
            </a>
          </div>

          <div className="hero__quotes">
            <blockquote>
              "Create a 'Fix login race condition' task in the API project, due Friday, assigned
              to me, In Progress."
            </blockquote>
            <blockquote>
              "Show all tasks I'm assigned to that are overdue, grouped by project."
            </blockquote>
            <blockquote>
              "Log 45 minutes against today on the Acme refactor and mark it billable."
            </blockquote>
          </div>
        </section>

        <Section
          id="why"
          eyebrow="Why"
          title="Talk to Freedcamp from inside any AI."
          lead="Freedcamp is a full-featured PM tool — tasks, milestones, time tracking, CRM, wikis, calendar, files, issues. Stop tab-hopping. Drive it from your AI."
        >
          <div className="grid grid--3">
            <Card icon="⚡" title="Hosted, no install">
              Point your client at one URL. No server to run, no Docker, no cron. The endpoint is
              maintained for you.
            </Card>
            <Card icon="🔐" title="Per-user credentials">
              Each request carries your own Freedcamp API key + secret as headers. Sessions never
              mix. Credentials are redacted from logs and never persisted to disk.
            </Card>
            <Card icon="🧰" title={`${TOTAL_TOOLS}+ tools, one endpoint`}>
              Tasks, lists, comments, events, discussions, files, issues, milestones, CRM, time,
              wikis, notifications, calendar, projects — all live in one place.
            </Card>
          </div>
        </Section>

        <Section
          id="credentials"
          eyebrow="Step 1"
          title="Get your Freedcamp API credentials."
          lead="Generate a key and secret in Freedcamp — these two values are the only thing you need."
        >
          <ol className="steps">
            <li>
              Open Freedcamp → <strong>My Account → Integrations → API</strong>, or jump directly
              to{' '}
              <a href="https://freedcamp.com/manage/account#api" target="_blank" rel="noreferrer">
                freedcamp.com/manage/account#api
              </a>
              .
            </li>
            <li>
              Generate an API key. Copy both the <code>API Key</code> and the{' '}
              <code>API Secret</code>.
            </li>
            <li>Plug them into your AI client config below.</li>
          </ol>
        </Section>

        <Section
          id="quickstart"
          eyebrow="Step 2"
          title="Connect your AI client."
          lead={
            <>
              The same configuration shape works for every MCP-compatible client. The URL must
              end in <code>/mcp</code> — the root returns server metadata.
            </>
          }
        >
          <Quickstart />
        </Section>

        <Section
          id="gallery"
          eyebrow="In action"
          title="Live inside your AI client."
          lead="The Freedcamp tools appear natively in each client's tools menu — call them by description, get structured results back."
        >
          {[
            {
              heading: 'Claude Desktop',
              alt: 'Claude Desktop using Freedcamp MCP',
              images: [
                '/claudeDesktopTasks.png',
                '/claudeDesktopNotifications.png',
                '/ClaudeDesktopScreen1.png',
                '/ClaudeDesktopScreen2.png',
                '/ClaudeDesktopScreen3.png',
                '/ClaudeDesktopScreen4.png',
              ],
            },
            {
              heading: 'Claude Code',
              alt: 'Claude Code using Freedcamp MCP',
              images: ['/ClaudeCode1.png', '/ClaudeCode2.png'],
            },
            {
              heading: 'Codex CLI',
              alt: 'Codex CLI using Freedcamp MCP',
              images: ['/CodexCli1.png', '/CodexCli2.png'],
            },
          ].map((group) => (
            <div key={group.heading} className="gallery-group">
              <h3 className="gallery-group__title">{group.heading}</h3>
              <div className="gallery">
                {group.images.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    className="gallery__item"
                    onClick={() => setLightbox(src)}
                    aria-label={`Open ${group.heading} screenshot ${i + 1}`}
                  >
                    <img
                      src={src}
                      alt={`${group.alt} — screenshot ${i + 1}`}
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </Section>

        <Section
          id="n8n"
          eyebrow="Automation"
          title="Drop-in n8n workflow."
          lead="Pipe a Gmail trigger straight into the Freedcamp MCP — every new email becomes a task. Two ready-to-import workflow JSONs, no LLM required."
        >
          <div className="grid grid--2">
            <div className="card">
              <div className="card__icon" aria-hidden="true">📥</div>
              <h3>Reference workflow</h3>
              <p>
                Clean, env-driven version. Set <code>FREEDCAMP_API_KEY</code>,{' '}
                <code>FREEDCAMP_API_SECRET</code>, and <code>FREEDCAMP_PROJECT_ID</code> as n8n
                environment variables, attach a Gmail OAuth credential, and activate.
              </p>
              <div className="cta__buttons" style={{ marginTop: 12 }}>
                <a
                  className="btn btn--primary"
                  href="/n8n-workflow-email-to-freedcamp.json"
                  download
                >
                  Download JSON
                </a>
                <a
                  className="btn btn--ghost"
                  href="/n8n-workflow-email-to-freedcamp.json"
                  target="_blank"
                  rel="noreferrer"
                >
                  View raw
                </a>
              </div>
            </div>

            <div className="card">
              <div className="card__icon" aria-hidden="true">🧪</div>
              <h3>Sample workflow</h3>
              <p>
                A working example with a real <code>project_id</code> hard-coded — open it, swap
                in your own key, secret, and project id, and import. Fastest way to see a task
                appear in Freedcamp.
              </p>
              <div className="cta__buttons" style={{ marginTop: 12 }}>
                <a
                  className="btn btn--primary"
                  href="/n8n-workflow-email-to-freedcamp-sample.json"
                  download
                >
                  Download JSON
                </a>
                <a
                  className="btn btn--ghost"
                  href="/n8n-workflow-email-to-freedcamp-sample.json"
                  target="_blank"
                  rel="noreferrer"
                >
                  View raw
                </a>
              </div>
            </div>
          </div>

          <div className="callout" style={{ marginTop: 18 }}>
            <strong>How to import:</strong> in n8n choose <em>Workflows → Import from File</em>{' '}
            and select the downloaded <code>.json</code>. Then set credentials / env vars and
            activate.
          </div>
        </Section>

        <Section
          id="auth"
          eyebrow="Step 3"
          title="Authentication & security."
          lead="Two headers per request. Stateless, redacted, rate-limited."
        >
          <div className="table">
            <div className="table__row table__row--head">
              <div>Header</div>
              <div>Purpose</div>
            </div>
            <div className="table__row">
              <div>
                <code>X-Freedcamp-Api-Key</code>
              </div>
              <div>Your Freedcamp API key</div>
            </div>
            <div className="table__row">
              <div>
                <code>X-Freedcamp-Api-Secret</code>
              </div>
              <div>Your Freedcamp API secret</div>
            </div>
          </div>

          <div className="grid grid--2 grid--mt">
            <Card icon="🪪" title="Redacted from logs">
              Pino redaction strips key/secret fields and headers — only an 8-char hash is kept
              for correlation.
            </Card>
            <Card icon="💾" title="Never persisted">
              The server runs stateless / in-memory. No database, no disk writes of credentials.
            </Card>
            <Card icon="🚦" title="Rate-limited per credential pair">
              60 req/min by default. Exceeding returns JSON-RPC error <code>-32029</code>.
            </Card>
            <Card icon="🔒" title="TLS end to end">
              Client → server is TLS. Server → Freedcamp is HMAC-signed HTTPS.
            </Card>
          </div>
        </Section>

        <Section
          id="tools"
          eyebrow="Step 4"
          title={`${TOTAL_TOOLS}+ tools across every Freedcamp app.`}
          lead="Live parameter schemas appear inline in any MCP client via tools/list — nothing to memorize."
        >
          <div className="grid grid--3">
            {TOOL_GROUPS.map((g) => (
              <div key={g.name} className="toolgroup">
                <div className="toolgroup__head">
                  <h3>{g.name}</h3>
                  <span className="toolgroup__count">{g.tools.length}</span>
                </div>
                <p className="toolgroup__desc">{g.desc}</p>
                <ul className="toolgroup__list">
                  {g.tools.map((t) => (
                    <li key={t}>
                      <code>{t}</code>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="constants">
            <h3>Constants the AI is taught</h3>
            <p className="muted">
              Inlined in tool descriptions so the model picks the right IDs without you reminding
              it.
            </p>
            <div className="grid grid--3 grid--mt">
              <Card icon="🆔" title="App IDs">
                Tasks=2, Discussions=3, Milestones=4, Time=5, Files=6, Issue Tracker=13, Wikis=14,
                CRM=16, Passwords=17, Calendar=19, Planner=47, Translations=48
              </Card>
              <Card icon="📍" title="Task statuses">
                0 = Not Started · 1 = Completed · 2 = In Progress · 3 = Invalid · 4 = Review
              </Card>
              <Card icon="🚩" title="Priorities">
                0 = None · 1 = Low · 2 = Medium · 3 = High
              </Card>
            </div>
          </div>
        </Section>

        <Section
          id="health"
          eyebrow="Health"
          title="Status & introspection endpoints."
          lead="Quick checks for liveness, deep health, and server metadata."
        >
          <div className="table">
            <div className="table__row table__row--head">
              <div>Endpoint</div>
              <div>What it tells you</div>
            </div>
            <div className="table__row">
              <div>
                <code>GET /healthz</code>
              </div>
              <div>Process liveness, cache size, uptime</div>
            </div>
            <div className="table__row">
              <div>
                <code>GET /healthz/deep</code>
              </div>
              <div>Whether the server can currently reach Freedcamp</div>
            </div>
            <div className="table__row">
              <div>
                <code>GET /</code>
              </div>
              <div>Server metadata, endpoint URLs, rate-limit config</div>
            </div>
          </div>
        </Section>

        <section className="cta">
          <h2>
            Ready in <span className="grad">a single command.</span>
          </h2>
          <p className="lead">
            Generate your Freedcamp API key, paste two headers into your AI client, and start
            asking.
          </p>
          <div className="cta__buttons">
            <a
              className="btn btn--primary"
              href="https://freedcamp.com/manage/account#api"
              target="_blank"
              rel="noreferrer"
            >
              Get API credentials
            </a>
            <a className="btn btn--ghost" href="#quickstart">
              Connect a client
            </a>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer__inner">
          <div>
            <span className="brand__mark" />
            <strong>Freedcamp MCP</strong>
            <span className="muted">  ·  MIT License</span>
          </div>
          <div className="footer__links">
            <a href={MCP_URL}>Endpoint</a>
            <a href="https://mcp.freedcamp.top/healthz" target="_blank" rel="noreferrer">
              Health
            </a>
            <a href="https://modelcontextprotocol.io" target="_blank" rel="noreferrer">
              MCP Spec
            </a>
            <a href="https://freedcamp.com" target="_blank" rel="noreferrer">
              Freedcamp
            </a>
          </div>
        </div>
      </footer>

      <Lightbox src={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}

function Card({ icon, title, children }) {
  return (
    <div className="card">
      <div className="card__icon" aria-hidden="true">
        {icon}
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
