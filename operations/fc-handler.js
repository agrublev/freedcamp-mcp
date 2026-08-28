#!/usr/bin/env node

import fs from "fs";
import moment from "moment";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import axios from "axios";
import crypto from "crypto";
import { filterMap, statuses } from "./constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Thrown by timeAction when the Freedcamp API returned 200 OK but the entry's
 * state did not actually change (a silent no-op). The CallTool handler surfaces
 * this as an isError:true result so the failure is not mistaken for success.
 */
export class TimeActionNoopError extends Error {
    constructor(message, details = {}) {
        super(message);
        this.name = "TimeActionNoopError";
        this.details = details;
    }
}

class FreedcampHandler {
    constructor(
        apiKey,
        apiSecret,
        baseURL = "https://freedcamp.com/api/v1",
        { sessionFilePath } = {}
    ) {
        // Credentials may be assigned later (OAuth/HTTP mode) — validate lazily
        // in the request interceptor so a handler can be constructed first.
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.baseURL = baseURL;
        // If sessionFilePath === null, run in-memory only (multi-tenant safe).
        // If undefined, default to the legacy single-tenant file path.
        this.sessionFilePath =
            sessionFilePath === null
                ? null
                : sessionFilePath || path.join(__dirname, "..", "session.json");
        this.sessionData = null;
        this.sessionToken = null;
        this.userId = null;
        this.client = this.createClient();
    }

    createClient() {
        const client = axios.create({
            baseURL: this.baseURL,
            timeout: 20000
        });

        client.interceptors.request.use((config) => {
            const isFormData =
                config.data &&
                typeof config.data === "object" &&
                config.data.constructor &&
                config.data.constructor.name === "FormData";
            const contentType = isFormData ? {} : { "Content-Type": "application/json" };

            if (this.sessionToken && this.userId) {
                config.headers = {
                    ...(config.headers || {}),
                    "X-Freedcamp-API-Token": this.sessionToken,
                    "X-Freedcamp-User-Id": this.userId,
                    ...contentType,
                    Accept: "application/json"
                };
            } else {
                if (!this.apiKey || !this.apiSecret) {
                    throw new Error(
                        "Freedcamp API credentials are not configured for this request"
                    );
                }
                const timestamp = Math.floor(Date.now() / 1000).toString();
                const message = this.apiKey + timestamp;
                const hash = crypto
                    .createHmac("sha1", this.apiSecret)
                    .update(message)
                    .digest("hex");

                config.params = {
                    ...(config.params || {}),
                    api_key: this.apiKey,
                    timestamp,
                    hash
                };

                config.headers = {
                    ...(config.headers || {}),
                    ...contentType,
                    Accept: "application/json"
                };
            }

            return config;
        });

        client.interceptors.response.use(
            (response) => response,
            async (error) => {
                const status = error.response?.status;
                const cfg = error.config || {};

                // 401 → refresh session and retry once
                if (status === 401 && this.sessionToken) {
                    console.error("Session expired, refreshing...");
                    this.sessionToken = null;
                    this.userId = null;
                    await this.fetchSession();
                    return client.request(cfg);
                }

                // 429 → exponential backoff with Retry-After honoring
                if (status === 429) {
                    cfg.__retry429 = (cfg.__retry429 || 0) + 1;
                    if (cfg.__retry429 <= 4) {
                        const headerWait = Number(error.response.headers?.["retry-after"]);
                        const waitMs =
                            Number.isFinite(headerWait) && headerWait > 0
                                ? headerWait * 1000
                                : Math.min(30_000, 2_000 * 2 ** (cfg.__retry429 - 1));
                        console.error(
                            `Rate-limited (429), retry ${cfg.__retry429}/4 after ${waitMs}ms…`
                        );
                        await new Promise((r) => setTimeout(r, waitMs));
                        return client.request(cfg);
                    }
                }

                throw error;
            }
        );

        return client;
    }

    async initialize() {
        if (this.sessionFilePath && fs.existsSync(this.sessionFilePath)) {
            try {
                const fileContent = fs.readFileSync(this.sessionFilePath, "utf-8");
                const savedData = JSON.parse(fileContent);
                this.sessionData = savedData.sessionData || savedData;
                this.sessionToken = savedData.sessionToken || null;
                this.userId = savedData.userId || this.sessionData?.user_id || null;
                return;
            } catch (error) {
                console.error("Error reading session file:", error.message);
            }
        }
        try {
            await this.fetchSession();
        } catch (error) {
            // Non-fatal: HMAC-signed requests work without a session token, and the
            // session is re-fetched automatically on the first 401 response.
            console.error("Session prefetch failed (falling back to HMAC auth):", error.message);
        }
    }

