<script type="text/x-dc" data-dc-script="" data-props="{
  &quot;showExamples&quot;: { &quot;editor&quot;: &quot;boolean&quot;, &quot;default&quot;: true, &quot;tsType&quot;: &quot;boolean&quot;, &quot;section&quot;: &quot;Tool reference&quot; },
  &quot;showAnnotations&quot;: { &quot;editor&quot;: &quot;boolean&quot;, &quot;default&quot;: true, &quot;tsType&quot;: &quot;boolean&quot;, &quot;section&quot;: &quot;Tool reference&quot; },
  &quot;defaultTheme&quot;: { &quot;editor&quot;: &quot;enum&quot;, &quot;options&quot;: [&quot;light&quot;, &quot;dark&quot;], &quot;default&quot;: &quot;light&quot;, &quot;tsType&quot;: &quot;\&quot;light\&quot; | \&quot;dark\&quot;&quot;, &quot;section&quot;: &quot;Appearance&quot; }
}">
const DARK = {
  "--surface-app": "#14161b",
  "--surface-card": "#1c1f26",
  "--surface-sunken": "#23262e",
  "--surface-hover": "#262a33",
  "--surface-selected": "#22314d",
  "--text-primary": "#e8eaef",
  "--text-secondary": "#a2aab9",
  "--text-muted": "#7d8595",
  "--border-subtle": "#2c313b",
  "--border-default": "#3a404c",
  "--gray-50": "#14161b",
  "--gray-100": "#23262e",
  "--gray-150": "#2c313b",
  "--gray-200": "#3a404c",
  "--gray-250": "#454c59",
  "--gray-700": "#c3cad6",
  "--gray-900": "#e8eaef",
  "--color-primary-tint": "#1d2a44",
  "--color-danger-tint": "#2e1e20",
  "--blue-700": "#a3c2fb",
  "--red-700": "#e79ca5",
  "--ring-border": "inset 0 0 0 1px #2c313b"
};

const SAMPLE = {
  project_id: "7451190", task_id: "18432901", list_id: "9012345", issue_id: "5511207",
  milestone_id: "3308115", time_id: "7723004", wiki_id: "4419902", event_id: "6620481",
  discussion_id: "2231560", comment_id: "9987120", crm_task_id: "1150223", crm_call_id: "1150887",
  group_id: "1120034", user_id: "4410021", file_id: "8834110", item_id: "18432901",
  membership_id: "6640012", invitation_id: "7710033", cft_id: "220145", uid: "t_18432901",
  file_path: "/Users/you/Desktop/spec.pdf", reset_key: "b91f…", closer_id: "4410021",
  title: "Fix login race condition", project_name: "API Platform", app_name: "Tasks",
  description: "<p>Two tabs, one session — reproduces on staging.</p>",
  project_name_field: "API Platform", due_date: "2026-09-11", date: "2026-09-04",
  start_date: "2026-09-08", end_date: "2026-09-08", minutes_count: 45, duration: 20,
  app_id: 2, application_id: 2, module_id: 2, status: 2, priority: 3, type: 1,
  assigned_to_id: "4410021", email: "you@example.com", password: "••••••••",
  current_password: "••••••••", first_name: "Ada", last_name: "Lovelace",
  action: "start", timezone: "America/Los_Angeles", contact_title: "Acme Corp",
  project_description: "Public API and SDKs", project_color: "1C7160",
  start_time: "09:30", end_time: "10:15", r_rule: "FREQ=WEEKLY;BYDAY=MO,WE",
  h_parent_id: "18432900", task_group_id: "9012345", minutes: 45,
  batch_ids: ["18432901", "18432902"], attached_ids: ["8834110"],
  mixed_users: ["4410021"], private_users: ["4410021"], assigned_ids: ["4410021"],
  tags: ["auth", "regression"], follower_ids: ["4410021"], links: { "13": ["5511207"] },
  items: [{ item_u_key: "t_18432901" }], deleted_field_ids: [220188],
  filters: { status: ["STATUS_IN_PROGRESS"], assigned_to_id: ["4410021"], due_date_to: "2026-09-11" },
  custom_fields: [{ cf_id: "220145", value: "Backend" }],
  fields: [{ title: "Team", type: "dd", dd_options: [{ title: "Backend" }, { title: "Frontend" }] }],
  content_base64: "JVBERi0xLjQK…", filename: "spec.pdf", mime_type: "application/pdf",
  list_title: "Release 4.2", list_descr: "Work for the 4.2 cut", order_title: "asc",
  todo_view_type: "board", usage_type: 1, group_name: "Engineering", cs_tpl_id: "220145",
  new_state: "read", response: "accept", cf_tpl_id: 220145, comment_id_ref: "9987120",
  completed_date: "2026-09-11", f_all_day: 1, f_billed: 1, f_started: 1, f_sticky: 1,
  f_private: 1, f_public: 1, f_inbound: 1, f_new_version: true, f_archived: false,
  f_response_notify: 1, temporary: 1, owner_id: "4410021", ms_id: "3308115",
  followers_operation: "append", confirm: "yes", list_status: "active", limit: 25, offset: 0
};

function sampleFor(name, type) {
  if (Object.prototype.hasOwnProperty.call(SAMPLE, name)) return SAMPLE[name];
  if (type === "int" || type === "number") return 1;
  if (type === "boolean") return true;
  if (type.indexOf("[]") > -1) return [];
  if (type === "object") return {};
  return "…";
}

const PG = [
  ["limit", "int", 0, "Maximum results per page."],
  ["offset", "int", 0, "Results to skip, for paging."]
];

function g(name, anchor, blurb, tools) {
  return { name: name, anchor: anchor, blurb: blurb, tools: tools };
}
function t(name, desc, params, exampleOverride) {
  return { name: name, desc: desc, rawParams: params || [], exampleOverride: exampleOverride };
}

