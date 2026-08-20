import React, { useState, useEffect } from 'react';

const MCP_URL = 'https://mcp-oauth.freedcamp.top/mcp';

const TOOL_GROUPS = [
  {
    name: 'Tasks',
    desc: 'Query, create, and mutate tasks',
    tools: ['fc_fetch_task', 'fc_fetch_tasks', 'fc_add_task', 'fc_update_task', 'fc_delete_task'],
  },
  {
    name: 'Lists',
    desc: 'Task list groupings',
    tools: ['fc_fetch_lists', 'fc_add_list', 'fc_edit_list', 'fc_delete_list'],
  },
  {
    name: 'Comments',
    desc: 'HTML-formatted threaded comments on any item',
    tools: ['fc_add_comment', 'fc_edit_comment', 'fc_delete_comment'],
  },
  {
    name: 'Calendar Events',
    desc: 'Schedule and update events',
    tools: ['fc_fetch_events', 'fc_fetch_event', 'fc_add_event', 'fc_edit_event', 'fc_delete_event'],
  },
  {
    name: 'Discussions',
    desc: 'Project-level conversations',
    tools: ['fc_fetch_discussions', 'fc_fetch_discussion', 'fc_add_discussion', 'fc_edit_discussion', 'fc_delete_discussion'],
  },
  {
    name: 'Issues',
    desc: 'Bug tracker',
    tools: ['fc_fetch_issues', 'fc_fetch_issue', 'fc_add_issue', 'fc_edit_issue', 'fc_delete_issue'],
  },
  {
    name: 'Milestones',
    desc: 'Project milestones',
    tools: ['fc_fetch_milestones', 'fc_fetch_milestone', 'fc_add_milestone', 'fc_edit_milestone', 'fc_delete_milestone'],
  },
  {
    name: 'Time Tracking',
    desc: 'Timer + manual entries, billing',
    tools: ['fc_fetch_times', 'fc_fetch_time', 'fc_add_time', 'fc_edit_time', 'fc_delete_time', 'fc_time_action'],
  },
  {
    name: 'Wikis',
    desc: 'Versioned wiki documents',
    tools: ['fc_fetch_wikis', 'fc_fetch_wiki', 'fc_add_wiki', 'fc_edit_wiki', 'fc_delete_wiki', 'fc_add_wiki_version'],
  },
  {
    name: 'Projects',
    desc: 'Lifecycle & membership',
    tools: ['fc_fetch_projects', 'fc_fetch_project', 'fc_fetch_recent_project_ids', 'fc_add_project', 'fc_edit_project', 'fc_leave_project', 'fc_delete_project'],
  },
  {
    name: 'CRM — Tasks',
    desc: 'Sales pipeline tasks',
    tools: ['fc_fetch_crm_tasks', 'fc_fetch_crm_task', 'fc_add_crm_task', 'fc_edit_crm_task', 'fc_delete_crm_task'],
  },
  {
    name: 'CRM — Calls',
    desc: 'Call logs & follow-ups',
    tools: ['fc_fetch_crm_calls', 'fc_fetch_crm_call', 'fc_add_crm_call', 'fc_edit_crm_call', 'fc_delete_crm_call'],
  },
  {
    name: 'Users & Account',
    desc: 'Profile, registration, password reset, and account lifecycle',
    tools: ['fc_fetch_groups', 'fc_fetch_users', 'fc_fetch_current_user', 'fc_fetch_user', 'fc_update_current_user', 'fc_register_user', 'fc_delete_account', 'fc_request_password_reset', 'fc_apply_password_reset', 'fc_validate_email', 'fc_delete_avatar'],
  },
  {
    name: 'Notifications',
    desc: 'Inbox, mark-as-read, and project-scoped feed',
    tools: ['fc_fetch_notifications', 'fc_fetch_all_notifications', 'fc_fetch_notifications_by_project', 'fc_update_notification_read', 'fc_edit_notifications'],
  },
  {
    name: 'Files',
    desc: 'Read, upload (multipart), and manage files, plus avatar upload',
    tools: ['fc_fetch_file', 'fc_add_file_meta', 'fc_upload_file', 'fc_delete_file', 'fc_upload_avatar'],
  },
  {
    name: 'Misc',
    desc: 'Custom fields, linked items, overview, session, invitations, calendar feed, favorites, timezones, backups',
    tools: ['fc_fetch_cf_templates', 'fc_fetch_linked_items', 'fc_add_linked_items', 'fc_fetch_overview', 'fc_fetch_current_session', 'fc_fetch_invitations', 'fc_respond_invitation', 'fc_fetch_calendar_items', 'fc_add_favorite_project', 'fc_delete_favorite_project', 'fc_fetch_timezones', 'fc_fetch_backups', 'fc_fetch_wipe_current'],
  },
  {
    name: 'High-level helpers',
    desc: 'Friendly, human-readable-name convenience wrappers',
    tools: ['fc_get_groups_projects', 'fc_add_item_by_names', 'fc_add_comment_by_names', 'fc_update_status'],
  },
];