    async fetchSession() {
        try {
            const res = await this.client.get("/sessions/current");
            this.sessionData = res.data?.data || res.data;

            this.sessionToken =
                this.sessionData?.api_token ||
                this.sessionData?.token ||
                res.headers["x-freedcamp-api-token"] ||
                null;
            this.userId = this.sessionData?.user_id || null;

            const dataToSave = {
                sessionData: this.sessionData,
                sessionToken: this.sessionToken,
                userId: this.userId,
                lastUpdated: new Date().toISOString()
            };

            if (this.sessionFilePath) {
                fs.writeFileSync(
                    this.sessionFilePath,
                    JSON.stringify(dataToSave, null, 2),
                    "utf-8"
                );
            }
        } catch (error) {
            console.error("Error fetching session:", error.message);
            throw error;
        }
    }

    getSession() {
        return this.sessionData;
    }

    async refreshSession() {
        await this.fetchSession();
        return this.sessionData;
    }

    /**
     * Generic request helper. Strips null/undefined values from `params` and `data`.
     */
    async request(method, url, { params = {}, data = null } = {}) {
        const cleanParams = Object.fromEntries(
            Object.entries(params).filter(([, v]) => v !== null && v !== undefined)
        );
        const config = { method, url, params: cleanParams };
        if (data !== null) {
            config.data = Object.fromEntries(
                Object.entries(data).filter(([, v]) => v !== null && v !== undefined)
            );
        }
        try {
            const res = await this.client.request(config);
            return res.data;
        } catch (error) {
            throw new Error(this._describeError(method, url, error));
        }
    }

    /**
     * Builds an actionable error message from a failed axios request, adding a
     * hint for common HTTP statuses so the agent knows how to react.
     */
    _describeError(method, url, error) {
        const status = error.response?.status;
        const apiMsg = error.response?.data?.msg || error.message;
        const hints = {
            401: "authentication failed — check FREEDCAMP_API_KEY/FREEDCAMP_API_SECRET, or the session may need to be refreshed",
            403: "permission denied — the authenticated user may not have access to this project/item",
            404: "not found — verify the ID exists and is accessible to the authenticated user",
            429: "rate limited — retries were exhausted; wait before retrying"
        };
        const hint =
            hints[status] || (status >= 500 ? "Freedcamp server error — retry later" : null);
        return `${method} ${url} failed${status ? ` (HTTP ${status})` : ""}: ${apiMsg}${hint ? ` (${hint})` : ""}`;
    }

    // ============ Tasks ============

    async fetchTask({ task_id = null }) {
        const res = await this.client.get(`/tasks/${task_id}`);
        // GET /tasks/{task_id} returns the same envelope as the list endpoint:
        // { tasks: [task], cf_templates, meta } — NOT the bare task
        // (api_docs/swagger.json → GET /tasks/{task_id} 200). Unwrap it so the
        // result matches the declared TaskSchema outputSchema. Older API
        // flavors returned the task object directly, hence the fallback.
        const payload = res.data.data;
        return payload?.tasks?.[0] ?? payload;
    }

    async fetchTasks({
        limit = 200,
        offset = 0,
        project_id = null,
        filters = {
            status: [],
            assigned_to_id: [],
            created_by_id: null,
            due_date_from: null,
            due_date_to: null,
            created_date_from: null,
            created_date_to: null,
            f_with_archived: 0,
            list_status: "active",
            order_due_date: null
        }
    }) {
        const params = new URLSearchParams();
        params.set("limit", String(limit));
        params.set("offset", String(offset));
        if (project_id !== null) {
            params.set("project_id", project_id);
        }
        for (const key of Object.keys(filters)) {
            const value = filters[key];
            if (key === "status") {
                for (const status of value) {
                    params.append("status[]", String(statuses[status]));
                }
            } else if (key === "assigned_to_id") {
                for (const id of value) {
                    params.append("assigned_to_id[]", String(id));
                }
            } else if (value !== null) {
                const paramKey = filterMap[key] !== undefined ? filterMap[key] : key;
                params.append(paramKey, String(value));
            }
        }
        const res = await this.client.get(`/tasks?${params.toString()}`);
        return { tasks: res.data.data.tasks, meta: res.data.data.meta };
    }