const CATALOG = [
  g("Helpers & discovery", "tools-helpers",
    "Start here. These resolve your workspace by human-readable name so nothing downstream has to guess an ID.", [
      t("fc_get_groups_projects", "Groups, projects and their apps keyed by readable name. The preferred first call in any conversation — call once, reuse the result.", []),
      t("fc_fetch_current_session", "The current user and session, including raw groups and projects. Call once at the start rather than repeatedly.", []),
      t("fc_add_item_by_names", "Add an item to an app inside a project by name instead of ID. Tasks are supported today.", [
        ["project_name", "string", 1, "A project name from fc_get_groups_projects."],
        ["app_name", "string", 1, "App name, e.g. Tasks, Discussions, Issue Tracker."],
        ["title", "string", 1, "Title of the item to add."]
      ]),
      t("fc_add_comment_by_names", "Comment on any item, naming the app instead of passing a numeric app_id.", [
        ["item_id", "string", 1, "ID of the task, issue or discussion to comment on."],
        ["app_name", "string", 1, "App name that owns the item."],
        ["description", "string", 1, "Comment body — wrap in <p> tags."]
      ]),
      t("fc_update_status", "Update a task's status with a single call.", [
        ["item_id", "string", 1, "ID of the task to update."],
        ["status", "string | int", 1, "0 not started, 1 completed, 2 in progress, 3 invalid, 4 review."]
      ])
    ]),

  g("Projects", "tools-projects",
    "Create, edit, favourite and leave projects. Overview returns the project's dashboard summary.", [
      t("fc_fetch_projects", "Every project, flat — no group or app context. Prefer fc_get_groups_projects.", []),
      t("fc_fetch_project", "A single project by ID.", [["project_id", "string", 1, "ID of the project to fetch."]]),
      t("fc_fetch_recent_project_ids", "IDs of the projects you touched most recently.", []),
      t("fc_add_project", "Create a project, optionally inside a new or existing group.", [
        ["project_name", "string", 1, "Name of the new project."],
        ["project_description", "string", 0, "Description of the project."],
        ["project_color", "string", 0, "Hex colour without the leading #, e.g. 1C7160."],
        ["todo_view_type", "string", 0, "Default task view — list or board."],
        ["usage_type", "int", 0, "Freedcamp usage-type ID for the project template."],
        ["group_id", "string", 0, "Existing group to create the project under."],
        ["group_name", "string", 0, "Name for a new group to create for it."]
      ]),
      t("fc_edit_project", "Rename a project, recolour it, or move it between groups.", [
        ["project_id", "string", 1, "ID of the project to edit."],
        ["project_name", "string", 0, "New project name."],
        ["project_color", "string", 0, "New hex colour, no leading #."],
        ["group_id", "string", 0, "Move the project to this group."],
        ["cs_tpl_id", "string", 0, "Custom-field template to apply."]
      ]),
      t("fc_leave_project", "Leave a project you are a member of.", [["membership_id", "string", 1, "Your membership ID — not the project ID."]]),
      t("fc_delete_project", "Permanently delete a project.", [["project_id", "string", 1, "ID of the project to delete."]]),
      t("fc_fetch_overview", "The project's overview payload — progress, activity and app summaries.", [["project_id", "string", 1, "ID of the project."]]),
      t("fc_add_favorite_project", "Pin a project to your favourites.", [["project_id", "string", 1, "ID of the project."]]),
      t("fc_delete_favorite_project", "Remove a project from your favourites.", [["project_id", "string", 1, "ID of the project."]])
    ]),

  g("Tasks", "tools-tasks",
    "The busiest group. Tasks carry status, priority, assignee, dates, recurrence, subtasks, tags and custom fields — and can be edited 500 at a time.", [
      t("fc_fetch_task", "A single task by ID.", [["task_id", "string", 1, "ID of the task to fetch."]]),
      t("fc_fetch_tasks", "List tasks with filters and sorting. Omit project_id to search across every project you can see.", PG.concat([
        ["project_id", "string", 0, "Restrict to one project. Omit for all accessible projects."],
        ["filters.status", "string[]", 0, "STATUS_NOT_STARTED, STATUS_COMPLETED, STATUS_IN_PROGRESS, STATUS_INVALID, STATUS_REVIEW."],
        ["filters.assigned_to_id", "string[]", 0, "Only tasks assigned to these user IDs."],
        ["filters.created_by_id", "string", 0, "Only tasks created by this user."],
        ["filters.due_date_from", "string", 0, "Due on or after YYYY-MM-DD."],
        ["filters.due_date_to", "string", 0, "Due on or before YYYY-MM-DD."],
        ["filters.created_date_from", "string", 0, "Created on or after YYYY-MM-DD."],
        ["filters.created_date_to", "string", 0, "Created on or before YYYY-MM-DD."],
        ["filters.f_with_archived", "int", 0, "1 includes tasks from archived lists; 0 is the default."],
        ["filters.list_status", "string", 0, "Filter by parent list status — active or archived."],
        ["filters.f_include_tags", "int", 0, "1 returns each task's tags."],
        ["filters.order_priority", "asc | desc", 0, "Sort by priority."],
        ["filters.order_due_date", "asc | desc", 0, "Sort by due date."]
      ]), '{\n  "name": "fc_fetch_tasks",\n  "arguments": {\n    "project_id": "7451190",\n    "limit": 25,\n    "filters": {\n      "status": ["STATUS_NOT_STARTED", "STATUS_IN_PROGRESS"],\n      "assigned_to_id": ["4410021"],\n      "due_date_to": "2026-09-11",\n      "order_due_date": "asc"\n    }\n  }\n}'),
      t("fc_add_task", "Create a task, with scheduling, recurrence, assignment, attachments, subtasks and custom fields.", [
        ["title", "string", 1, "Task title."],
        ["project_id", "string", 1, "Project the task belongs to."],
        ["description", "string", 0, "Body text — plain text or HTML."],
        ["list_id", "string", 0, "Task list to place it in. Omit for the project default."],
        ["task_group_id", "string", 0, "Legacy alias for list_id. Send one or the other."],
        ["priority", "int", 0, "0 none, 1 low, 2 medium, 3 high."],
        ["assigned_to_id", "string", 0, "User to assign it to."],
        ["start_date", "string", 0, "YYYY-MM-DD or YYYY-MM-DD HH:mm:ss. Surfaces in the calendar."],
        ["due_date", "string", 0, "YYYY-MM-DD or YYYY-MM-DD HH:mm:ss."],
        ["r_rule", "string", 0, "Recurrence, e.g. FREQ=WEEKLY;BYDAY=MO,WE."],
        ["status", "int", 0, "0 not started, 1 completed, 2 in progress, 3 invalid, 4 review."],
        ["completed_date", "string", 0, "Set alongside status 1."],
        ["attached_ids", "string[]", 0, "IDs of files already uploaded."],
        ["h_parent_id", "string", 0, "Parent task, making this a subtask. Same list, and the parent cannot itself be a subtask."],
        ["cf_tpl_id", "int", 0, "Custom-fields template ID. Usually inferred."],
        ["custom_fields", "object[]", 0, "{ cf_id, value, dd_actual_value } from fc_fetch_cf_templates."]
      ], '{\n  "name": "fc_add_task",\n  "arguments": {\n    "title": "Fix login race condition",\n    "project_id": "7451190",\n    "description": "<p>Two tabs, one session — reproduces on staging.</p>",\n    "list_id": "9012345",\n    "priority": 3,\n    "status": 2,\n    "assigned_to_id": "4410021",\n    "due_date": "2026-09-11"\n  }\n}'),
      t("fc_update_task", "Update any field on a task, move it between lists, or make it a subtask.", [
        ["task_id", "string", 1, "ID of the task to update."],
        ["title", "string", 0, "New title."],
        ["description", "string", 0, "New body text."],
        ["list_id", "string", 0, "Move the task to this list."],
        ["task_group_id", "string", 0, "Legacy alias for list_id."],
        ["status", "int", 0, "0 not started, 1 completed, 2 in progress, 3 invalid, 4 review."],
        ["priority", "int", 0, "0 none, 1 low, 2 medium, 3 high."],
        ["assigned_to_id", "string", 0, "Reassign to this user."],
        ["start_date", "string", 0, "New start date. Empty string clears it."],
        ["due_date", "string", 0, "New due date."],
        ["r_rule", "string", 0, "New recurrence. Empty string stops recurrence."],
        ["attached_ids", "string[]", 0, "Replaces the current attachment set."],
        ["h_parent_id", "string", 0, "New parent. Empty string promotes a subtask back to top level."],
        ["cf_tpl_id", "int", 0, "Custom-fields template ID."],
        ["custom_fields", "object[]", 0, "Custom field values to set."]
      ]),
      t("fc_batch_edit_tasks", "Apply the same change to up to 500 tasks in one request. Only the fields you send change.", [
        ["batch_ids", "string[]", 1, "1–500 task IDs to edit."],
        ["status", "int", 0, "Status to set on every listed task."],
        ["priority", "int", 0, "Priority to set on every listed task."],
        ["assigned_to_id", "string", 0, "Single assignee for all of them."],
        ["assigned_ids", "string[]", 0, "Multiple assignees, replacing the current set."],
        ["title", "string", 0, "New title for every listed task."],
        ["description", "string", 0, "New description for every listed task."],
        ["start_date", "string", 0, "Start date to set."],
        ["due_date", "string", 0, "Due date to set."],
        ["ms_id", "string", 0, "Milestone to link them to."],
        ["h_parent_id", "string", 0, "Parent task to nest them under."],
        ["tags", "string[]", 0, "Tag names to set."],
        ["custom_fields", "object[]", 0, "Custom field values to set."],
        ["follower_ids", "string[]", 0, "Followers to add or remove."],
        ["followers_operation", "string", 0, "append or remove, controlling follower_ids."]
      ], '{\n  "name": "fc_batch_edit_tasks",\n  "arguments": {\n    "batch_ids": ["18432901", "18432902", "18432903"],\n    "status": 1,\n    "assigned_to_id": "4410021"\n  }\n}'),
      t("fc_delete_task", "Delete a task.", [["task_id", "string", 1, "ID of the task to delete."]])
    ]),

  g("Lists", "tools-lists",
    "Lists are the containers inside an app — task lists, discussion folders, wiki folders. app_id defaults to 2 (Tasks).", [
      t("fc_fetch_lists", "Lists for a project, for one app.", [
        ["project_id", "string", 1, "Project whose lists to fetch."],
        ["app_id", "int", 0, "App the lists belong to. Default 2 (Tasks)."]
      ]),
      t("fc_add_list", "Create a list.", [
        ["project_id", "string", 1, "Project the list belongs to."],
        ["title", "string", 1, "List title."],
        ["app_id", "int", 0, "App to create it under. Default 2 (Tasks)."],
        ["description", "string", 0, "List description."]
      ]),
      t("fc_edit_list", "Rename or re-describe a list.", [
        ["list_id", "string", 1, "ID of the list to edit."],
        ["title", "string", 1, "New list title."],
        ["app_id", "int", 0, "App the list belongs to. Default 2."],
        ["description", "string", 0, "New description."]
      ]),
      t("fc_delete_list", "Delete a list.", [
        ["list_id", "string", 1, "ID of the list to delete."],
        ["app_id", "int", 0, "App the list belongs to. Default 2."]
      ])
    ]),

  g("Comments", "tools-comments",
    "One comment surface for every app. Pass the app_id that owns the item, or use fc_add_comment_by_names.", [
      t("fc_add_comment", "Comment on a task, issue, discussion or any other item.", [
        ["item_id", "string", 1, "ID of the item to comment on."],
        ["app_id", "int", 1, "App that owns the item — 2 Tasks, 3 Discussions, 13 Issue Tracker."],
        ["description", "string", 1, "Comment body."],
        ["attached_ids", "string[]", 0, "IDs of files already uploaded."]
      ]),
      t("fc_edit_comment", "Rewrite a comment body.", [
        ["comment_id", "string", 1, "ID of the comment to edit."],
        ["description", "string", 1, "New comment body."]
      ]),
      t("fc_delete_comment", "Delete a comment.", [["comment_id", "string", 1, "ID of the comment to delete."]])
    ]),

  g("Calendar", "tools-calendar",
    "Events with times, all-day flags, recurrence and invitees. fc_fetch_calendar_items also picks up dated tasks and milestones.", [
      t("fc_fetch_events", "List calendar events.", [["project_id", "string", 0, "Restrict to one project. Omit for all."]]),
      t("fc_fetch_event", "A single event.", [["event_id", "string", 1, "ID of the event."]]),
      t("fc_add_event", "Create an event, optionally recurring, with invitees.", [
        ["project_id", "string", 1, "Project the event belongs to."],
        ["title", "string", 1, "Event title."],
        ["start_date", "string", 1, "Start date, YYYY-MM-DD."],
        ["description", "string", 0, "Event description."],
        ["f_all_day", "int", 0, "1 for an all-day event, 0 for a timed one."],
        ["start_time", "string", 0, "HH:mm. Omit for all-day events."],
        ["end_date", "string", 0, "End date, YYYY-MM-DD."],
        ["end_time", "string", 0, "HH:mm. Omit for all-day events."],
        ["r_rule", "string", 0, "iCalendar RRULE, e.g. FREQ=WEEKLY;COUNT=10."],
        ["f_response_notify", "int", 0, "1 notifies the organizer when invitees respond."],
        ["mixed_users", "string[]", 0, "User IDs to invite."],
        ["attached_ids", "string[]", 0, "IDs of files already uploaded."]
      ]),
      t("fc_edit_event", "Edit an event's title, timing, recurrence or attachments.", [
        ["event_id", "string", 1, "ID of the event to edit."],
        ["title", "string", 0, "New title."],
        ["description", "string", 0, "New description."],
        ["f_all_day", "int", 0, "1 all-day, 0 timed."],
        ["start_date", "string", 0, "New start date."],
        ["start_time", "string", 0, "New start time."],
        ["end_date", "string", 0, "New end date."],
        ["end_time", "string", 0, "New end time."],
        ["r_rule", "string", 0, "New recurrence rule."],
        ["attached_ids", "string[]", 0, "Attachment IDs."]
      ]),
      t("fc_delete_event", "Delete an event.", [["event_id", "string", 1, "ID of the event to delete."]]),
      t("fc_fetch_calendar_items", "Everything dated in a project — events plus tasks and milestones with dates.", [["project_id", "string", 0, "Restrict to one project. Omit for all."]])
    ]),

  g("Discussions", "tools-discussions",
    "Threaded conversations, optionally sticky or private to named users.", [
      t("fc_fetch_discussions", "List discussions in a project.", PG.concat([["project_id", "string", 1, "Project whose discussions to fetch."]])),
      t("fc_fetch_discussion", "A single discussion.", [["discussion_id", "string", 1, "ID of the discussion."]]),
      t("fc_add_discussion", "Start a discussion, filed under an existing or brand-new list.", [
        ["title", "string", 1, "Discussion title."],
        ["project_id", "string", 1, "Project it belongs to."],
        ["description", "string", 0, "Opening post body."],
        ["list_id", "string", 0, "Existing list to file it under."],
        ["list_title", "string", 0, "Title for a new list to create for it."],
        ["list_descr", "string", 0, "Description for that new list."],
        ["f_sticky", "int", 0, "1 pins it to the top."],
        ["f_private", "int", 0, "1 limits it to private_users."],
        ["private_users", "string[]", 0, "User IDs allowed to see it when private."],
        ["notifications", "string[]", 0, "User IDs to notify."],
        ["attached_ids", "string[]", 0, "IDs of files already uploaded."]
      ]),
      t("fc_edit_discussion", "Rename, re-file or pin a discussion.", [
        ["discussion_id", "string", 1, "ID of the discussion to edit."],
        ["title", "string", 0, "New title."],
        ["list_id", "string", 0, "Move it to this list."],
        ["list_title", "string", 0, "Title for a new list to move it into."],
        ["list_descr", "string", 0, "Description for that new list."],
        ["f_sticky", "int", 0, "1 pins, 0 unpins."]
      ]),
      t("fc_delete_discussion", "Delete a discussion.", [["discussion_id", "string", 1, "ID of the discussion to delete."]])
    ]),

  g("Issue Tracker", "tools-issues",
    "Bug and request tracking. Status and type are project-defined workflow IDs, so read them off an existing issue first.", [
      t("fc_fetch_issues", "List issues in a project.", PG.concat([["project_id", "string", 1, "Project whose issues to fetch."]])),
      t("fc_fetch_issue", "A single issue.", [["issue_id", "string", 1, "ID of the issue."]]),
      t("fc_add_issue", "File an issue.", [
        ["title", "string", 1, "Issue title."],
        ["project_id", "string", 1, "Project it belongs to."],
        ["description", "string", 0, "Issue description."],
        ["priority", "int", 0, "0 none, 1 low, 2 medium, 3 high."],
        ["status", "int", 0, "Project-defined workflow status ID."],
        ["type", "int", 0, "Project-defined type ID, e.g. bug or feature."],
        ["assigned_to_id", "string", 0, "User to assign it to."],
        ["due_date", "string", 0, "YYYY-MM-DD."],
        ["closer_id", "string", 0, "User who resolved it."],
        ["attached_ids", "string[]", 0, "IDs of files already uploaded."]
      ]),
      t("fc_edit_issue", "Update an issue's fields, status or assignee.", [
        ["issue_id", "string", 1, "ID of the issue to edit."],
        ["title", "string", 0, "New title."],
        ["description", "string", 0, "New description."],
        ["priority", "int", 0, "0 none, 1 low, 2 medium, 3 high."],
        ["status", "int", 0, "Project-defined workflow status ID."],
        ["type", "int", 0, "Project-defined type ID."],
        ["assigned_to_id", "string", 0, "Reassign to this user."],
        ["due_date", "string", 0, "New due date."],
        ["closer_id", "string", 0, "User who resolved it."],
        ["attached_ids", "string[]", 0, "Attachment IDs."]
      ]),
      t("fc_delete_issue", "Delete an issue.", [["issue_id", "string", 1, "ID of the issue to delete."]])
    ]),

  g("Milestones", "tools-milestones",
    "Dated goalposts you can hang tasks off via fc_batch_edit_tasks and its ms_id field.", [
      t("fc_fetch_milestones", "List milestones in a project.", PG.concat([["project_id", "string", 1, "Project whose milestones to fetch."]])),
      t("fc_fetch_milestone", "A single milestone.", [["milestone_id", "string", 1, "ID of the milestone."]]),
      t("fc_add_milestone", "Create a milestone.", [
        ["title", "string", 1, "Milestone title."],
        ["project_id", "string", 1, "Project it belongs to."],
        ["description", "string", 0, "Milestone description."],
        ["priority", "int", 0, "0 none, 1 low, 2 medium, 3 high."],
        ["status", "int", 0, "0 not started, 1 completed, 2 in progress, 3 invalid, 4 review."],
        ["assigned_to_id", "string", 0, "User to assign it to."],
        ["start_date", "string", 0, "YYYY-MM-DD."],
        ["due_date", "string", 0, "YYYY-MM-DD."]
      ]),
      t("fc_edit_milestone", "Update a milestone.", [
        ["milestone_id", "string", 1, "ID of the milestone to edit."],
        ["title", "string", 0, "New title."],
        ["description", "string", 0, "New description."],
        ["priority", "int", 0, "0 none, 1 low, 2 medium, 3 high."],
        ["status", "int", 0, "New status."],
        ["assigned_to_id", "string", 0, "Reassign to this user."],
        ["start_date", "string", 0, "New start date."],
        ["due_date", "string", 0, "New due date."]
      ]),
      t("fc_delete_milestone", "Delete a milestone.", [["milestone_id", "string", 1, "ID of the milestone to delete."]])
    ]),

  g("Time tracking", "tools-time",
    "Log minutes, run timers and mark work billed. Timer actions verify the entry actually changed state.", [
      t("fc_fetch_times", "List time entries in a project.", PG.concat([["project_id", "string", 1, "Project whose entries to fetch."]])),
      t("fc_fetch_time", "A single time entry.", [["time_id", "string", 1, "ID of the entry."]]),
      t("fc_add_time", "Log time, or start a running timer.", [
        ["project_id", "string", 1, "Project the entry belongs to."],
        ["date", "string", 1, "Date logged, YYYY-MM-DD."],
        ["minutes_count", "int", 1, "Duration in minutes."],
        ["description", "string", 0, "What the work was."],
        ["assigned_to_id", "string", 0, "Whose time this is. Defaults to you; the call fails if it cannot be determined."],
        ["f_started", "int | boolean", 0, "1 or true creates it as a running timer."],
        ["f_billed", "int | boolean", 0, "1 or true marks it billed."]
      ], '{\n  "name": "fc_add_time",\n  "arguments": {\n    "project_id": "7451190",\n    "date": "2026-09-04",\n    "minutes_count": 45,\n    "description": "Acme refactor",\n    "f_billed": 1\n  }\n}'),
      t("fc_edit_time", "Adjust an entry's duration, date, note or owner.", [
        ["time_id", "string", 1, "ID of the entry to edit."],
        ["description", "string", 0, "New description."],
        ["assigned_to_id", "string", 0, "Reassign the entry."],
        ["date", "string", 0, "New date."],
        ["minutes_count", "int", 0, "New duration in minutes."]
      ]),
      t("fc_delete_time", "Delete a time entry.", [["time_id", "string", 1, "ID of the entry to delete."]]),
      t("fc_time_action", "Start, stop, bill or unbill an entry. If nothing actually changed, the call fails rather than reporting success.", [
        ["time_id", "string", 1, "ID of the entry to act on."],
        ["action", "start | stop | bill | unbill", 1, "The action to perform."]
      ])
    ]),

  g("Wikis", "tools-wikis",
    "Versioned pages with private and public visibility. Edits can overwrite or save as a new version.", [
      t("fc_fetch_wikis", "List wiki pages in a project.", PG.concat([
        ["project_id", "string", 1, "Project whose pages to fetch."],
        ["order_title", "string", 0, "asc or desc by title. Default asc."]
      ])),
      t("fc_fetch_wiki", "A single wiki page.", [["wiki_id", "string", 1, "ID of the page."]]),
      t("fc_add_wiki", "Create a wiki page.", [
        ["title", "string", 1, "Page title."],
        ["project_id", "string", 1, "Project it belongs to."],
        ["description", "string", 0, "Page content — HTML or plain text."],
        ["list_id", "string", 0, "Existing wiki folder to file it under."],
        ["list_title", "string", 0, "Title for a new folder to create."],
        ["list_descr", "string", 0, "Description for that new folder."],
        ["f_private", "int", 0, "1 limits it to private_users."],
        ["f_public", "int", 0, "1 makes it viewable without login."],
        ["private_users", "string[]", 0, "User IDs allowed to view it when private."],
        ["attached_ids", "string[]", 0, "IDs of files already uploaded."]
      ]),
      t("fc_edit_wiki", "Edit a page — overwrite it, or save the edit as a new version.", [
        ["wiki_id", "string", 1, "ID of the page to edit."],
        ["title", "string", 0, "New title."],
        ["description", "string", 0, "New content."],
        ["list_id", "string", 0, "Move it to this folder."],
        ["list_title", "string", 0, "Title for a new folder to move it into."],
        ["list_descr", "string", 0, "Description for that new folder."],
        ["f_private", "int", 0, "1 limits it to private_users."],
        ["f_public", "int", 0, "1 makes it publicly viewable."],
        ["private_users", "string[]", 0, "User IDs allowed to view it."],
        ["attached_ids", "string[]", 0, "Attachment IDs."],
        ["f_new_version", "boolean", 0, "true saves the edit as a new version instead of overwriting."]
      ]),
      t("fc_delete_wiki", "Delete a wiki page.", [["wiki_id", "string", 1, "ID of the page to delete."]]),
      t("fc_add_wiki_version", "Add a new version to an existing page.", [
        ["wiki_id", "string", 1, "ID of the page."],
        ["title", "string", 0, "Title for the new version."],
        ["description", "string", 0, "Content for the new version."],
        ["attached_ids", "string[]", 0, "Attachment IDs."]
      ])
    ]),

  g("CRM", "tools-crm",
    "CRM tasks and call logs. These live on a group (the CRM workspace), not a project — pass group_id.", [
      t("fc_fetch_crm_tasks", "List CRM tasks in a group.", PG.concat([["group_id", "string", 1, "Group whose CRM tasks to fetch."]])),
      t("fc_fetch_crm_task", "A single CRM task.", [["crm_task_id", "string", 1, "ID of the CRM task."]]),
      t("fc_add_crm_task", "Create a CRM task against a contact.", [
        ["title", "string", 1, "CRM task title."],
        ["group_id", "string", 1, "Group the task belongs to."],
        ["description", "string", 0, "Task description."],
        ["type", "int", 0, "CRM task type ID — call, meeting, to-do."],
        ["contact_title", "string", 0, "Name of the related contact."],
        ["f_private", "int", 0, "1 makes it private."],
        ["assigned_to_id", "string", 0, "User to assign it to."],
        ["due_date", "string", 0, "YYYY-MM-DD."]
      ]),
      t("fc_edit_crm_task", "Update a CRM task.", [
        ["crm_task_id", "string", 1, "ID of the CRM task to edit."],
        ["title", "string", 0, "New title."],
        ["description", "string", 0, "New description."],
        ["status", "int", 0, "CRM task status ID."],
        ["type", "int", 0, "CRM task type ID."],
        ["contact_title", "string", 0, "Related contact name."],
        ["f_private", "int", 0, "1 makes it private."],
        ["assigned_to_id", "string", 0, "Reassign to this user."],
        ["due_date", "string", 0, "New due date."]
      ]),
      t("fc_delete_crm_task", "Delete a CRM task.", [["crm_task_id", "string", 1, "ID of the CRM task to delete."]]),
      t("fc_fetch_crm_calls", "List CRM calls in a group.", PG.concat([["group_id", "string", 1, "Group whose calls to fetch."]])),
      t("fc_fetch_crm_call", "A single CRM call.", [["crm_call_id", "string", 1, "ID of the call."]]),
      t("fc_add_crm_call", "Log a call, inbound or outbound.", [
        ["title", "string", 1, "Call title or subject."],
        ["group_id", "string", 1, "Group the call belongs to."],
        ["description", "string", 0, "Notes about the call."],
        ["f_inbound", "int", 0, "1 inbound, 0 outbound."],
        ["contact_title", "string", 0, "Who the call was with."],
        ["assigned_to_id", "string", 0, "User who owns the call."],
        ["due_date", "string", 0, "When it happened or is scheduled."],
        ["duration", "int", 0, "Call length in minutes."]
      ]),
      t("fc_edit_crm_call", "Update a logged call.", [
        ["crm_call_id", "string", 1, "ID of the call to edit."],
        ["title", "string", 0, "New title."],
        ["description", "string", 0, "New notes."],
        ["f_inbound", "int", 0, "1 inbound, 0 outbound."],
        ["contact_title", "string", 0, "Contact name."],
        ["assigned_to_id", "string", 0, "Owner."],
        ["due_date", "string", 0, "New call date."],
        ["duration", "int", 0, "New duration in minutes."]
      ]),
      t("fc_delete_crm_call", "Delete a logged call.", [["crm_call_id", "string", 1, "ID of the call to delete."]])
    ]),

  g("Users & account", "tools-users",
    "Who is who, plus account-level operations. Several of these are irreversible — check the badges.", [
      t("fc_fetch_users", "Every user you share a workspace with. Use it to resolve assigned_to_id.", []),
      t("fc_fetch_current_user", "The authenticated user.", []),
      t("fc_fetch_user", "A user by ID.", [["user_id", "string", 1, "ID of the user."]]),
      t("fc_fetch_groups", "All groups, without their projects or apps. Prefer fc_get_groups_projects.", []),
      t("fc_update_current_user", "Update your own profile. Changing email or password needs current_password.", [
        ["first_name", "string", 0, "New first name."],
        ["last_name", "string", 0, "New last name."],
        ["email", "string", 0, "New email address."],
        ["timezone", "string", 0, "IANA timezone, e.g. America/Los_Angeles."],
        ["password", "string", 0, "New password. Requires current_password."],
        ["current_password", "string", 0, "Required when changing password or email."]
      ]),
      t("fc_register_user", "Register a new Freedcamp account.", [
        ["email", "string", 1, "Email for the new account."],
        ["password", "string", 1, "Password for the new account."],
        ["first_name", "string", 1, "First name."],
        ["last_name", "string", 1, "Last name."],
        ["timezone", "string", 0, "IANA timezone name."]
      ]),
      t("fc_validate_email", "Check whether an email address is valid and available.", [["email", "string", 1, "Address to check."]]),
      t("fc_request_password_reset", "Send a password reset email.", [["email", "string", 1, "Address to send the link to."]]),
      t("fc_apply_password_reset", "Complete a password reset with the key from the email.", [
        ["reset_key", "string", 1, "Token from the reset email."],
        ["password", "string", 1, "New password to set."]
      ]),
      t("fc_delete_avatar", "Remove your current avatar image.", []),
      t("fc_delete_account", "Delete the whole account. Requires your password and is not reversible.", [
        ["password", "string", 1, "Your current password."],
        ["confirm", "string", 0, "Confirmation value required by the API."]
      ])
    ]),

  g("Notifications", "tools-notifications",
    "Read your activity feed and mark things read, one at a time or in bulk.", [
      t("fc_fetch_notifications", "Recent notifications — last 60 days, things you follow.", []),
      t("fc_fetch_all_notifications", "Every notification, with no date or following filter.", []),
      t("fc_fetch_notifications_by_project", "Notifications for one project.", [["project_id", "string", 1, "Project whose notifications to fetch."]]),
      t("fc_update_notification_read", "Mark a single notification read.", [["uid", "string", 0, "The notification's item_u_key."]]),
      t("fc_edit_notifications", "Bulk update notification state.", [
        ["items", "object[]", 1, "Notifications to update, each carrying an item_u_key."],
        ["new_state", "string", 0, "read or unread. Default read."]
      ])
    ]),

  g("Files", "tools-files",
    "Upload from a path or base64, attach to any item or comment, or stage a temporary record and attach it later via attached_ids.", [
      t("fc_fetch_file", "File metadata by ID.", [["file_id", "string", 1, "ID of the file."]]),
      t("fc_upload_file", "Upload a file and attach it to a project, item or comment. Send file_path or content_base64.", [
        ["file_path", "string", 0, "Absolute path to a local file. This or content_base64."],
        ["content_base64", "string", 0, "Base64 file contents. This or file_path."],
        ["filename", "string", 0, "Name to give the upload."],
        ["mime_type", "string", 0, "MIME type. Defaults to application/octet-stream."],
        ["project_id", "string", 0, "Project the file belongs to."],
        ["group_id", "string", 0, "Group the file belongs to."],
        ["application_id", "int", 0, "App to attach it to, e.g. 2 Tasks."],
        ["item_id", "string", 0, "Item to attach it to."],
        ["comment_id", "string", 0, "Comment to attach it to."],
        ["temporary", "int", 0, "1 uploads it as temporary; attach later via attached_ids."]
      ]),
      t("fc_add_file_meta", "Create a metadata record for a file uploaded elsewhere.", [
        ["project_id", "string", 0, "Project the file belongs to."],
        ["group_id", "string", 0, "Group the file belongs to."],
        ["application_id", "int", 0, "App the file is attached to."],
        ["item_id", "string", 0, "Item to attach it to."],
        ["comment_id", "string", 0, "Comment to attach it to."],
        ["temporary", "int", 0, "1 creates a temporary record."]
      ]),
      t("fc_upload_avatar", "Upload a new avatar for the current user.", [
        ["file_path", "string", 0, "Absolute path to the image. This or content_base64."],
        ["content_base64", "string", 0, "Base64 image contents. This or file_path."],
        ["filename", "string", 0, "Name to give the upload."],
        ["mime_type", "string", 0, "MIME type, e.g. image/png."]
      ]),
      t("fc_delete_file", "Delete a file.", [["file_id", "string", 1, "ID of the file to delete."]])
    ]),

  g("Custom fields & links", "tools-custom",
    "Define custom field templates for Tasks, the Issue Tracker or CRM, and cross-link items between apps.", [
      t("fc_fetch_cf_templates", "List custom field templates, with each field's cf_id.", [["module_id", "int", 0, "App to list templates for. Default 2 (Tasks)."]]),
      t("fc_add_cf_template", "Create a custom field template — a named set of fields.", [
        ["title", "string", 1, "Name of the template."],
        ["module_id", "int", 1, "2 Tasks, 13 Issue Tracker, 37 CRM."],
        ["fields", "object[]", 1, "Fields to create: { title, type, f_required, cf_order, currency_code, dd_options }."],
        ["owner_id", "string", 0, "Owner user ID. Defaults to you."]
      ], '{\n  "name": "fc_add_cf_template",\n  "arguments": {\n    "title": "Engineering fields",\n    "module_id": 2,\n    "fields": [\n      { "title": "Team", "type": "dd", "f_required": true,\n        "dd_options": [{ "title": "Backend", "f_default": true }, { "title": "Frontend" }] },\n      { "title": "Est. cost", "type": "currency", "currency_code": "USD" }\n    ]\n  }\n}'),
      t("fc_edit_cf_template", "Rename a template, replace its fields, remove fields, or archive it.", [
        ["cft_id", "string", 1, "ID of the template to edit."],
        ["title", "string", 1, "New template name."],
        ["module_id", "int", 1, "2 Tasks, 13 Issue Tracker, 37 CRM."],
        ["fields", "object[]", 1, "Full replacement set of fields."],
        ["owner_id", "string", 0, "Owner user ID."],
        ["deleted_field_ids", "int[]", 0, "Existing field IDs to remove."],
        ["f_archived", "boolean", 0, "Whether the template is archived."]
      ]),
      t("fc_fetch_linked_items", "Items linked to a given item.", [
        ["app_id", "int", 1, "App that owns the item, e.g. 2 Tasks."],
        ["item_id", "string", 1, "Item whose links to fetch."]
      ]),
      t("fc_add_linked_items", "Link an item to items in any app.", [
        ["app_id", "int", 1, "App that owns the source item."],
        ["item_id", "string", 1, "Source item to link from."],
        ["links", "object", 1, "Map of target app ID (string key) to an array of item IDs."]
      ], '{\n  "name": "fc_add_linked_items",\n  "arguments": {\n    "app_id": 2,\n    "item_id": "18432901",\n    "links": { "13": ["5511207"], "4": ["3308115"] }\n  }\n}')
    ]),

  g("Account & misc", "tools-misc",
    "Invitations, timezones, backups and account state. Small tools, occasionally exactly what you need.", [
      t("fc_fetch_invitations", "Pending invitations addressed to you.", []),
      t("fc_respond_invitation", "Accept or decline an invitation.", [
        ["invitation_id", "string", 1, "ID of the invitation."],
        ["action", "string", 0, "accept or decline."],
        ["response", "string", 0, "Extra response value some invitation types need."],
        ["project_id", "string", 0, "Project the invitation is for, if applicable."]
      ]),
      t("fc_fetch_timezones", "Every timezone the API accepts — useful before setting one on a profile.", []),
      t("fc_fetch_backups", "Account backups available for download.", []),
      t("fc_fetch_wipe_current", "Current account-wipe state.", [])
    ])
];