const TOTAL_TOOLS = TOOL_GROUPS.reduce((n, g) => n + g.tools.length, 0);

const SETUP_STEPS = [
  {
    src: '/add-claude-desktop/0-settings.png',
    caption: <>Claude menu → <strong>Settings…</strong></>,
  },
  {
    src: '/add-claude-desktop/1-connectors.png',
    caption: <><strong>Connectors</strong> in the sidebar, then <strong>Add</strong>.</>,
  },
  {
    src: '/add-claude-desktop/2-custom.png',
    caption: <><strong>Add custom connector</strong>.</>,
  },
  {
    src: '/add-claude-desktop/3-add.png',
    caption: (
      <>
        Name it <strong>Freedcamp-MCP</strong>, paste <code>{MCP_URL}</code>, then{' '}
        <strong>Continue</strong>.
      </>
    ),
  },
  {
    src: '/add-claude-desktop/4-mcp.png',
    caption: (
      <>
        OAuth is auto-detected — leave the defaults (<em>Always required</em>,{' '}
        <em>No client ID — register one automatically</em>) and click <strong>Add</strong>.
      </>
    ),
  },
  {
    src: '/add-claude-desktop/5-add-credentials.png',
    caption: (
      <>
        Your browser opens Freedcamp's sign-in page — enter your <strong>API key</strong> and{' '}
        <strong>API secret</strong>, then <strong>Authorize</strong>.
      </>
    ),
  },
];

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
  { id: 'claude-desktop', label: 'Claude Desktop' },
  { id: 'claude-code', label: 'Claude Code' },
  { id: 'cursor', label: 'Cursor / Cline / Continue' },
  { id: 'codex', label: 'Codex CLI' },
  { id: 'chatgpt', label: 'ChatGPT' },
  { id: 'curl', label: 'Verify with curl' },
];

