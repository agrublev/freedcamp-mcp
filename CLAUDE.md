# Freedcamp MCP Server

MCP server that exposes the Freedcamp REST API (v1) as callable tools for Claude and other MCP clients.

## Stack

- **Language:** JavaScript (ES modules, `"type": "module"`). No TypeScript.
- **Runtime:** Node.js
- **MCP SDK:** `@modelcontextprotocol/sdk` ^1.30.0
- **HTTP client:** axios (with HMAC-SHA1 auth interceptor, 401 auto-refresh, 429 exponential backoff)
- **Validation:** zod + zod-to-json-schema (schemas define both tool input shapes and runtime validation)
- **Transport:** stdio by default (stdin/stdout JSON-RPC); optional Streamable HTTP + OAuth via `MCP_TRANSPORT=http`

## Commands

```bash
npm install             # install dependencies
npm run build           # chmod +x index.js (that's all the "build" is)
node client.js          # smoke-test: connects as MCP client, lists tools, calls fc_fetch_projects
node scripts/release.js [patch|minor|major]   # bump version, commit, tag, push, npm publish
```

## Required Environment

```
FREEDCAMP_API_KEY=...
FREEDCAMP_API_SECRET=...
```

Server exits immediately if either is missing (in the default `stdio` mode).
In `http` mode (`MCP_TRANSPORT=http`) these are not required — each user
authorizes with their own Freedcamp API key/secret via OAuth.

## Architecture

```
index.js                 # MCP server entry — tool registry + CallTool switch,
                         # buildServer(fc) factory, transport selection
http.js                  # Streamable HTTP transport + OAuth router (MCP_TRANSPORT=http)
oauth.js                 # FreedcampOAuthProvider — OAuthServerProvider whose /authorize
                         # page collects + verifies Freedcamp API key/secret
operations/
  fc-handler.js          # FreedcampHandler class — all API calls, auth, session mgmt
  schemas.js             # Shared Zod helpers (Opt, PaginationSchema)
  constants.js           # App IDs, status/priority enums, filter mappings
  tasks.js               # Zod schemas for task tools
  lists.js               # Zod schemas for list tools
  comments.js            # ...
  events.js              # Calendar events
  discussions.js
  issues.js
  milestones.js
  times.js
  wikis.js
  projects.js
  crm.js                 # CRM tasks + calls
  users.js
  notifications.js
  misc.js                # CF templates, linked items, overview, invitations, calendar items, favorites, timezones, backups
common/
  types.js               # Response-shape Zod schemas (TaskSchema, ProjectSchema, etc.)
  version.js             # VERSION constant (single source, updated by release script)
client.js                # Test client for manual smoke-testing
scripts/
  release.js             # Semver bump + git tag + npm publish
```

### How it works

1. `index.js` picks a transport from `MCP_TRANSPORT` (`stdio` default, `http` for OAuth).
2. stdio: builds one `FreedcampHandler` from env credentials and one MCP server.
   http: `http.js` runs `mcpAuthRouter` (OAuth endpoints) + a bearer-authed `/mcp`.
   Each bearer token maps to a lazily created `FreedcampHandler` (from the
   credentials the user entered on the OAuth page) and its own MCP server via
   `buildServer(fc)`, so one process serves many Freedcamp accounts.
3. Registers ~75 tools (CRUD for tasks, lists, comments, events, discussions, issues, milestones, times, wikis, projects, CRM, users, notifications, misc)
4. Each `CallTool` request: parse args with the tool's Zod schema -> call the matching `fc.*` method -> return JSON
5. Auth: HMAC-SHA1 signature on every request (apiKey + timestamp hashed with apiSecret). Session token auth as fallback with auto-refresh on 401. In http mode the per-user key/secret come from the OAuth token.

### Key patterns

- **Two transports:** `stdio` (single user, env credentials) is the default; `http` (multi-user, OAuth) is opt-in via `MCP_TRANSPORT=http`. All OAuth/HTTP code lives in `oauth.js` + `http.js`; `index.js` exposes a `buildServer(fc)` factory so both share the same tool registry.
- **Tool naming:** `fc_<verb>_<entity>` (e.g., `fc_fetch_tasks`, `fc_add_task`, `fc_edit_issue`)
- **Zod schemas** in each `operations/*.js` define tool inputs; `common/types.js` defines response shapes
- **`Opt(schema)`** helper wraps `schema.optional().nullable()` — use for optional fields
- **FreedcampHandler.request()** strips null/undefined from params and data before sending
- **Rate limiting:** 429 responses retried up to 4 times with exponential backoff (honors Retry-After header)

### App IDs (Freedcamp internal)

| ID | Name | Key |
|----|------|-----|
| 2 | Tasks | TODOS |
| 3 | Discussions | DISCUSSIONS |
| 4 | Milestones | MILESTONES |
| 5 | Time | TIME |
| 6 | Files | FILES |
| 13 | Issue Tracker | BUGTRACKER |
| 14 | Wikis | WIKI |
| 16 | CRM | CRM |
| 19 | Calendar | CALENDAR |

## Development Constraints

- Keep it JS-only. No TypeScript, no transpilation step.
- All API access goes through `FreedcampHandler` — tools in `index.js` never call axios directly.
- Adding a new tool: add Zod schema in `operations/<entity>.js`, add tool entry in the `tools` array in `index.js`, add case in the switch, add handler method in `fc-handler.js`.
- Version lives in two places: `package.json` and `common/version.js` — always use `scripts/release.js` to bump both.
- The `session.json` file at repo root is runtime state (auth token cache), not source. Don't commit it.