const CLIENTS = [
  { id: "claude-desktop", label: "Claude Desktop" },
  { id: "claude-code", label: "Claude Code" },
  { id: "cursor", label: "Cursor" },
  { id: "codex", label: "Codex CLI" },
  { id: "cline", label: "Cline" },
  { id: "vscode", label: "VS Code" }
];

const ENV_VARS = [
  { name: "FREEDCAMP_API_KEY", def: "—", note: "Your API key. Required in stdio mode, ignored in http mode." },
  { name: "FREEDCAMP_API_SECRET", def: "—", note: "Your API secret. Required in stdio mode, ignored in http mode." },
  { name: "MCP_TRANSPORT", def: "stdio", note: "Set to http to run the multi-user HTTP + OAuth server." },
  { name: "PORT", def: "3000", note: "Port the HTTP server listens on." },
  { name: "HOST", def: "127.0.0.1", note: "Interface to bind. Use 0.0.0.0 behind a proxy." },
  { name: "MCP_PUBLIC_URL", def: "http://host:port", note: "Public base URL advertised in OAuth metadata. Set your external HTTPS URL in production." },
  { name: "OAUTH_TOKEN_SECRET", def: "random per boot", note: "Encrypts bearer tokens. Set a stable random value so tokens survive restarts." }
];

