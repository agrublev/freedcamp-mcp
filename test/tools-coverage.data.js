// ── Coverage table: one entry per registered MCP tool ──────────────────────
// Every entry drives a real client → server → handler → mock HTTP round-trip.
// Keys:
//   tool     MCP tool name (parity with listTools() is asserted by the test)
//   args     arguments passed to tools/call
//   method   expected HTTP method (default "GET")
//   path     expected request path (string equality or RegExp)
//   query    exact expected query params (undefined = not asserted)
//   body     exact expected JSON body (undefined = not asserted)
//   respond  mock API response body override for this call
//   entry    mock time-entry state to install before the call
//   requestCount  exact number of HTTP requests the call must make
//   form     for multipart uploads: [expected non-file form field names]
//   noApi    true → the call must make no HTTP request at all
//   check    extra assertions on (result, mcp, api)

export const COVERAGE = [
    // ── Tasks ─────────────────────────────────────────────────────────────
    {
        tool: "fc_fetch_task",
        args: { task_id: "42" },
        path: "/tasks/42",
        query: {},
        check: (result) => {
            // outputSchema TaskSchema is validated by the SDK client; also
            // check the handler unwrapped the { tasks: [task] } envelope.
            if (result.structuredContent.id !== "42") throw new Error("expected unwrapped task");
        }
    },
    {
        tool: "fc_fetch_tasks",
        args: { limit: 50, offset: 10, project_id: "77" },
        path: "/tasks",
        query: {
            limit: "50",
            offset: "10",
            project_id: "77",
            // default filters object always contributes these two:
            f_with_archived: "0",
            lists_status: "active"
        },
        respond: { data: { tasks: [{ id: "1", title: "T", project_id: "77" }], meta: { total: 1 } }, msg: "OK", status: "success" }
    },
    {
        tool: "fc_fetch_tasks",
        args: {
            project_id: "77",
            filters: {
                status: ["STATUS_COMPLETED", "STATUS_IN_PROGRESS"],
                assigned_to_id: ["111", "222"],
                due_date_from: "2026-01-01",
                due_date_to: "2026-01-31",
                order_due_date: "asc"
            }
        },
        path: "/tasks",
        query: {
            limit: "200",
            offset: "0",
            project_id: "77",
            "status[]": ["1", "2"],
            "assigned_to_id[]": ["111", "222"],
            "due_date[from]": "2026-01-01",
            "due_date[to]": "2026-01-31",
            "order[due_date]": "asc"
            // explicit filters object ⇒ handler defaults do NOT apply
        }
    },
    {
        tool: "fc_add_task",
        args: {
            title: "New task",
            description: "<p>body</p>",
            project_id: "77",
            list_id: "9",
            priority: 2,
            assigned_to_id: "111",
            start_date: "2026-01-01",
            due_date: "2026-01-15",
            status: 2,
            attached_ids: ["5"],
            h_parent_id: "42",
            custom_fields: [{ cf_id: "1", value: "x" }]
        },
        method: "POST",
        path: "/tasks",
        body: {
            title: "New task",
            description: "<p>body</p>",
            project_id: "77",
            // list_id is mirrored into the legacy task_group_id alias:
            list_id: "9",
            task_group_id: "9",
            priority: 2,
            assigned_to_id: "111",
            start_date: "2026-01-01",
            due_date: "2026-01-15",
            status: 2,
            attached_ids: ["5"],
            h_parent_id: "42",
            custom_fields: [{ cf_id: "1", value: "x" }]
        }
    },
    {
        tool: "fc_add_task",
        args: { title: "Legacy alias", project_id: "77", task_group_id: "9" },
        method: "POST",
        path: "/tasks",
        body: { title: "Legacy alias", project_id: "77", list_id: "9", task_group_id: "9" }
    },
    {
        tool: "fc_add_task",
        args: { title: "Bare", project_id: "77" },
        method: "POST",
        path: "/tasks",
        // undefined fields are stripped before the request:
        body: { title: "Bare", project_id: "77" }
    },
    {
        tool: "fc_update_task",
        args: { task_id: "42", status: 1, priority: 3 },
        method: "POST",
        path: "/tasks/42",
        body: { status: 1, priority: 3 }
    },
    {
        tool: "fc_update_task",
        args: { task_id: "42", list_id: "9" },
        method: "POST",
        path: "/tasks/42",
        body: { list_id: "9", task_group_id: "9" }
    },
    {
        tool: "fc_batch_edit_tasks",
        args: {
            batch_ids: ["1", "2", "3"],
            status: 1,
            priority: 2,
            assigned_ids: ["111"],
            tags: ["urgent"],
            ms_id: "m1",
            custom_fields: [{ cf_id: "1", value: "x" }],
            follower_ids: ["111"],
            followers_operation: "append"
        },
        method: "POST",
        path: "/tasks/batch",
        body: {
            batch_ids: ["1", "2", "3"],
            status_id: 1,
            priority: 2,
            assigned_ids: ["111"],
            tags: ["urgent"],
            ms_id: "m1",
            custom_fields: [{ cf_id: "1", value: "x" }],
            follower_ids: ["111"],
            followers_operation: "append"
        }
    },
    {
        tool: "fc_delete_task",
        args: { task_id: "42" },
        method: "DELETE",
        path: "/tasks/42"
    },

    // ── Lists ──────────────────────────────────────────────────────────────
    {
        tool: "fc_fetch_lists",
        args: { project_id: "77" },
        path: "/lists/2",
        query: { project_id: "77" }
    },
    {
        tool: "fc_fetch_lists",
        args: { project_id: "77", app_id: 13 },
        path: "/lists/13",
        query: { project_id: "77" }
    },
    {
        tool: "fc_add_list",
        args: { project_id: "77", title: "L", description: "D" },
        method: "POST",
        path: "/lists/2",
        body: { project_id: "77", title: "L", description: "D" }
    },
    {
        tool: "fc_edit_list",
        args: { list_id: "9", title: "L2", description: "D2" },
        method: "POST",
        path: "/lists/2/9",
        body: { title: "L2", description: "D2" }
    },
    {
        tool: "fc_delete_list",
        args: { app_id: 13, list_id: "9" },
        method: "DELETE",
        path: "/lists/13/9"
    },

    // ── Comments ───────────────────────────────────────────────────────────
    {
        tool: "fc_add_comment",
        args: { item_id: "42", app_id: 2, description: "<p>hi</p>" },
        method: "POST",
        path: "/comments",
        body: { item_id: "42", app_id: 2, description: "<p>hi</p>", attached_ids: [] }
    },
    {
        tool: "fc_add_comment",
        args: { item_id: "42", app_id: 2, description: "<p>hi</p>", attached_ids: ["7"] },
        method: "POST",
        path: "/comments",
        body: { item_id: "42", app_id: 2, description: "<p>hi</p>", attached_ids: ["7"] }
    },
    {
        tool: "fc_edit_comment",
        args: { comment_id: "c1", description: "edited" },
        method: "POST",
        path: "/comments/c1",
        body: { description: "edited" }
    },
    {
        tool: "fc_delete_comment",
        args: { comment_id: "c1" },
        method: "DELETE",
        path: "/comments/c1"
    },

    // ── Calendar Events ────────────────────────────────────────────────────
    {
        tool: "fc_fetch_events",
        args: { project_id: "77" },
        path: "/events",
        query: { project_id: "77" }
    },
    {
        tool: "fc_fetch_event",
        args: { event_id: "e1" },
        path: "/events/e1"
    },
    {
        tool: "fc_add_event",
        args: {
            project_id: "77",
            title: "Standup",
            start_date: "2026-01-05",
            start_time: "09:00",
            end_date: "2026-01-05",
            end_time: "09:30"
        },
        method: "POST",
        path: "/events",
        body: {
            project_id: "77",
            title: "Standup",
            start_date: "2026-01-05",
            start_time: "09:00",
            end_date: "2026-01-05",
            end_time: "09:30"
        }
    },
    {
        tool: "fc_add_event",
        args: { project_id: "77", title: "All day", start_date: "2026-01-05" },
        method: "POST",
        path: "/events",
        body: { project_id: "77", title: "All day", start_date: "2026-01-05" }
    },
    {
        tool: "fc_edit_event",
        args: { event_id: "e1", title: "Standup moved" },
        method: "POST",
        path: "/events/e1",
        body: { title: "Standup moved" }
    },
    {
        tool: "fc_delete_event",
        args: { event_id: "e1" },
        method: "DELETE",
        path: "/events/e1"
    },

    // ── Discussions ───────────────────────────────────────────────────────
    {
        tool: "fc_fetch_discussions",
        args: { project_id: "77" },
        path: "/discussions",
        query: { project_id: "77", limit: "200", offset: "0" }
    },
    {
        tool: "fc_fetch_discussion",
        args: { discussion_id: "d1" },
        path: "/discussions/d1"
    },
    {
        tool: "fc_add_discussion",
        args: { title: "Hello", project_id: "77", description: "body" },
        method: "POST",
        path: "/discussions",
        body: { title: "Hello", project_id: "77", description: "body" }
    },
    {
        tool: "fc_edit_discussion",
        args: { discussion_id: "d1", title: "Hello2", f_sticky: 1 },
        method: "POST",
        path: "/discussions/d1",
        body: { title: "Hello2", f_sticky: 1 }
    },
    {
        tool: "fc_delete_discussion",
        args: { discussion_id: "d1" },
        method: "DELETE",
        path: "/discussions/d1"
    },

    // ── Issues ─────────────────────────────────────────────────────────────
    {
        tool: "fc_fetch_issues",
        args: { project_id: "77" },
        path: "/issues",
        query: { project_id: "77", limit: "200", offset: "0" }
    },
    {
        tool: "fc_fetch_issue",
        args: { issue_id: "i1" },
        path: "/issues/i1"
    },
    {
        tool: "fc_add_issue",
        args: {
            title: "Bug",
            project_id: "77",
            priority: 3,
            status: 0,
            type: 1,
            assigned_to_id: "111",
            due_date: "2026-01-01",
            closer_id: "111",
            attached_ids: ["5"]
        },
        method: "POST",
        path: "/issues",
        body: {
            title: "Bug",
            project_id: "77",
            priority: 3,
            status: 0,
            type: 1,
            assigned_to_id: "111",
            due_date: "2026-01-01",
            closer_id: "111",
            attached_ids: ["5"]
        }
    },
    {
        tool: "fc_edit_issue",
        args: { issue_id: "i1", priority: 1 },
        method: "POST",
        path: "/issues/i1",
        body: { priority: 1 }
    },
    {
        tool: "fc_delete_issue",
        args: { issue_id: "i1" },
        method: "DELETE",
        path: "/issues/i1"
    },

    // ── Milestones ────────────────────────────────────────────────────────
    {
        tool: "fc_fetch_milestones",
        args: { project_id: "77" },
        path: "/milestones",
        query: { project_id: "77", limit: "200", offset: "0" }
    },
    {
        tool: "fc_fetch_milestone",
        args: { milestone_id: "m1" },
        path: "/milestones/m1"
    },
    {
        tool: "fc_add_milestone",
        args: {
            title: "Launch",
            project_id: "77",
            description: "Go",
            priority: 3,
            assigned_to_id: "111",
            due_date: "2026-01-01",
            status: 0,
            start_date: "2026-01-01"
        },
        method: "POST",
        path: "/milestones",
        body: {
            title: "Launch",
            project_id: "77",
            description: "Go",
            priority: 3,
            assigned_to_id: "111",
            due_date: "2026-01-01",
            status: 0,
            start_date: "2026-01-01"
        }
    },
    {
        tool: "fc_edit_milestone",
        args: { milestone_id: "m1", status: 1 },
        method: "POST",
        path: "/milestones/m1",
        body: { status: 1 }
    },
    {
        tool: "fc_delete_milestone",
        args: { milestone_id: "m1" },
        method: "DELETE",
        path: "/milestones/m1"
    },

    // ── Times ──────────────────────────────────────────────────────────────
    {
        tool: "fc_fetch_times",
        args: { project_id: "77" },
        path: "/times",
        query: { project_id: "77", limit: "200", offset: "0" }
    },
    {
        tool: "fc_fetch_time",
        args: { time_id: "t1" },
        path: "/times/t1"
    },
    {
        tool: "fc_add_time",
        args: { project_id: "77", description: "Work", date: "2026-01-01", minutes_count: 60, assigned_to_id: "111" },
        method: "POST",
        path: "/times",
        body: { project_id: "77", description: "Work", date: "2026-01-01", minutes_count: 60, assigned_to_id: "111" }
    },
    {
        tool: "fc_add_time",
        args: { project_id: "77", description: "Work", date: "2026-01-01", minutes_count: 60, f_started: true },
        method: "POST",
        path: "/times",
        // BoolFlag normalizes true → 1; unknown assignee is resolved from session
        body: { project_id: "77", description: "Work", date: "2026-01-01", minutes_count: 60, f_started: 1, assigned_to_id: "111" },
        respond: { data: { time: { id: "t2", started_ts: 1700000123, status: 0 } }, msg: "OK", status: "success" }
    },
    {
        tool: "fc_edit_time",
        args: { time_id: "t1", minutes_count: 90 },
        method: "POST",
        path: "/times/t1",
        body: { minutes_count: 90 }
    },
    {
        tool: "fc_delete_time",
        args: { time_id: "t1" },
        method: "DELETE",
        path: "/times/t1"
    },
    {
        tool: "fc_time_action",
        args: { time_id: "t1", action: "start" },
        method: "POST",
        path: "/times/t1",
        body: { action: "start" },
        entry: { started_ts: null, status: 0 },
        check: (result) => {
            if (result.structuredContent.data.time.started_ts !== 1700000123) throw new Error("timer did not start");
        }
    },
    {
        tool: "fc_time_action",
        args: { time_id: "t1", action: "stop" },
        method: "POST",
        path: "/times/t1",
        body: { action: "stop" },
        entry: { started_ts: 1700000123, status: 0 },
        check: (result) => {
            if (result.structuredContent.data.time.started_ts !== null) throw new Error("timer did not stop");
        }
    },
    {
        tool: "fc_time_action",
        args: { time_id: "t1", action: "bill" },
        method: "POST",
        path: "/times/t1",
        body: { action: "bill" },
        entry: { started_ts: null, status: 0 },
        check: (result) => {
            if (result.structuredContent.data.time.status !== 1) throw new Error("not billed");
        }
    },
    {
        tool: "fc_time_action",
        args: { time_id: "t1", action: "unbill" },
        method: "POST",
        path: "/times/t1",
        body: { action: "unbill" },
        entry: { started_ts: null, status: 1 },
        check: (result) => {
            if (result.structuredContent.data.time.status !== 2) throw new Error("not unbilled");
        }
    },

    // ── Wikis ──────────────────────────────────────────────────────────────
    {
        tool: "fc_fetch_wikis",
        args: { project_id: "77" },
        path: "/wikis",
        query: { project_id: "77", limit: "200", offset: "0", "order[title]": "asc" }
    },
    {
        tool: "fc_fetch_wikis",
        args: { project_id: "77", order_title: "desc" },
        path: "/wikis",
        query: { project_id: "77", limit: "200", offset: "0", "order[title]": "desc" }
    },
    {
        tool: "fc_fetch_wiki",
        args: { wiki_id: "w1" },
        path: "/wikis/w1"
    },
    {
        tool: "fc_add_wiki",
        args: { title: "Docs", project_id: "77", description: "content" },
        method: "POST",
        path: "/wikis",
        body: { title: "Docs", project_id: "77", description: "content" }
    },
    {
        tool: "fc_edit_wiki",
        args: { wiki_id: "w1", description: "v2" },
        method: "POST",
        path: "/wikis/w1",
        body: { f_new_version: false, description: "v2" }
    },
    {
        tool: "fc_edit_wiki",
        args: { wiki_id: "w1", title: "Docs", description: "v3", f_new_version: true },
        method: "POST",
        path: "/wikis/w1",
        body: { f_new_version: true, title: "Docs", description: "v3" }
    },
    {
        tool: "fc_delete_wiki",
        args: { wiki_id: "w1" },
        method: "DELETE",
        path: "/wikis/w1"
    },
    {
        tool: "fc_add_wiki_version",
        args: { wiki_id: "w1", title: "Docs", description: "v2" },
        method: "POST",
        path: "/wikis/w1",
        body: { f_new_version: true, title: "Docs", description: "v2" }
    },

    // ── Projects ────────────────────────────────────────────────────────────
    {
        tool: "fc_fetch_projects",
        args: {},
        path: "/projects",
        query: {}
    },
    {
        tool: "fc_fetch_project",
        args: { project_id: "77" },
        path: "/projects/77"
    },
    {
        tool: "fc_fetch_recent_project_ids",
        args: {},
        path: "/recent_project_ids",
        query: {}
    },
    {
        tool: "fc_add_project",
        args: {
            project_name: "New",
            project_description: "D",
            project_color: "1C7160",
            todo_view_type: "list",
            usage_type: 1,
            group_id: "g1"
        },
        method: "POST",
        path: "/projects",
        body: {
            project_name: "New",
            project_description: "D",
            project_color: "1C7160",
            todo_view_type: "list",
            usage_type: 1,
            group_id: "g1"
        }
    },
    {
        tool: "fc_add_project",
        args: { project_name: "New2", group_name: "Fresh" },
        method: "POST",
        path: "/projects",
        body: { project_name: "New2", group_name: "Fresh" }
    },
    {
        tool: "fc_edit_project",
        args: { project_id: "77", project_name: "Renamed" },
        method: "POST",
        path: "/projects/77",
        body: { project_name: "Renamed" }
    },
    {
        tool: "fc_leave_project",
        args: { membership_id: "mem1" },
        method: "DELETE",
        path: "/project_memberships/mem1"
    },
    {
        tool: "fc_delete_project",
        args: { project_id: "77" },
        method: "DELETE",
        path: "/projects/77"
    },

    // ── CRM Tasks ──────────────────────────────────────────────────────────
    {
        tool: "fc_fetch_crm_tasks",
        args: { group_id: "g1" },
        path: "/crm_tasks",
        query: { group_id: "g1", limit: "200", offset: "0" }
    },
    {
        tool: "fc_fetch_crm_task",
        args: { crm_task_id: "ct1" },
        path: "/crm_tasks/ct1"
    },
    {
        tool: "fc_add_crm_task",
        args: {
            title: "Call Bob",
            group_id: "g1",
            description: "notes",
            type: 1,
            contact_title: "Bob",
            f_private: 1,
            assigned_to_id: "111",
            due_date: "2026-01-01"
        },
        method: "POST",
        path: "/crm_tasks",
        body: {
            title: "Call Bob",
            group_id: "g1",
            description: "notes",
            type: 1,
            contact_title: "Bob",
            f_private: 1,
            assigned_to_id: "111",
            due_date: "2026-01-01"
        }
    },
    {
        tool: "fc_edit_crm_task",
        args: { crm_task_id: "ct1", status: 1 },
        method: "POST",
        path: "/crm_tasks/ct1",
        body: { status: 1 }
    },
    {
        tool: "fc_delete_crm_task",
        args: { crm_task_id: "ct1" },
        method: "DELETE",
        path: "/crm_tasks/ct1"
    },

    // ── CRM Calls ───────────────────────────────────────────────────────────
    {
        tool: "fc_fetch_crm_calls",
        args: { group_id: "g1" },
        path: "/crm_calls",
        query: { group_id: "g1", limit: "200", offset: "0" }
    },
    {
        tool: "fc_fetch_crm_call",
        args: { crm_call_id: "cc1" },
        path: "/crm_calls/cc1"
    },
    {
        tool: "fc_add_crm_call",
        args: {
            title: "Intro call",
            group_id: "g1",
            description: "notes",
            f_inbound: 1,
            contact_title: "Bob",
            assigned_to_id: "111",
            due_date: "2026-01-01",
            duration: 30
        },
        method: "POST",
        path: "/crm_calls",
        body: {
            title: "Intro call",
            group_id: "g1",
            description: "notes",
            f_inbound: 1,
            contact_title: "Bob",
            assigned_to_id: "111",
            due_date: "2026-01-01",
            duration: 30
        }
    },
    {
        tool: "fc_edit_crm_call",
        args: { crm_call_id: "cc1", duration: 45 },
        method: "POST",
        path: "/crm_calls/cc1",
        body: { duration: 45 }
    },
    {
        tool: "fc_delete_crm_call",
        args: { crm_call_id: "cc1" },
        method: "DELETE",
        path: "/crm_calls/cc1"
    },

    // ── Users / Groups / Session ───────────────────────────────────────────
    {
        tool: "fc_fetch_groups",
        args: {},
        path: "/groups",
        query: {}
    },
    {
        tool: "fc_fetch_users",
        args: {},
        path: "/users",
        query: {}
    },
    {
        tool: "fc_fetch_current_user",
        args: {},
        path: "/users/current",
        query: {}
    },
    {
        tool: "fc_fetch_user",
        args: { user_id: "111" },
        path: "/users/111"
    },
    {
        tool: "fc_update_current_user",
        args: { first_name: "A" },
        method: "POST",
        path: "/users/current",
        body: { first_name: "A" }
    },
    {
        tool: "fc_register_user",
        args: { email: "x@y.com", password: "pw123456", first_name: "A", last_name: "B" },
        method: "POST",
        path: "/users",
        body: { email: "x@y.com", password: "pw123456", first_name: "A", last_name: "B" }
    },
    {
        tool: "fc_delete_account",
        args: { password: "pw", confirm: "yes" },
        method: "POST",
        path: "/wipe/current",
        body: { password: "pw", confirm: "yes" }
    },
    {
        tool: "fc_request_password_reset",
        args: { email: "x@y.com" },
        method: "POST",
        path: "/password_reset_emails",
        body: { email: "x@y.com" }
    },
    {
        tool: "fc_apply_password_reset",
        args: { reset_key: "rk", password: "pw" },
        method: "POST",
        path: "/passwords",
        body: { reset_key: "rk", password: "pw" }
    },
    {
        tool: "fc_validate_email",
        args: { email: "x@y.com" },
        path: "/validations/email",
        query: { email: "x@y.com" }
    },
    {
        tool: "fc_delete_avatar",
        args: {},
        method: "DELETE",
        path: "/avatars/current"
    },

    // ── Notifications ─────────────────────────────────────────────────────
    {
        tool: "fc_fetch_notifications",
        args: {},
        path: "/notifications",
        check: (result, mcp, api) => {
            const req = api.requests[0];
            if (req.query.following !== "1") throw new Error("expected following=1");
            if (!/^\d+$/.test(req.query.from_ts)) throw new Error("expected numeric from_ts");
        }
    },
    {
        tool: "fc_fetch_all_notifications",
        args: {},
        path: "/notifications",
        query: {}
    },
    {
        tool: "fc_fetch_notifications_by_project",
        args: { project_id: "77" },
        path: "/notifications/77"
    },
    {
        tool: "fc_update_notification_read",
        args: { uid: "u1" },
        method: "POST",
        path: "/notifications",
        body: { new_state: "read", items: [{ item_u_key: "u1" }] }
    },
    {
        tool: "fc_edit_notifications",
        args: { new_state: "read", items: [{ item_u_key: "u1" }, { item_u_key: "u2" }] },
        method: "POST",
        path: "/notifications",
        body: { new_state: "read", items: [{ item_u_key: "u1" }, { item_u_key: "u2" }] }
    },

    // ── Files ──────────────────────────────────────────────────────────────
    {
        tool: "fc_fetch_file",
        args: { file_id: "f1" },
        path: "/files/f1"
    },
    {
        tool: "fc_add_file_meta",
        args: { project_id: "77", application_id: 2, item_id: "42", comment_id: "c1", temporary: 1 },
        method: "POST",
        path: "/files",
        body: { project_id: "77", application_id: 2, item_id: "42", comment_id: "c1", temporary: 1 }
    },
    {
        tool: "fc_upload_file",
        args: {
            content_base64: Buffer.from("hello").toString("base64"),
            filename: "a.txt",
            mime_type: "text/plain",
            project_id: "77",
            item_id: "42"
        },
        method: "POST",
        path: "/files",
        form: ["project_id", "item_id"]
    },
    {
        tool: "fc_delete_file",
        args: { file_id: "f1" },
        method: "DELETE",
        path: "/files/f1"
    },
    {
        tool: "fc_upload_avatar",
        args: {
            content_base64: Buffer.from("img").toString("base64"),
            filename: "avatar.png",
            mime_type: "image/png"
        },
        method: "POST",
        path: "/avatars/current",
        form: []
    },

    // ── Misc ────────────────────────────────────────────────────────────────
    {
        tool: "fc_fetch_cf_templates",
        args: {},
        path: "/cf_templates",
        query: { module_id: "2" }
    },
    {
        tool: "fc_fetch_cf_templates",
        args: { module_id: 13 },
        path: "/cf_templates",
        query: { module_id: "13" }
    },
    {
        tool: "fc_add_cf_template",
        args: { title: "Tpl", module_id: 2, fields: [{ type: "text", title: "F" }] },
        method: "POST",
        path: "/cf_templates",
        body: { title: "Tpl", module_id: 2, fields: [{ type: "text", title: "F" }] }
    },
    {
        tool: "fc_edit_cf_template",
        args: {
            cft_id: "ct",
            title: "Tpl2",
            module_id: 2,
            fields: [{ type: "dd", title: "D", dd_options: [{ option_id: 1, title: "A", f_default: false }] }],
            deleted_field_ids: [1],
            f_archived: true
        },
        method: "POST",
        path: "/cf_templates/ct",
        body: {
            title: "Tpl2",
            module_id: 2,
            fields: [{ type: "dd", title: "D", dd_options: [{ option_id: 1, title: "A", f_default: false }] }],
            deleted_field_ids: [1],
            f_archived: true
        }
    },
    {
        tool: "fc_fetch_linked_items",
        args: { app_id: 2, item_id: "42" },
        path: "/linked_items/2/42"
    },
    {
        tool: "fc_add_linked_items",
        args: { app_id: 2, item_id: "42", links: { "2": ["1", "2"] } },
        method: "POST",
        path: "/linked_items/2/42",
        body: { "2": ["1", "2"] }
    },
    {
        tool: "fc_fetch_overview",
        args: { project_id: "77" },
        path: "/overviews/77"
    },
    {
        tool: "fc_fetch_current_session",
        args: {},
        path: "/sessions/current",
        query: {}
    },
    {
        tool: "fc_fetch_invitations",
        args: {},
        path: "/invitations",
        query: {}
    },
    {
        tool: "fc_respond_invitation",
        args: { invitation_id: "in1", action: "accept", project_id: "77" },
        method: "POST",
        path: "/invitations",
        body: { invitation_id: "in1", action: "accept", project_id: "77" }
    },
    {
        tool: "fc_fetch_calendar_items",
        args: { project_id: "77" },
        path: "/calendar_items",
        query: { project_id: "77" }
    },
    {
        tool: "fc_add_favorite_project",
        args: { project_id: "77" },
        method: "POST",
        path: "/favorite_projects/77"
    },
    {
        tool: "fc_delete_favorite_project",
        args: { project_id: "77" },
        method: "DELETE",
        path: "/favorite_projects/77"
    },
    {
        tool: "fc_fetch_timezones",
        args: {},
        path: "/timezones",
        query: {}
    },
    {
        tool: "fc_fetch_backups",
        args: {},
        path: "/backups",
        query: {}
    },
    {
        tool: "fc_fetch_wipe_current",
        args: {},
        path: "/wipe/current",
        query: {}
    },

    // ── Helpers ────────────────────────────────────────────────────────────
    {
        tool: "fc_get_groups_projects",
        args: {},
        noApi: true,
        check: (result) => {
            const groups = result.structuredContent.groups;
            if (!Array.isArray(groups) || groups.length !== 1) throw new Error("expected one group");
            const g = groups[0];
            if (g.name !== "Acme" || g.id !== "g1") throw new Error("bad group");
            if (JSON.stringify(g.applications) !== JSON.stringify(["Tasks"])) throw new Error("bad apps");
            if (g.projects.length !== 1 || g.projects[0].project_name !== "Website" || g.projects[0].id !== "77") {
                throw new Error("bad project");
            }
        }
    },
    {
        tool: "fc_add_item_by_names",
        args: { project_name: "Website", app_name: "Tasks", title: "By name" },
        method: "POST",
        path: "/tasks",
        body: { title: "By name", project_id: "77" }
    },
    {
        tool: "fc_add_comment_by_names",
        args: { item_id: "42", app_name: "Issue Tracker", description: "<p>bug</p>" },
        method: "POST",
        path: "/comments",
        body: { item_id: "42", app_id: 13, description: "<p>bug</p>", attached_ids: [] }
    },
    {
        tool: "fc_update_status",
        args: { item_id: "42", status: 2 },
        method: "POST",
        path: "/tasks/42",
        body: { status: 2 }
    }
];