function Quickstart({ onOpenImage }) {
  const [tab, setTab] = useState('claude-desktop');
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

      {tab === 'claude-desktop' && (
        <div className="tabs__panel">
          <p>
            Every client below uses <strong>OAuth 2.1</strong> — no headers, no config-file
            secrets. Claude Desktop's connector UI walks you through it:
          </p>
          <ol className="steps">
            {SETUP_STEPS.map((s) => (
              <li key={s.src}>
                {s.caption}
                <button
                  type="button"
                  className="gallery__item"
                  style={{ maxWidth: 360, marginTop: 12 }}
                  onClick={() => onOpenImage(s.src)}
                  aria-label="Open screenshot"
                >
                  <img src={s.src} alt="" loading="lazy" />
                </button>
              </li>
            ))}
          </ol>
          <div className="callout">
            <strong>That's it</strong> — Claude Desktop stores and refreshes the token itself.
            The {TOTAL_TOOLS}+ Freedcamp tools appear in the tools menu right away, no restart
            needed.
          </div>
        </div>
      )}

      {tab === 'claude-code' && (
        <div className="tabs__panel">
          <p>Register the server, then finish the one-time browser sign-in.</p>
          <Code lang="bash">{`claude mcp add --transport http freedcamp ${MCP_URL}`}</Code>
          <p className="muted">
            <code>claude mcp list</code> will show it as "Needs authentication" — finish it by
            selecting <code>freedcamp</code> and choosing <em>Authenticate</em>, or from inside a
            session:
          </p>
          <Code lang="bash">{`/mcp`}</Code>
          <p className="muted">
            Your browser opens Freedcamp's sign-in page — enter your API key + secret once.
            Claude Code stores the token and refreshes it automatically after that.
          </p>
        </div>
      )}

      {tab === 'cursor' && (
        <div className="tabs__panel">
          <p>
            Any MCP client with OAuth discovery (Cursor, Cline, Continue, Windsurf, …) just needs
            the URL — no headers to manage.
          </p>
          <Code lang="json">{`{
  "mcpServers": {
    "freedcamp": {
      "url": "${MCP_URL}"
    }
  }
}`}</Code>
          <p className="muted">
            The client detects the <code>WWW-Authenticate</code> challenge, registers itself
            automatically (Dynamic Client Registration), and opens your browser to Freedcamp's
            sign-in page. Enter your API key + secret once — the client stores and refreshes the
            token from then on.
          </p>
        </div>
      )}

      {tab === 'codex' && (
        <div className="tabs__panel">
          <p>Requires a recent Codex CLI — check whether yours has the <code>mcp add</code>/<code>login</code> command group:</p>
          <Code lang="bash">{`codex mcp add --help`}</Code>
          <p className="muted">
            If that errors, or doesn't list a <code>--url</code> flag, update first — older
            builds' <code>codex mcp</code> only runs Codex itself as a server and won't recognize{' '}
            <code>add</code>/<code>login</code> at all:
          </p>
          <Code lang="bash">{`npm install -g @openai/codex@latest`}</Code>
          <p className="muted">Then add the server and sign in:</p>
          <Code lang="bash">{`codex mcp add freedcamp --url ${MCP_URL}
codex mcp login freedcamp`}</Code>
          <p className="muted">Or edit <code>~/.codex/config.toml</code> by hand instead of <code>mcp add</code>:</p>
          <Code lang="toml">{`[mcp_servers.freedcamp]
url = "${MCP_URL}"`}</Code>
          <div className="callout">
            <code>codex mcp login</code> opens your browser to Freedcamp's sign-in page — enter
            your API key + secret once. Codex stores and refreshes the token after that. Check
            status any time with <code>codex mcp list</code>.
          </div>
        </div>
      )}

      {tab === 'chatgpt' && (
        <div className="tabs__panel">
          <p>
            ChatGPT <em>Custom Connectors</em> (Pro / Team / Enterprise / Edu) now connect
            directly — the OAuth flow removes the old two-header limitation, no proxy needed.
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
              Name it "Freedcamp", paste <code>{MCP_URL}</code> as the MCP server URL, and set
              Authentication to <strong>OAuth</strong>.
            </li>
            <li>
              Click <strong>Create</strong> — ChatGPT redirects you to Freedcamp's sign-in page.
              Enter your API key + secret once.
            </li>
          </ol>
        </div>
      )}

      {tab === 'curl' && (
        <div className="tabs__panel">
          <p>
            OAuth means <code>tools/list</code> needs a bearer token from a completed sign-in —
            but you can sanity-check the server without one:
          </p>
          <Code lang="bash">{`curl -s https://mcp-oauth.freedcamp.top/.well-known/oauth-authorization-server | jq`}</Code>
          <p className="muted">Confirm the process is alive:</p>
          <Code lang="bash">{`curl -s https://mcp-oauth.freedcamp.top/healthz`}</Code>
          <p className="muted">
            To list all ~{TOTAL_TOOLS} tools with curl, complete the browser sign-in through any
            client above first, then reuse the resulting bearer token:
          </p>
          <Code lang="bash">{`curl -X POST ${MCP_URL} \\
  -H 'Content-Type: application/json' \\
  -H 'Accept: application/json, text/event-stream' \\
  -H 'Authorization: Bearer YOUR_TOKEN' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | jq '.result.tools[].name'`}</Code>
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
            <span className="dot" /> Hosted &middot; OAuth 2.1 &middot; Zero install
          </div>
          <h1>
            Project management for <span className="grad">any AI assistant</span>.
          </h1>
          <p className="hero__lead">
            A hosted Model Context Protocol server that exposes the Freedcamp API to Claude
            Desktop, Claude Code, ChatGPT, Cursor, Cline, Continue, and any other MCP-compatible
            client. Sign in once with OAuth — no headers, no secrets in config files —{' '}
            <strong>{TOTAL_TOOLS}+ tools</strong> in a single endpoint.
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
            <Card icon="🔐" title="One-time OAuth sign-in">
              Standard OAuth 2.1. Enter your Freedcamp API key + secret once in your browser —
              your client stores and refreshes the token. No headers, no plaintext secrets in
              config files.
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
          lead="Generate a key and secret in Freedcamp — you'll enter them once during the OAuth sign-in, never pasted into a config file."
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
            <li>
              Connect a client below — you'll paste these into Freedcamp's own sign-in page, not
              into your AI client's config.
            </li>
          </ol>
        </Section>

        <Section
          id="quickstart"
          eyebrow="Step 2"
          title="Connect your AI client."
          lead={
            <>
              Every client speaks the same OAuth 2.1 flow — point it at the URL below and sign in
              when prompted. The URL must end in <code>/mcp</code>.
            </>
          }
        >
          <Quickstart onOpenImage={setLightbox} />
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
          lead="Standard OAuth 2.1 — sign in once in your browser, your client handles the rest from there."
        >
          <ol className="steps">
            <li>
              Your client requests <code>{MCP_URL}</code> and gets a 401 pointing at this
              server's OAuth metadata.
            </li>
            <li>
              The client registers itself dynamically (DCR) and opens your browser to{' '}
              <code>/authorize</code>.
            </li>
            <li>
              You enter your Freedcamp API key + secret — verified against the real Freedcamp API
              before anything is issued.
            </li>
            <li>
              The server returns a bearer token; your client stores it and refreshes it
              automatically from then on.
            </li>
          </ol>

          <div className="grid grid--2 grid--mt">
            <Card icon="🔑" title="PKCE + Dynamic Client Registration">
              A standard OAuth 2.1 authorization-code flow. No manual client setup for any client
              that speaks MCP OAuth.
            </Card>
            <Card icon="🗝️" title="No server-side session to leak">
              Bearer tokens carry your Freedcamp credentials, AES-256-GCM encrypted with a key
              derived from a server secret — nothing is stored in a database to look up or leak.
            </Card>
            <Card icon="⏳" title="30-day expiry">
              Tokens expire automatically after 30 days; your client re-authenticates
              transparently.
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
          title="Status & OAuth introspection endpoints."
          lead="Quick checks for liveness and the OAuth flow."
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
              <div>Process liveness</div>
            </div>
            <div className="table__row">
              <div>
                <code>GET /.well-known/oauth-authorization-server</code>
              </div>
              <div>OAuth metadata — authorization, token, and registration endpoints</div>
            </div>
            <div className="table__row">
              <div>
                <code>GET /authorize</code>
              </div>
              <div>The sign-in page — enter your Freedcamp API key + secret</div>
            </div>
            <div className="table__row">
              <div>
                <code>ALL /mcp</code>
              </div>
              <div>The MCP endpoint itself — requires a bearer token from the flow above</div>
            </div>
          </div>
        </Section>

        <section className="cta">
          <h2>
            Ready in <span className="grad">a single sign-in.</span>
          </h2>
          <p className="lead">
            Generate your Freedcamp API key, point your AI client at the endpoint, and authorize
            once.
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
            <a href="https://mcp-oauth.freedcamp.top/healthz" target="_blank" rel="noreferrer">
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