const RECIPES = [
  { label: "TRIAGE", ask: "What is overdue across all my projects, grouped by project, with who it is assigned to?", tools: "fc_get_groups_projects → fc_fetch_tasks → fc_fetch_users" },
  { label: "CAPTURE", ask: "Turn these meeting notes into tasks in the API Platform project, due next Friday, assigned to me.", tools: "fc_get_groups_projects → fc_fetch_lists → fc_add_task" },
  { label: "SWEEP", ask: "Mark every task in the Release 4.1 list completed and move the leftovers to Release 4.2.", tools: "fc_fetch_tasks → fc_batch_edit_tasks" },
  { label: "TIME", ask: "Log 45 minutes against today on the Acme refactor and mark it billed.", tools: "fc_add_time or fc_time_action" },
  { label: "STANDUP", ask: "Summarise what changed in the API Platform project since Monday and post it as a discussion.", tools: "fc_fetch_notifications_by_project → fc_add_discussion" },
  { label: "PLANNING", ask: "Create a Q4 Launch milestone and link the six auth tasks to it.", tools: "fc_add_milestone → fc_batch_edit_tasks (ms_id)" },
  { label: "WRITE-UP", ask: "Draft a wiki page from this thread and file it under Engineering Notes.", tools: "fc_fetch_discussion → fc_add_wiki" },
  { label: "CRM", ask: "Log a 20-minute inbound call with Acme Corp and schedule a follow-up for Thursday.", tools: "fc_add_crm_call → fc_add_crm_task" }
];

