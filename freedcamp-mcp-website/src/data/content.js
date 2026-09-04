// Single source of truth for the docs site: the exact data extracted from
// Freedcamp MCP Docs.dc.html (claude_design import) — 17 groups / 102 tools,
// sample argument values, recipes, errors, FAQ, clients and env vars.

import RAW from './design-data.json';

export const MCP_URL = 'https://mcp.freedcamp.com/mcp';
export const SITE_URL = 'https://mcp-docs.freedcamp.top';
export const SITE_NAME = 'Freedcamp MCP';
export const REPO_URL = 'https://github.com/agrublev/freedcamp-mcp';
export const API_KEYS_URL = 'https://freedcamp.com/manage/account#api';

export const DARK = RAW.DARK;
export const CLIENTS = RAW.CLIENTS;
export const ENV_VARS = RAW.ENV_VARS;
export const RECIPES = RAW.RECIPES;
export const ERRORS = RAW.ERRORS;
export const FAQ = RAW.FAQ;
export const CATALOG = RAW.CATALOG;

export const TOTAL_TOOLS = CATALOG.reduce((n, g) => n + g.tools.length, 0);
export const TOTAL_GROUPS = CATALOG.length;

// ── sample argument values (verbatim from the design) ──────────
const SAMPLE = RAW.SAMPLE;

function sampleFor(name, type) {
    if (Object.prototype.hasOwnProperty.call(SAMPLE, name)) return SAMPLE[name];
    if (type === 'int' || type === 'number') return 1;
    if (type === 'boolean') return true;
    if (type.indexOf('[]') > -1) return [];
    if (type === 'object') return {};
    return '…';
}

// ── decorate() — mirrors the design's badge/tone/example logic ──
export function decorate(tool) {
    const name = tool.name;
    const readOnly = /^fc_(fetch|validate|get)_/.test(name);
    const destructive = /^fc_delete_/.test(name) || name === 'fc_leave_project';
    const rawParams = tool.rawParams || tool.params || [];
    const params = rawParams.map((p) => ({
        name: p[0],
        type: p[2] ? `${p[1]} · required` : p[1],
        note: p[3],
    }));
    let example = tool.exampleOverride;
    if (!example) {
        const args = {};
        rawParams.forEach((p) => {
            if (!p[2]) return;
            const key = p[0].indexOf('.') > -1 ? p[0].split('.')[0] : p[0];
            args[key] = sampleFor(key, p[1]);
        });
        example = JSON.stringify({ name, arguments: args }, null, 2);
    }
    return {
        name,
        desc: tool.desc,
        params,
        hasParams: params.length > 0,
        noParams: params.length === 0,
        example,
        badge: destructive ? 'Destructive' : readOnly ? 'Read-only' : 'Writes',
        tone: destructive ? 'danger' : readOnly ? 'info' : 'success',
    };
}

// Search filter — same rules as the design: name + desc + param names/notes.
export function filterCatalog(query) {
    const q = (query || '').trim().toLowerCase();
    const groups = [];
    let total = 0;
    CATALOG.forEach((grp) => {
        const kept = [];
        grp.tools.forEach((tool) => {
            if (q) {
                const hay = (
                    tool.name +
                    ' ' +
                    tool.desc +
                    ' ' +
                    (tool.rawParams || tool.params || [])
                        .map((p) => p[0] + ' ' + p[3])
                        .join(' ')
                ).toLowerCase();
                if (hay.indexOf(q) === -1) return;
            }
            kept.push(decorate(tool));
        });
        total += kept.length;
        if (kept.length) {
            groups.push({
                name: grp.name,
                anchor: grp.anchor,
                blurb: grp.blurb,
                countLabel: kept.length === 1 ? '1 tool' : `${kept.length} tools`,
                tools: kept,
            });
        }
    });
    return { groups, total };
}

export const NAV_GROUPS = CATALOG.map((grp) => ({
    name: grp.name,
    href: `#${grp.anchor}`,
    count: grp.tools.length,
}));

