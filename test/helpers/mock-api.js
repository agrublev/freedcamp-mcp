import http from "node:http";

// ── In-process mock of the Freedcamp REST API ──────────────────────────────
// Serves a realistic subset of the API so tests can exercise the full
// Client → MCP Server → FreedcampHandler → HTTP path, and records every
// incoming request (method, path, query, body, headers, and the exact
// response that was sent) for input/output-format assertions.

export const SAMPLE_TASK = {
    id: "42",
    title: "Sample task",
    description: "<p>body</p>",
    project_id: "77",
    task_group_id: "9",
    list_id: "9",
    list_title: "To Do",
    priority: 1,
    priority_title: "Low",
    status: 0,
    status_title: "Not Started",
    assigned_to_id: "111",
    assigned_to_fullname: "Test User",
    created_by_id: "111",
    due_date: "2026-01-15",
    completed_date: null,
    created_ts: "1700000000",
    updated_ts: "1700000000",
    start_ts: "1700000000",
    r_rule: null,
    h_parent_id: null,
    h_top_id: null,
    h_level: "0",
    f_adv_subtask: false,
    order: "1",
    comments_count: "0",
    files_count: "0",
    f_archived_list: "0",
    url: "https://freedcamp.com/77/tasks/42",
    cf_tpl_id: "831234"
};

export const DEFAULT_SESSION = {
    user_id: "111",
    api_token: "tok-123",
    first_name: "Test",
    last_name: "User",
    email: "test@example.com",
    groups: [
        {
            name: "Acme",
            group_id: "g1",
            applications: [2],
            projects: ["77"]
        }
    ],
    projects: [
        {
            id: "77",
            project_name: "Website",
            project_description: null,
            applications: [2]
        }
    ]
};

export const DEFAULT_TIME_ENTRY = {
    id: "t1",
    description: "Work",
    project_id: "77",
    assigned_to_id: "111",
    date: "2026-01-01",
    minutes_count: 60,
    started_ts: null,
    status: 0
};

function parseBody(headers, raw) {
    const ct = headers["content-type"] || "";
    if (ct.includes("application/json") && raw.length) {
        try {
            return JSON.parse(raw.toString("utf8"));
        } catch {
            return undefined;
        }
    }
    if (ct.includes("multipart/form-data") && raw.length) {
        return parseMultipart(ct, raw);
    }
    if (raw.length) return raw.toString("utf8");
    return undefined;
}

// Minimal multipart/form-data parser: returns { name: value } with the file
// part stored under the key "file" as { filename, size, mime_type }.
function parseMultipart(contentType, raw) {
    const boundary = /boundary=([^;]+)/.exec(contentType)?.[1]?.replace(/^"|"$/g, "");
    if (!boundary) return undefined;
    const out = {};
    const parts = raw.toString("binary").split(`--${boundary}`);
    for (const part of parts) {
        if (!part.includes("Content-Disposition")) continue;
        const segments = part.split("\r\n\r\n");
        if (segments.length < 2) continue;
        const disposition = segments[0];
        const name = /name="([^"]+)"/.exec(disposition)?.[1];
        if (!name) continue;
        // eslint-disable-next-line no-control-regex
        let value = segments.slice(1).join("\r\n\r\n").replace(/\r\n$/, "");
        if (name === "file") {
            const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? null;
            out[name] = { filename, size: value.length };
        } else {
            out[name] = value;
        }
    }
    return out;
}

// Repeated query keys (status[]=&status[]=) collapse with fromEntries, so
// collect them into arrays instead.
function parseQuery(searchParams) {
    const query = {};
    for (const key of new Set(searchParams.keys())) {
        const values = searchParams.getAll(key);
        query[key] = values.length === 1 ? values[0] : values;
    }
    return query;
}

const clone = (v) => JSON.parse(JSON.stringify(v));