const ERRORS = [
  { msg: 'Invalid input for fc_add_task: project_id: Required', fix: "Zod rejected the arguments before any request was made. The message names the exact field path and what was wrong — usually a missing required ID. Fetch it with fc_get_groups_projects and retry." },
  { msg: 'HTTP 401 — invalid_token', fix: "Your bearer token expired or was rejected. Re-run the authorization flow: in Claude Desktop reconnect the connector under Settings → Connectors, in Claude Code run /mcp and choose Authenticate." },
  { msg: 'Invalid Freedcamp API credentials', fix: "The authorization page checked your key and secret against the Freedcamp API and they did not match. Generate a fresh pair under Settings → API — the secret is only shown once, so a half-copied secret is the usual cause." },
  { msg: 'No project found named "API platform"', fix: "A name-based helper could not match that project. Names are matched exactly, including case — call fc_get_groups_projects and use the name it returns." },
  { msg: 'fc_add_item_by_names does not yet support the "Discussions" app', fix: "The by-name shortcut currently creates Tasks only. Use the app's own tool — fc_add_discussion, fc_add_issue, fc_add_wiki — with the project_id from fc_get_groups_projects." },
  { msg: 'isError: true — timer state unchanged', fix: "fc_time_action compares the entry before and after. Starting an already-running timer, or billing an already-billed entry, is reported as a failure with the entry state attached instead of a false success." },
  { msg: 'Unknown tool: fc_list_tasks', fix: "That name does not exist. Listing is fc_fetch_tasks — every read tool is fc_fetch_*. If your client shows stale tools, reconnect the server." }
];