    async addTask({
        title,
        description,
        project_id,
        list_id,
        task_group_id,
        priority,
        assigned_to_id,
        start_date,
        r_rule,
        due_date,
        status,
        completed_date,
        attached_ids,
        h_parent_id,
        cf_tpl_id,
        custom_fields
    }) {
        // The API's documented field is list_id (api_docs/swagger.json →
        // TaskCreate). task_group_id is a legacy alias kept working for
        // compatibility with older API flavors, so send both when set.
        const resolvedListId = list_id ?? task_group_id ?? null;
        return this.request("POST", "/tasks", {
            data: {
                title,
                description,
                project_id,
                list_id: resolvedListId,
                task_group_id: resolvedListId,
                priority,
                assigned_to_id,
                start_date,
                r_rule,
                due_date,
                status,
                completed_date,
                attached_ids,
                h_parent_id,
                cf_tpl_id,
                custom_fields
            }
        });
    }

    async updateTask({
        task_id,
        title = null,
        description = null,
        list_id = null,
        task_group_id = null,
        status = null,
        priority = null,
        assigned_to_id = null,
        start_date = null,
        r_rule = null,
        due_date = null,
        attached_ids = null,
        h_parent_id = null,
        cf_tpl_id = null,
        custom_fields = null
    }) {
        const resolvedListId = list_id ?? task_group_id ?? null;
        return this.request("POST", `/tasks/${task_id}`, {
            data: {
                title,
                description,
                list_id: resolvedListId,
                task_group_id: resolvedListId,
                status,
                priority,
                assigned_to_id,
                start_date,
                r_rule,
                due_date,
                attached_ids,
                h_parent_id,
                cf_tpl_id,
                custom_fields
            }
        });
    }

    async batchEditTasks({
        batch_ids,
        title = null,
        description = null,
        status = null,
        priority = null,
        assigned_to_id = null,
        assigned_ids = null,
        start_date = null,
        due_date = null,
        ms_id = null,
        h_parent_id = null,
        tags = null,
        custom_fields = null,
        follower_ids = null,
        followers_operation = null
    }) {
        return this.request("POST", "/tasks/batch", {
            data: {
                batch_ids,
                title,
                description,
                status_id: status,
                priority,
                assigned_to_id,
                assigned_ids,
                start_date,
                due_date,
                ms_id,
                h_parent_id,
                tags,
                custom_fields,
                follower_ids,
                followers_operation
            }
        });
    }

    async deleteTask({ task_id }) {
        return this.request("DELETE", `/tasks/${task_id}`);
    }

    // ============ Lists ============

    async fetchLists({ project_id = null, app_id = 2 }) {
        const res = await this.client.get(`/lists/${app_id}?project_id=${project_id}`);
        return res.data.data;
    }

    async addList({ app_id = 2, project_id, title, description }) {
        return this.request("POST", `/lists/${app_id}`, {
            data: { project_id, title, description }
        });
    }

    async editList({ app_id = 2, list_id, title, description }) {
        return this.request("POST", `/lists/${app_id}/${list_id}`, {
            data: { title, description }
        });
    }

    async deleteList({ app_id = 2, list_id }) {
        return this.request("DELETE", `/lists/${app_id}/${list_id}`);
    }

    // ============ Comments ============

    async addComment({ item_id, app_id, description, attached_ids = [] }) {
        // The original working shape: item_id + app_id + description, with an
        // explicit attached_ids array (Postman always includes it). Don't send
        // task_id alongside — that form returns "this item can no longer be
        // accessed" on the public API.
        return this.request("POST", "/comments", {
            data: { item_id: String(item_id), app_id, description, attached_ids }
        });
    }

    async editComment({ comment_id, description }) {
        return this.request("POST", `/comments/${comment_id}`, { data: { description } });
    }

    // ============ Calendar Events ============

    async fetchEvents({ project_id = null } = {}) {
        return this.request("GET", "/events", { params: { project_id } });
    }

    async fetchEvent({ event_id }) {
        return this.request("GET", `/events/${event_id}`);
    }

    async addEvent({
        project_id,
        title,
        description,
        f_all_day,
        start_date,
        start_time,
        end_date,
        end_time,
        r_rule,
        f_response_notify,
        mixed_users,
        attached_ids
    }) {
        return this.request("POST", "/events", {
            data: {
                project_id,
                title,
                description,
                f_all_day,
                start_date,
                start_time,
                end_date,
                end_time,
                r_rule,
                f_response_notify,
                mixed_users,
                attached_ids
            }
        });
    }

