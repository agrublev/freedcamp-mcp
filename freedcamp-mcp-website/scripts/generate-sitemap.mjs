// Writes sitemap.xml, robots.txt and llms.txt into dist/ after the SSG build.
// The site is a single page with anchor sections, so the sitemap lists the
// page plus the main anchor targets for discoverability.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '..', 'dist');
const SITE_URL = 'https://mcp-docs.freedcamp.top';

const ANCHORS = [
    ['overview', 'Overview — what the server is and the endpoint'],
    ['quickstart', 'Quickstart — add the endpoint to Claude Desktop, Claude Code, Cursor, Codex, Cline, VS Code'],
    ['claude-walkthrough', 'Claude Desktop walkthrough — six screens from menu bar to working connection'],
    ['auth', 'Authentication — OAuth only, HMAC-signed upstream, scoped bearer tokens'],
    ['workflow', 'How the AI should work — behaviour rules shipped to MCP clients'],
    ['tools', 'Tool reference — all 102 tools grouped by Freedcamp app'],
    ['recipes', 'Prompt recipes — copy-paste prompts and the tools they call'],
    ['security', 'Security & limits — per-user credentials, nothing persisted'],
    ['errors', 'Errors & troubleshooting — common failures and their fixes'],
    ['faq', 'FAQ — eight common questions'],
];

function today() {
    return new Date().toISOString().slice(0, 10);
}

const d = today();

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${d}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
${ANCHORS.map(
    ([a]) => `  <url>
    <loc>${SITE_URL}/#${a}</loc>
    <lastmod>${d}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
).join('\n')}
</urlset>
`;

const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

const llms = `# Freedcamp MCP

> A hosted Model Context Protocol server that exposes the Freedcamp API as 102 tools any MCP client can call — Claude Desktop, Claude Code, Cursor, Cline, Codex CLI, VS Code. OAuth 2.1 only; nothing to install.

## Docs (single page, anchor sections)

${ANCHORS.map(([a, desc]) => `- [${desc}](${SITE_URL}/#${a})`).join('\n')}

## Key facts

- Endpoint: https://mcp.freedcamp.com/mcp
- 102 tools across 17 Freedcamp apps (tasks, projects, lists, comments, calendar, discussions, issues, milestones, time, wikis, CRM, users, notifications, files, custom fields)
- Auth: OAuth 2.1 authorization-code with PKCE; credentials verified against the Freedcamp API at /authorize, then encrypted into a 30-day bearer token (AES-256-GCM)
- Upstream calls are HMAC-signed with the user's own API secret
- Source: https://github.com/agrublev/freedcamp-mcp

## Optional

- [Sitemap](${SITE_URL}/sitemap.xml)
`;

if (!fs.existsSync(DIST)) {
    console.error('[generate-sitemap] dist/ missing — run the SSG build first.');
    process.exit(1);
}

fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap, 'utf8');
fs.writeFileSync(path.join(DIST, 'robots.txt'), robots, 'utf8');
fs.writeFileSync(path.join(DIST, 'llms.txt'), llms, 'utf8');
console.log(`[generate-sitemap] wrote sitemap.xml (${1 + ANCHORS.length} URLs), robots.txt, llms.txt`);