const FAQ = [
  { q: "Do I have to install or host anything?", a: "No. Point your client at https://mcp.freedcamp.com/mcp and authorize with your own Freedcamp API key and secret in the browser. There is nothing to download and nothing to keep running." },
  { q: "Can my whole team use it?", a: "Yes — everyone points at the same endpoint and completes their own OAuth authorization with their own Freedcamp credentials. Each bearer token gets its own isolated handler, so sessions never mix." },
  { q: "Can the AI see projects I do not have access to?", a: "No. Every call is signed with your own API credentials, so the server can only ever see and change what you can see and change in Freedcamp." },
  { q: "Why does it keep telling me to call fc_get_groups_projects?", a: "Because almost every other tool needs a project_id, list_id or user_id, and that one call returns all of them keyed by readable name. The server's own instructions tell clients to fetch it once and reuse it." },
  { q: "How do I create a subtask?", a: "Call fc_add_task with h_parent_id set to the parent task. The parent must live in the same list and cannot itself be a subtask." },
  { q: "What is the difference between list_id and task_group_id?", a: "They are the same field. list_id is the current name, task_group_id is the legacy alias — send one, not both." },
  { q: "Can I change many tasks at once?", a: "fc_batch_edit_tasks takes up to 500 task IDs and applies the same status, priority, assignees, dates, tags, custom fields, milestone or parent to all of them in one request." },
  { q: "Is there a local or stdio version?", a: "Not at the moment — OAuth over the hosted HTTPS endpoint is the only supported transport, which is why there are no environment variables or npx commands anywhere in this guide." }
];