    async editEvent({
        event_id,
        title,
        description,
        f_all_day,
        start_date,
        start_time,
        end_date,
        end_time,
        r_rule,
        attached_ids
    }) {
        return this.request("POST", `/events/${event_id}`, {
            data: {
                title,
                description,
                f_all_day,
                start_date,
                start_time,
                end_date,
                end_time,
                r_rule,
                attached_ids
            }
        });
    }

    async deleteEvent({ event_id }) {
        return this.request("DELETE", `/events/${event_id}`);
    }

    // ============ Discussions ============

    async fetchDiscussions({ project_id, limit = 200, offset = 0 } = {}) {
        return this.request("GET", "/discussions", { params: { project_id, limit, offset } });
    }

    async fetchDiscussion({ discussion_id }) {
        return this.request("GET", `/discussions/${discussion_id}`);
    }

    async addDiscussion({
        title,
        description,
        project_id,
        list_id,
        list_title,
        list_descr,
        f_sticky,
        f_private,
        private_users,
        notifications,
        attached_ids
    }) {
        return this.request("POST", "/discussions", {
            data: {
                title,
                description,
                project_id,
                list_id,
                list_title,
                list_descr,
                f_sticky,
                f_private,
                private_users,
                notifications,
                attached_ids
            }
        });
    }

    async editDiscussion({ discussion_id, title, list_id, list_title, list_descr, f_sticky }) {
        return this.request("POST", `/discussions/${discussion_id}`, {
            data: { title, list_id, list_title, list_descr, f_sticky }
        });
    }

    async deleteDiscussion({ discussion_id }) {
        return this.request("DELETE", `/discussions/${discussion_id}`);
    }

    // ============ Files (metadata only — actual upload is multipart) ============

    async fetchFile({ file_id }) {
        return this.request("GET", `/files/${file_id}`);
    }

    async addFileMeta({ project_id, group_id, application_id, item_id, comment_id, temporary }) {
        return this.request("POST", "/files", {
            data: { project_id, group_id, application_id, item_id, comment_id, temporary }
        });
    }

    // ============ Issues ============

    async fetchIssues({ project_id, limit = 200, offset = 0 } = {}) {
        return this.request("GET", "/issues", { params: { project_id, limit, offset } });
    }

    async fetchIssue({ issue_id }) {
        return this.request("GET", `/issues/${issue_id}`);
    }

    async addIssue({
        title,
        description,
        project_id,
        priority,
        status,
        type,
        assigned_to_id,
        due_date,
        closer_id,
        attached_ids
    }) {
        return this.request("POST", "/issues", {
            data: {
                title,
                description,
                project_id,
                priority,
                status,
                type,
                assigned_to_id,
                due_date,
                closer_id,
                attached_ids
            }
        });
    }

    async editIssue({
        issue_id,
        title,
        description,
        priority,
        status,
        type,
        assigned_to_id,
        due_date,
        closer_id,
        attached_ids
    }) {
        return this.request("POST", `/issues/${issue_id}`, {
            data: {
                title,
                description,
                priority,
                status,
                type,
                assigned_to_id,
                due_date,
                closer_id,
                attached_ids
            }
        });
    }

    async deleteIssue({ issue_id }) {
        return this.request("DELETE", `/issues/${issue_id}`);
    }

    // ============ Milestones ============

    async fetchMilestones({ project_id, limit = 200, offset = 0 } = {}) {
        return this.request("GET", "/milestones", { params: { project_id, limit, offset } });
    }

    async fetchMilestone({ milestone_id }) {
        return this.request("GET", `/milestones/${milestone_id}`);
    }

    async addMilestone({
        title,
        description,
        project_id,
        priority,
        assigned_to_id,
        due_date,
        status,
        start_date
    }) {
        return this.request("POST", "/milestones", {
            data: {
                title,
                description,
                project_id,
                priority,
                assigned_to_id,
                due_date,
                status,
                start_date
            }
        });
    }

    async editMilestone({
        milestone_id,
        title,
        description,
        priority,
        status,
        assigned_to_id,
        due_date,
        start_date
    }) {
        return this.request("POST", `/milestones/${milestone_id}`, {
            data: { title, description, priority, status, assigned_to_id, due_date, start_date }
        });
    }

    async deleteMilestone({ milestone_id }) {
        return this.request("DELETE", `/milestones/${milestone_id}`);
    }

    // ============ CRM Tasks ============

    async fetchCrmTasks({ group_id, limit = 200, offset = 0 } = {}) {
        return this.request("GET", "/crm_tasks", { params: { group_id, limit, offset } });
    }

    async fetchCrmTask({ crm_task_id }) {
        return this.request("GET", `/crm_tasks/${crm_task_id}`);
    }