export async function startMockApi() {
    const state = {
        requests: [],
        handler: null, // (info) => ({ status?, body?, headers? }) | undefined
        defaultData: { ok: true },
        session: clone(DEFAULT_SESSION),
        timeEntry: clone(DEFAULT_TIME_ENTRY)
    };

    const envelope = (data) => ({ data, msg: "OK", status: "success" });

    // The small stateful subset the handler logic depends on.
    function defaultRoute(info) {
        const { method, path } = info;
        if (method === "GET" && path === "/sessions/current") {
            return { body: envelope(state.session) };
        }
        if (method === "GET" && path === "/tasks") {
            return {
                body: envelope({
                    tasks: [clone(SAMPLE_TASK)],
                    meta: { total: 1, limit: 200, offset: 0 }
                })
            };
        }
        if (method === "GET" && /^\/tasks\/[^/]+$/.test(path)) {
            return {
                body: envelope({
                    tasks: [clone(SAMPLE_TASK)],
                    cf_templates: [],
                    meta: { total: 1 }
                })
            };
        }
        if (method === "GET" && /^\/times\/[^/]+$/.test(path)) {
            return { body: envelope({ time: clone(state.timeEntry) }) };
        }
        if (method === "POST" && path === "/times") {
            // Create: return the created entry (f_started honored like the real API).
            const entry = {
                id: "t2",
                description: info.body.description ?? null,
                project_id: info.body.project_id,
                assigned_to_id: info.body.assigned_to_id,
                date: info.body.date,
                minutes_count: info.body.minutes_count,
                started_ts: Number(info.body.f_started) === 1 ? 1700000123 : null,
                status: 0
            };
            state.timeEntry = entry;
            return { body: envelope({ time: { ...entry } }) };
        }
        if (method === "POST" && /^\/times\/[^/]+$/.test(path) && info.body?.action) {
            // Simulate the time-action endpoint: mutate the entry's state.
            const entry = state.timeEntry;
            switch (info.body.action) {
            case "start":
                entry.started_ts = 1700000123;
                break;
            case "stop":
                entry.started_ts = null;
                break;
            case "bill":
                entry.status = 1;
                break;
            case "unbill":
                entry.status = 2;
                break;
            }
            return { body: envelope({ time: clone(entry) }) };
        }
        return { body: envelope(state.defaultData) };
    }

    const server = http.createServer(async (req, res) => {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const rawBody = Buffer.concat(chunks);
        const url = new URL(req.url, "http://localhost");
        const info = {
            method: req.method,
            path: url.pathname,
            query: parseQuery(url.searchParams),
            headers: req.headers,
            rawBody,
            body: parseBody(req.headers, rawBody)
        };
        state.requests.push(info);

        const response = state.handler ? (state.handler(info) ?? defaultRoute(info)) : defaultRoute(info);
        const status = response.status ?? 200;
        const body = response.body ?? envelope(state.defaultData);
        info.response = { status, body };

        res.writeHead(status, {
            "Content-Type": response.contentType ?? "application/json",
            ...(response.headers ?? {})
        });
        res.end(typeof body === "string" ? body : JSON.stringify(body));
    });

    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

    return {
        url: `http://127.0.0.1:${server.address().port}`,
        requests: state.requests,
        /** Records only requests matching (method, path). */
        requestsFor(method, path) {
            return state.requests.filter(
                (r) => r.method === method && (path instanceof RegExp ? path.test(r.path) : r.path === path)
            );
        },
        setHandler(fn) {
            state.handler = fn;
        },
        setDefaultData(data) {
            state.defaultData = data;
        },
        setSession(session) {
            state.session = clone(session);
        },
        setTimeEntry(entry) {
            state.timeEntry = clone(entry);
        },
        reset() {
            state.requests.length = 0;
            state.handler = null;
            state.defaultData = { ok: true };
            state.session = clone(DEFAULT_SESSION);
            state.timeEntry = clone(DEFAULT_TIME_ENTRY);
        },
        async stop() {
            await new Promise((resolve) => server.close(resolve));
        }
    };
}