class Component extends DCLogic {
  state = { query: "", client: "claude-desktop", theme: "light", step: 1 };

  goStep = (e) => {
    const n = parseInt(e.currentTarget.getAttribute("data-step"), 10);
    if (n) this.setState({ step: n });
  };
  nextStep = () => this.setState((s) => ({ step: s.step >= 6 ? 1 : s.step + 1 }));
  prevStep = () => this.setState((s) => ({ step: s.step <= 1 ? 6 : s.step - 1 }));

  syncSteps = () => {
    const cur = this.state.step;
    document.querySelectorAll("[data-step]").forEach((btn) => {
      const on = parseInt(btn.getAttribute("data-step"), 10) === cur;
      btn.style.background = on ? "var(--color-primary-tint)" : "transparent";
      btn.style.boxShadow = on ? "inset 2px 0 0 0 var(--color-primary)" : "none";
    });
    document.querySelectorAll("[data-step-num]").forEach((el) => {
      const on = parseInt(el.getAttribute("data-step-num"), 10) === cur;
      el.style.background = on ? "var(--color-primary)" : "var(--surface-sunken)";
      el.style.color = on ? "#fff" : "var(--text-secondary)";
    });
  };

  syncSpy = () => {
    const links = document.querySelectorAll('aside nav a[href^="#"]');
    if (!links.length) return;
    let active = null;
    let bestTop = -Infinity;
    links.forEach((a) => {
      const el = document.getElementById(a.getAttribute("href").slice(1));
      if (!el) return;
      const top = el.getBoundingClientRect().top - 120;
      if (top <= 0 && top > bestTop) { bestTop = top; active = a; }
    });
    if (!active) active = links[0];
    links.forEach((a) => {
      const on = a === active;
      const bold = a.getAttribute("href") === "#tools";
      a.style.background = on ? "var(--color-primary-tint)" : "transparent";
      a.style.color = on ? "var(--color-primary)" : (bold ? "var(--text-primary)" : "var(--text-secondary)");
      a.style.fontWeight = on || bold ? "600" : "500";
      a.style.boxShadow = on ? "inset 2px 0 0 0 var(--color-primary)" : "none";
    });
  };