    async addCrmTask({
        title,
        description,
        group_id,
        type,
        contact_title,
        f_private,
        assigned_to_id,
        due_date
    }) {
        return this.request("POST", "/crm_tasks", {
            data: {
                title,
                description,
                group_id,
                type,
                contact_title,
                f_private,
                assigned_to_id,
                due_date
            }
        });
    }

    async editCrmTask({
        crm_task_id,
        title,
        description,
        status,
        type,
        contact_title,
        f_private,
        assigned_to_id,
        due_date
    }) {
        return this.request("POST", `/crm_tasks/${crm_task_id}`, {
            data: {
                title,
                description,
                status,
                type,
                contact_title,
                f_private,
                assigned_to_id,
                due_date
            }
        });
    }

    async deleteCrmTask({ crm_task_id }) {
        return this.request("DELETE", `/crm_tasks/${crm_task_id}`);
    }

    // ============ CRM Calls ============

    async fetchCrmCalls({ group_id, limit = 200, offset = 0 } = {}) {
        return this.request("GET", "/crm_calls", { params: { group_id, limit, offset } });
    }

    async fetchCrmCall({ crm_call_id }) {
        return this.request("GET", `/crm_calls/${crm_call_id}`);
    }

    async addCrmCall({
        title,
        description,
        group_id,
        f_inbound,
        contact_title,
        assigned_to_id,
        due_date,
        duration
    }) {
        return this.request("POST", "/crm_calls", {
            data: {
                title,
                description,
                group_id,
                f_inbound,
                contact_title,
                assigned_to_id,
                due_date,
                duration
            }
        });
    }

    async editCrmCall({
        crm_call_id,
        title,
        description,
        f_inbound,
        contact_title,
        assigned_to_id,
        due_date,
        duration
    }) {
        return this.request("POST", `/crm_calls/${crm_call_id}`, {
            data: {
                title,
                description,
                f_inbound,
                contact_title,
                assigned_to_id,
                due_date,
                duration
            }
        });
    }

    async deleteCrmCall({ crm_call_id }) {
        return this.request("DELETE", `/crm_calls/${crm_call_id}`);
    }

    // ============ Times ============

    async fetchTimes({ project_id, limit = 200, offset = 0 } = {}) {
        return this.request("GET", "/times", { params: { project_id, limit, offset } });
    }

    async fetchTime({ time_id }) {
        return this.request("GET", `/times/${time_id}`);
    }

    async addTime({
        description,
        project_id,
        assigned_to_id,
        date,
        minutes_count,
        f_started,
        f_billed
    }) {
        // The Freedcamp API rejects time entries without assigned_to_id. Time is logged
        // as the authenticated user unless the caller explicitly logs it for someone else,
        // so default to this.userId rather than "-1" (everyone). If we have not resolved a
        // user id yet, pull the session; if it is still unknown, fail loudly instead of
        // silently assigning the entry to everyone.
        let assignee = assigned_to_id;
        if (assignee === null || assignee === undefined || assignee === "") {
            if (!this.userId) {
                try {
                    await this.fetchSession();
                } catch {
                    // fall through to the explicit error below
                }
            }
            if (!this.userId) {
                throw new Error(
                    "addTime requires assigned_to_id: the authenticated user id is unknown " +
                        "(session unavailable). Pass assigned_to_id explicitly."
                );
            }
            assignee = String(this.userId);
        }
        const res = await this.request("POST", "/times", {
            data: {
                description,
                project_id,
                assigned_to_id: assignee,
                date,
                minutes_count,
                f_started,
                f_billed
            }
        });
        // The API can return 200 OK yet ignore f_started (the entry comes back with
        // started_ts null). Surface that as a failure instead of a false success. If we
        // cannot confirm the timer is running — whether started_ts is null or the entry
        // could not be extracted from the response at all — we must not claim success.
        if (Number(f_started) === 1) {
            const entry = this._extractTimeEntry(res);
            const started =
                entry != null && entry.started_ts !== null && entry.started_ts !== undefined;
            if (!started) {
                throw new TimeActionNoopError(
                    "Requested f_started=1 but the timer did not start " +
                        "(the response entry has started_ts null or could not be read). " +
                        "This appears to be a Freedcamp API issue, not something the caller can fix.",
                    { action: "start", entry }
                );
            }
        }
        return res;
    }

    async editTime({ time_id, description, assigned_to_id, date, minutes_count }) {
        return this.request("POST", `/times/${time_id}`, {
            data: { description, assigned_to_id, date, minutes_count }
        });
    }