// Walkthrough steps (labels + screenshots, from the design)
export const WALKTHROUGH_STEPS = [
    {
        title: 'Open Settings',
        sub: 'Claude menu → Settings…',
        img: '/assets/img/step1.png',
        alt: 'The Claude menu bar with Settings highlighted',
        body: 'In the macOS menu bar click <strong>Claude</strong>, then <strong>Settings…</strong> — or just press ⌘, from anywhere in the app. On Windows it is the same panel, reached from the app menu.',
    },
    {
        title: 'Go to Connectors',
        sub: 'Under Customize in the sidebar',
        img: '/assets/img/step2.png',
        alt: 'The Claude settings window with Connectors selected in the sidebar',
        body: 'Scroll the settings sidebar down to <strong>Customize</strong> and pick <strong>Connectors</strong>. This is the list of everything Claude can reach — MCP servers show up here as connectors.',
    },
    {
        title: 'Add a custom connector',
        sub: 'Add ▾ → Add custom connector',
        img: '/assets/img/step4.png',
        alt: 'The Add dropdown open, showing Add custom connector',
        body: 'Top right of the Connectors panel, open <strong>Add ▾</strong> and choose <strong>Add custom connector</strong>. Freedcamp MCP is not in the browse list — it is your own hosted endpoint.',
    },
    {
        title: 'Name it and paste the endpoint',
        sub: MCP_URL,
        img: '/assets/img/step5.png',
        alt: 'The Add custom connector dialog filled in with Freedcamp-MCP and the endpoint URL',
        body: `Call it <strong>Freedcamp-MCP</strong> (this is only the label you will see in the list), paste <code>${MCP_URL}</code> as the address, and click <strong>Continue</strong>.`,
    },
    {
        title: 'Keep the detected defaults',
        sub: 'Authentication and OAuth client',
        img: '/assets/img/step3.png',
        alt: 'The second page of the dialog showing detected authentication and OAuth client settings',
        body: 'Claude probes the server and pre-selects the right options — <strong>Always required</strong> authentication and <strong>No client ID — register one automatically</strong>, both marked <em>Detected</em>. Leave them alone, skip the headers, and click <strong>Add</strong>.',
    },
    {
        title: 'Authorize with your API keys',
        sub: 'Key and secret from Freedcamp',
        img: '/assets/img/step6.png',
        alt: 'The Freedcamp authorization page asking for an API key and secret',
        body: `A browser page opens. Paste the <strong>API Key</strong> and <strong>API Secret</strong> from <a href="${API_KEYS_URL}">Freedcamp → Settings → API</a> and hit <strong>Authorize</strong>. Your credentials go to Freedcamp, never to Claude. Back in the app, ask “list my Freedcamp projects” to confirm all 102 tools are live.`,
    },
];

// Quickstart client panels (verbatim from the design)
export const QUICKSTART_CLIENTS = [
    {
        id: 'claude-desktop',
        label: 'Claude Desktop',
        intro: 'Open <strong>Settings → Connectors</strong>, choose <strong>Add ▾ → Add custom connector</strong>, and paste the endpoint below. Claude walks you through authorization in the browser.',
        code: MCP_URL,
        link: { href: '#claude-walkthrough', text: 'See the six screens →' },
    },
    {
        id: 'claude-code',
        label: 'Claude Code',
        intro: 'One command adds the connector. Then run <code>/mcp</code> inside the session and pick <strong>Authenticate</strong> to finish in the browser.',
        code: `claude mcp add --transport http freedcamp ${MCP_URL}`,
    },
    {
        id: 'cursor',
        label: 'Cursor',
        intro: 'Create <code>.cursor/mcp.json</code> in your project, or add the same block to your global Cursor MCP settings. Cursor opens the authorization page on first use.',
        code: `{\n  "mcpServers": {\n    "freedcamp": { "url": "${MCP_URL}" }\n  }\n}`,
    },
    {
        id: 'codex',
        label: 'Codex CLI',
        intro: 'Add the server to <code>~/.codex/config.toml</code>. Remote MCP servers need Codex’s streamable-HTTP client enabled, so keep both lines.',
        code: `experimental_use_rmcp_client = true\n\n[mcp_servers.freedcamp]\nurl = "${MCP_URL}"`,
    },
    {
        id: 'cline',
        label: 'Cline & Continue',
        intro: 'Both read the standard <code>mcpServers</code> shape — Cline from its MCP Servers panel, Continue from <code>config.json</code>.',
        code: `{\n  "mcpServers": {\n    "freedcamp": {\n      "type": "streamableHttp",\n      "url": "${MCP_URL}"\n    }\n  }\n}`,
    },
    {
        id: 'vscode',
        label: 'VS Code',
        intro: 'Add this to <code>.vscode/mcp.json</code> or your User Settings (JSON). VS Code prompts you to sign in the first time the server is used.',
        code: `{\n  "servers": {\n    "freedcamp": {\n      "type": "http",\n      "url": "${MCP_URL}"\n    }\n  }\n}`,
    },
];