  componentDidUpdate() { this.syncSpy(); this.syncSteps(); }

  componentWillUnmount() {
    window.removeEventListener("scroll", this.syncSpy);
  }

  componentDidMount() {
    window.addEventListener("scroll", this.syncSpy, { passive: true });
    window.setTimeout(this.syncSpy, 60);
    window.setTimeout(this.syncSteps, 60);
    let saved = null;
    try { saved = window.localStorage.getItem("fcmcp-theme"); } catch (e) { saved = null; }
    const initial = saved || this.props.defaultTheme || "light";
    this.setState({ theme: initial });
    this.applyTheme(initial);
  }

  applyTheme(theme) {
    const root = document.documentElement;
    Object.keys(DARK).forEach((k) => {
      if (theme === "dark") root.style.setProperty(k, DARK[k]);
      else root.style.removeProperty(k);
    });
    root.style.colorScheme = theme === "dark" ? "dark" : "light";
  }

  onTheme = (next) => {
    this.setState({ theme: next });
    this.applyTheme(next);
    try { window.localStorage.setItem("fcmcp-theme", next); } catch (e) { /* ignore */ }
  };

  onSearch = (e) => this.setState({ query: e.target.value });
  onClearSearch = () => this.setState({ query: "" });
  onClient = (id) => this.setState({ client: id });

  copy = (e) => {
    const btn = e.currentTarget;
    const pre = btn.parentElement && btn.parentElement.querySelector("pre");
    if (!pre) return;
    const text = pre.innerText;
    const done = () => {
      btn.textContent = "Copied";
      window.setTimeout(() => { btn.textContent = "Copy"; }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, done);
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (err) { /* ignore */ }
      document.body.removeChild(ta);
      done();
    }
  };

  copyAsk = (e) => {
    const btn = e.currentTarget;
    const card = btn.closest("[data-recipe]");
    const p = card && card.querySelector("p");
    if (!p) return;
    const text = p.innerText;
    const done = () => {
      btn.textContent = "Copied";
      window.setTimeout(() => { btn.textContent = "Copy"; }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, done);
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (err) { /* ignore */ }
      document.body.removeChild(ta);
      done();
    }
  };

  decorate(tool) {
    const name = tool.name;
    const readOnly = /^fc_(fetch|validate|get)_/.test(name);
    const destructive = /^fc_delete_/.test(name) || name === "fc_leave_project";
    const params = tool.rawParams.map((p) => ({
      name: p[0],
      type: p[2] ? p[1] + " · required" : p[1],
      note: p[3]
    }));
    let example = tool.exampleOverride;
    if (!example) {
      const args = {};
      tool.rawParams.forEach((p) => {
        if (!p[2]) return;
        const key = p[0].indexOf(".") > -1 ? p[0].split(".")[0] : p[0];
        args[key] = sampleFor(key, p[1]);
      });
      example = JSON.stringify({ name: name, arguments: args }, null, 2);
    }
    return {
      name: name,
      desc: tool.desc,
      params: params,
      hasParams: params.length > 0,
      noParams: params.length === 0,
      example: example,
      badge: destructive ? "Destructive" : readOnly ? "Read-only" : "Writes",
      tone: destructive ? "danger" : readOnly ? "info" : "success"
    };
  }

  renderVals() {
    const q = this.state.query.trim().toLowerCase();
    const groups = [];
    let total = 0;

    CATALOG.forEach((grp) => {
      const kept = [];
      grp.tools.forEach((tool) => {
        if (q) {
          const hay = (tool.name + " " + tool.desc + " " + tool.rawParams.map((p) => p[0] + " " + p[3]).join(" ")).toLowerCase();
          if (hay.indexOf(q) === -1) return;
        }
        kept.push(this.decorate(tool));
      });
      total += kept.length;
      if (kept.length) {
        groups.push({
          name: grp.name,
          anchor: grp.anchor,
          blurb: grp.blurb,
          countLabel: kept.length === 1 ? "1 tool" : kept.length + " tools",
          tools: kept
        });
      }
    });

    const navGroups = CATALOG.map((grp) => ({
      name: grp.name,
      href: "#" + grp.anchor,
      count: grp.tools.length
    }));

    const c = this.state.client;
    return {
      groups: groups,
      navGroups: navGroups,
      noResults: groups.length === 0,
      resultLabel: q ? total + (total === 1 ? " tool" : " tools") + " matching" : "102 tools",
      query: this.state.query,
      onSearch: this.onSearch,
      onClearSearch: this.onClearSearch,
      theme: this.state.theme,
      onTheme: this.onTheme,
      copy: this.copy,
      copyAsk: this.copyAsk,
      goStep: this.goStep,
      nextStep: this.nextStep,
      prevStep: this.prevStep,
      stepLabel: "Step " + this.state.step + " of 6",
      showStep1: this.state.step === 1 ? "flex" : "none",
      showStep2: this.state.step === 2 ? "flex" : "none",
      showStep3: this.state.step === 3 ? "flex" : "none",
      showStep4: this.state.step === 4 ? "flex" : "none",
      showStep5: this.state.step === 5 ? "flex" : "none",
      showStep6: this.state.step === 6 ? "flex" : "none",
      client: c,
      clientOptions: CLIENTS,
      onClient: this.onClient,
      showClaudeDesktop: c === "claude-desktop" ? "flex" : "none",
      showClaudeCode: c === "claude-code" ? "flex" : "none",
      showCursor: c === "cursor" ? "flex" : "none",
      showCodex: c === "codex" ? "flex" : "none",
      showCline: c === "cline" ? "flex" : "none",
      showVscode: c === "vscode" ? "flex" : "none",
      recipes: RECIPES,
      errors: ERRORS,
      faq: FAQ,
      showExamples: this.props.showExamples !== false,
      showAnnotations: this.props.showAnnotations !== false
    };
  }
}