    async deleteTime({ time_id }) {
        return this.request("DELETE", `/times/${time_id}`);
    }

    async timeAction({ time_id, action }) {
        // The Freedcamp API responds 200 OK even when the action was a no-op (e.g.
        // starting an already-running timer), so we capture the entry's state before
        // and after the action to detect that. When nothing changed we throw: the
        // CallTool handler turns thrown errors into isError:true results, so the model
        // does not mistake a silent no-op for a successful start/stop/bill/unbill.
        // The action endpoint returns the updated entry (same shape as /times/time_id:GET).
        const before = await this._fetchTimeEntrySafe(time_id);
        const res = await this.request("POST", `/times/${time_id}`, { data: { action } });
        const after = this._extractTimeEntry(res);
        const warning = this._timeActionWarning(action, before, after);
        if (warning) {
            throw new TimeActionNoopError(warning, { time_id, action, entry: after });
        }
        return res;
    }

    async _fetchTimeEntrySafe(time_id) {
        try {
            return this._extractTimeEntry(await this.fetchTime({ time_id }));
        } catch {
            return null; // best-effort; fall back to post-action-only detection
        }
    }

    _extractTimeEntry(res) {
        const data = res?.data;
        if (!data || typeof data !== "object") return null;
        // The entry may be returned directly, under `time`, or as the first array item.
        const entry = data.time || data.times?.[0] || (Array.isArray(data) ? data[0] : data);
        return entry && typeof entry === "object" && ("started_ts" in entry || "status" in entry)
            ? entry
            : null;
    }

    _timeActionWarning(action, before, after) {
        const isStarted = (e) => e != null && e.started_ts !== null && e.started_ts !== undefined;
        const status = (e) => (e == null ? NaN : Number(e.status));

        switch (action) {
        case "start":
            if (before && isStarted(before)) {
                return "Timer was already running before 'start' (started_ts was already set), " +
                    "so nothing changed.";
            }
            if (!after) {
                return "Timer start could not be confirmed: the 'start' action response did not " +
                    "include the time entry, so started_ts cannot be verified. This appears to " +
                    "be a Freedcamp API issue, not something the caller can fix.";
            }
            if (!isStarted(after)) {
                return "Timer did not start: started_ts is still null after the 'start' action. " +
                    "The entry may be billed or in a state that cannot be started.";
            }
            return null;
        case "stop":
            if (before && !isStarted(before)) {
                return "Timer was not running before 'stop' (started_ts was already null), " +
                    "so nothing changed.";
            }
            if (after && isStarted(after)) {
                return "Timer did not stop: started_ts is still set after the 'stop' action.";
            }
            return null;
        case "bill":
            if (before && status(before) === 1) {
                return "Entry was already billed before 'bill' (status 1), so nothing changed.";
            }
            if (after && status(after) !== 1) {
                return `Entry was not marked billed: status is ${after.status} (expected 1).`;
            }
            return null;
        case "unbill":
            // unbill is a no-op on any entry that is not currently billed (status !== 1),
            // not just status 2 (e.g. status 0 not-started is already "unbilled").
            if (before && status(before) !== 1) {
                return `Entry was not billed before 'unbill' (status ${before.status}), ` +
                    "so nothing changed.";
            }
            if (after && status(after) !== 2) {
                return `Entry was not moved back to in-progress: status is ${after.status} (expected 2).`;
            }
            return null;
        default:
            return null;
        }
    }

    // ============ Wikis ============

    async fetchWikis({ project_id, limit = 200, offset = 0, order_title = "asc" } = {}) {
        const params = { project_id, limit, offset };
        if (order_title) params["order[title]"] = order_title;
        return this.request("GET", "/wikis", { params });
    }

    async fetchWiki({ wiki_id }) {
        return this.request("GET", `/wikis/${wiki_id}`);
    }

    async addWiki({
        title,
        description,
        project_id,
        list_id,
        list_title,
        list_descr,
        f_private,
        f_public,
        private_users,
        attached_ids
    }) {
        return this.request("POST", "/wikis", {
            data: {
                title,
                description,
                project_id,
                list_id,
                list_title,
                list_descr,
                f_private,
                f_public,
                private_users,
                attached_ids
            }
        });
    }

    async editWiki({
        wiki_id,
        title,
        description,
        list_id,
        list_title,
        list_descr,
        f_private,
        f_public,
        private_users,
        attached_ids,
        f_new_version = false
    }) {
        return this.request("POST", `/wikis/${wiki_id}`, {
            data: {
                f_new_version,
                title,
                description,
                list_id,
                list_title,
                list_descr,
                f_private,
                f_public,
                private_users,
                attached_ids
            }
        });
    }

    async deleteWiki({ wiki_id }) {
        return this.request("DELETE", `/wikis/${wiki_id}`);
    }

    async addWikiVersion({ wiki_id, title, description, attached_ids }) {
        return this.request("POST", `/wikis/${wiki_id}`, {
            data: { f_new_version: true, title, description, attached_ids }
        });
    }

    // ============ Notifications ============

    async fetchNotifications() {
        const url = `/notifications?following=1&from_ts=${moment().subtract(60, "days").format("X")}`;
        const res = await this.client.get(url);
        return res.data;
    }

    async fetchAllNotifications() {
        return this.request("GET", "/notifications");
    }

    async updateNotificationRead(uid = null) {
        return this.request("POST", "/notifications", {
            data: { new_state: "read", items: [{ item_u_key: uid }] }
        });
    }

    async editNotifications({ new_state = "read", items }) {
        return this.request("POST", "/notifications", { data: { new_state, items } });
    }

    // ============ Calendar Items ============

    async fetchCalendarItems({ project_id } = {}) {
        return this.request("GET", "/calendar_items", { params: { project_id } });
    }

    // ============ Account / Favorites ============

    async addFavoriteProject({ project_id }) {
        return this.request("POST", `/favorite_projects/${project_id}`);
    }

    async deleteFavoriteProject({ project_id }) {
        return this.request("DELETE", `/favorite_projects/${project_id}`);
    }

    // ============ Projects ============

    async fetchProjects() {
        return this.request("GET", "/projects");
    }

    async fetchProject({ project_id }) {
        return this.request("GET", `/projects/${project_id}`);
    }

    async fetchRecentProjectIds() {
        return this.request("GET", "/recent_project_ids");
    }

    async addProject({
        project_name,
        project_description,
        project_color,
        todo_view_type,
        usage_type,
        group_id,
        group_name
    }) {
        return this.request("POST", "/projects", {
            data: {
                project_name,
                project_description,
                project_color,
                todo_view_type,
                usage_type,
                group_id,
                group_name
            }
        });
    }

    async editProject({ project_id, project_name, project_color, group_id, cs_tpl_id }) {
        return this.request("POST", `/projects/${project_id}`, {
            data: { project_name, project_color, group_id, cs_tpl_id }
        });
    }

    async leaveProject({ membership_id }) {
        return this.request("DELETE", `/project_memberships/${membership_id}`);
    }

    async deleteProject({ project_id }) {
        // Not in Postman collection but supported by the public API.
        return this.request("DELETE", `/projects/${project_id}`);
    }

    // ============ Linked Items ============

    async fetchLinkedItems({ app_id, item_id }) {
        return this.request("GET", `/linked_items/${app_id}/${item_id}`);
    }

    async addLinkedItems({ app_id, item_id, links }) {
        // links: e.g. { "2": [task_id, ...] } — keyed by app_id of the items being linked
        return this.request("POST", `/linked_items/${app_id}/${item_id}`, { data: links });
    }

    // ============ Groups / CF Templates / Users ============

    async fetchGroups() {
        return this.request("GET", "/groups");
    }

    async fetchCfTemplates({ module_id = 2 } = {}) {
        return this.request("GET", "/cf_templates", { params: { module_id } });
    }

    async addCfTemplate({ title, module_id, owner_id, fields }) {
        return this.request("POST", "/cf_templates", {
            data: { title, module_id, owner_id, fields }
        });
    }

    async editCfTemplate({ cft_id, title, module_id, owner_id, fields, deleted_field_ids, f_archived }) {
        return this.request("POST", `/cf_templates/${cft_id}`, {
            data: { title, module_id, owner_id, fields, deleted_field_ids, f_archived }
        });
    }

    async fetchUsers() {
        return this.request("GET", "/users");
    }

    // ============ Sessions ============

    async fetchCurrentSession() {
        return this.request("GET", "/sessions/current");
    }

    // ============ Overviews ============

    async fetchOverview({ project_id }) {
        return this.request("GET", `/overviews/${project_id}`);
    }

    // ============ Invitations ============

    async fetchInvitations() {
        return this.request("GET", "/invitations");
    }

    async respondInvitation({ invitation_id, action, response, project_id } = {}) {
        return this.request("POST", "/invitations", {
            data: { invitation_id, action, response, project_id }
        });
    }

    // ============ Users (extras) ============

    async fetchCurrentUser() {
        return this.request("GET", "/users/current");
    }

    async fetchUser({ user_id }) {
        return this.request("GET", `/users/${user_id}`);
    }

    async registerUser({ email, password, first_name, last_name, timezone } = {}) {
        return this.request("POST", "/users", {
            data: { email, password, first_name, last_name, timezone }
        });
    }

    async updateCurrentUser({
        first_name,
        last_name,
        email,
        timezone,
        password,
        current_password
    } = {}) {
        return this.request("POST", "/users/current", {
            data: { first_name, last_name, email, timezone, password, current_password }
        });
    }

    // ============ Account / Wipe ============

    async fetchWipeCurrent() {
        return this.request("GET", "/wipe/current");
    }

    async deleteAccount({ password, confirm } = {}) {
        return this.request("POST", "/wipe/current", { data: { password, confirm } });
    }

    // ============ Password reset ============

    async requestPasswordReset({ email }) {
        return this.request("POST", "/password_reset_emails", { data: { email } });
    }

    async applyPasswordReset({ reset_key, password } = {}) {
        return this.request("POST", "/passwords", { data: { reset_key, password } });
    }

    // ============ Avatars ============

    async uploadAvatar({ file_path, filename, mime_type, content_base64 } = {}) {
        const { blob, name } = this._buildBlob({
            file_path,
            filename,
            mime_type,
            content_base64,
            defaultName: "avatar"
        });
        const form = new FormData();
        form.append("file", blob, name);
        try {
            const res = await this.client.post("/avatars/current", form);
            return res.data;
        } catch (error) {
            throw new Error(this._describeError("POST", "/avatars/current", error));
        }
    }

    async deleteAvatar() {
        return this.request("DELETE", "/avatars/current");
    }

    // ============ Notifications (by project) ============

    async fetchNotificationsByProject({ project_id }) {
        return this.request("GET", `/notifications/${project_id}`);
    }

    // ============ Validations ============

    async validateEmail({ email }) {
        return this.request("GET", "/validations/email", { params: { email } });
    }

    // ============ Files (upload + delete) ============

    _buildBlob({ file_path, filename, mime_type, content_base64, defaultName = "file" } = {}) {
        let buf;
        let name;
        if (file_path) {
            buf = fs.readFileSync(file_path);
            name = filename || path.basename(file_path);
        } else if (content_base64) {
            buf = Buffer.from(content_base64, "base64");
            name = filename || defaultName;
        } else {
            throw new Error("Provide file_path or content_base64");
        }
        const blob = new Blob([buf], { type: mime_type || "application/octet-stream" });
        return { blob, name };
    }

    async uploadFile({
        file_path,
        filename,
        mime_type,
        content_base64,
        project_id,
        group_id,
        application_id,
        item_id,
        comment_id,
        temporary
    } = {}) {
        const { blob, name } = this._buildBlob({ file_path, filename, mime_type, content_base64 });
        const form = new FormData();
        form.append("file", blob, name);
        const meta = { project_id, group_id, application_id, item_id, comment_id, temporary };
        for (const [k, v] of Object.entries(meta)) {
            if (v !== null && v !== undefined) form.append(k, String(v));
        }
        try {
            const res = await this.client.post("/files", form);
            return res.data;
        } catch (error) {
            throw new Error(this._describeError("POST", "/files", error));
        }
    }

    async deleteFile({ file_id }) {
        return this.request("DELETE", `/files/${file_id}`);
    }

    // ============ Comments (delete) ============

    async deleteComment({ comment_id }) {
        return this.request("DELETE", `/comments/${comment_id}`);
    }

    // ============ Backups ============

    async fetchBackups() {
        return this.request("GET", "/backups");
    }

    // ============ Timezones ============

    async fetchTimezones() {
        return this.request("GET", "/timezones");
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    (async () => {
        try {
            const dotenv = await import("dotenv");
            dotenv.config();

            const apiKey = process.env.FREEDCAMP_API_KEY;
            const apiSecret = process.env.FREEDCAMP_API_SECRET;

            if (!apiKey || !apiSecret) {
                console.error(
                    "Error: FREEDCAMP_API_KEY and FREEDCAMP_API_SECRET must be set in .env file"
                );
                process.exit(1);
            }

            const handler = new FreedcampHandler(apiKey, apiSecret);
            await handler.initialize();
        } catch (error) {
            console.error("Failed to initialize handler:", error.message);
            process.exit(1);
        }
    })();
}

export default FreedcampHandler;
