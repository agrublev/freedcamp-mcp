#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import FreedcampHandler from "./operations/fc-handler.js";
import { VERSION } from "./common/version.js";

const apiKey = process.env.FREEDCAMP_API_KEY;
const apiSecret = process.env.FREEDCAMP_API_SECRET;

if (!apiKey || !apiSecret) {
  console.error("FREEDCAMP_API_KEY and FREEDCAMP_API_SECRET must be set");
  process.exit(1);
}

const fc = new FreedcampHandler(apiKey, apiSecret, undefined, { sessionFilePath: null });
await fc.initialize();

// ── Shared primitives ──────────────────────────────────────────────────────

const Opt = (schema) => schema.optional().nullable();

const PaginationSchema = z.object({
  limit: Opt(z.number().int().positive()),
  offset: Opt(z.number().int().nonnegative()),
});

const ProjectIdSchema = z.object({ project_id: z.string() });

// ── Schemas ────────────────────────────────────────────────────────────────

// Tasks
const FetchTaskSchema = z.object({ task_id: z.string() });

const FetchTasksSchema = PaginationSchema.extend({
  project_id: Opt(z.string()),
  filters: Opt(z.object({
    status: Opt(z.array(z.enum(["STATUS_NOT_STARTED","STATUS_COMPLETED","STATUS_IN_PROGRESS","STATUS_INVALID","STATUS_REVIEW"]))),
    assigned_to_id: Opt(z.array(z.string())),
    created_by_id: Opt(z.string()),
    due_date_from: Opt(z.string()),
    due_date_to: Opt(z.string()),
    created_date_from: Opt(z.string()),
    created_date_to: Opt(z.string()),
    f_with_archived: Opt(z.number().int()),
    list_status: Opt(z.string()),
    order_due_date: Opt(z.string()),
  })),
});

const AddTaskSchema = z.object({
  title: z.string(),
  description: Opt(z.string()),
  project_id: z.string(),
  task_group_id: Opt(z.string()),
  priority: Opt(z.number().int()),
  assigned_to_id: Opt(z.string()),
  due_date: Opt(z.string()),
  status: Opt(z.number().int()),
  completed_date: Opt(z.string()),
  attached_ids: Opt(z.array(z.string())),
});

const UpdateTaskSchema = z.object({
  task_id: z.string(),
  title: Opt(z.string()),
  description: Opt(z.string()),
  task_group_id: Opt(z.string()),
  status: Opt(z.number().int()),
  priority: Opt(z.number().int()),
  assigned_to_id: Opt(z.string()),
  due_date: Opt(z.string()),
});

const DeleteTaskSchema = z.object({ task_id: z.string() });

// Lists
const FetchListsSchema = z.object({
  project_id: z.string(),
  app_id: Opt(z.number().int()),
});

const AddListSchema = z.object({
  app_id: Opt(z.number().int()),
  project_id: z.string(),
  title: z.string(),
  description: Opt(z.string()),
});

const EditListSchema = z.object({
  app_id: Opt(z.number().int()),
  list_id: z.string(),
  title: z.string(),
  description: Opt(z.string()),
});

const DeleteListSchema = z.object({ app_id: Opt(z.number().int()), list_id: z.string() });

// Comments
const AddCommentSchema = z.object({
  item_id: z.string(),
  app_id: z.number().int(),
  description: z.string(),
  attached_ids: Opt(z.array(z.string())),
});

const EditCommentSchema = z.object({ comment_id: z.string(), description: z.string() });
const DeleteCommentSchema = z.object({ comment_id: z.string() });

// Calendar Events
const FetchEventsSchema = z.object({ project_id: Opt(z.string()) });
const FetchEventSchema = z.object({ event_id: z.string() });

const AddEventSchema = z.object({
  project_id: z.string(),
  title: z.string(),
  description: Opt(z.string()),
  f_all_day: Opt(z.number().int()),
  start_date: z.string(),
  start_time: Opt(z.string()),
  end_date: Opt(z.string()),
  end_time: Opt(z.string()),
  r_rule: Opt(z.string()),
  f_response_notify: Opt(z.number().int()),
  mixed_users: Opt(z.array(z.string())),
  attached_ids: Opt(z.array(z.string())),
});

const EditEventSchema = z.object({
  event_id: z.string(),
  title: Opt(z.string()),
  description: Opt(z.string()),
  f_all_day: Opt(z.number().int()),
  start_date: Opt(z.string()),
  start_time: Opt(z.string()),
  end_date: Opt(z.string()),
  end_time: Opt(z.string()),
  r_rule: Opt(z.string()),
  attached_ids: Opt(z.array(z.string())),
});

const DeleteEventSchema = z.object({ event_id: z.string() });

// Discussions
const FetchDiscussionsSchema = PaginationSchema.extend({ project_id: z.string() });
const FetchDiscussionSchema = z.object({ discussion_id: z.string() });

const AddDiscussionSchema = z.object({
  title: z.string(),
  description: Opt(z.string()),
  project_id: z.string(),
  list_id: Opt(z.string()),
  list_title: Opt(z.string()),
  list_descr: Opt(z.string()),
  f_sticky: Opt(z.number().int()),
  f_private: Opt(z.number().int()),
  private_users: Opt(z.array(z.string())),
  notifications: Opt(z.array(z.string())),
  attached_ids: Opt(z.array(z.string())),
});

const EditDiscussionSchema = z.object({
  discussion_id: z.string(),
  title: Opt(z.string()),
  list_id: Opt(z.string()),
  list_title: Opt(z.string()),
  list_descr: Opt(z.string()),
  f_sticky: Opt(z.number().int()),
});

const DeleteDiscussionSchema = z.object({ discussion_id: z.string() });

// Issues
const FetchIssuesSchema = PaginationSchema.extend({ project_id: z.string() });
const FetchIssueSchema = z.object({ issue_id: z.string() });

const AddIssueSchema = z.object({
  title: z.string(),
  description: Opt(z.string()),
  project_id: z.string(),
  priority: Opt(z.number().int()),
  status: Opt(z.number().int()),
  type: Opt(z.number().int()),
  assigned_to_id: Opt(z.string()),
  due_date: Opt(z.string()),
  closer_id: Opt(z.string()),
  attached_ids: Opt(z.array(z.string())),
});

const EditIssueSchema = z.object({
  issue_id: z.string(),
  title: Opt(z.string()),
  description: Opt(z.string()),
  priority: Opt(z.number().int()),
  status: Opt(z.number().int()),
  type: Opt(z.number().int()),
  assigned_to_id: Opt(z.string()),
  due_date: Opt(z.string()),
  closer_id: Opt(z.string()),
  attached_ids: Opt(z.array(z.string())),
});

const DeleteIssueSchema = z.object({ issue_id: z.string() });

// Milestones
const FetchMilestonesSchema = PaginationSchema.extend({ project_id: z.string() });
const FetchMilestoneSchema = z.object({ milestone_id: z.string() });

const AddMilestoneSchema = z.object({
  title: z.string(),
  description: Opt(z.string()),
  project_id: z.string(),
  priority: Opt(z.number().int()),
  assigned_to_id: Opt(z.string()),
  due_date: Opt(z.string()),
  status: Opt(z.number().int()),
  start_date: Opt(z.string()),
});

const EditMilestoneSchema = z.object({
  milestone_id: z.string(),
  title: Opt(z.string()),
  description: Opt(z.string()),
  priority: Opt(z.number().int()),
  status: Opt(z.number().int()),
  assigned_to_id: Opt(z.string()),
  due_date: Opt(z.string()),
  start_date: Opt(z.string()),
});

const DeleteMilestoneSchema = z.object({ milestone_id: z.string() });

// Times
const FetchTimesSchema = PaginationSchema.extend({ project_id: z.string() });
const FetchTimeSchema = z.object({ time_id: z.string() });

const AddTimeSchema = z.object({
  description: Opt(z.string()),
  project_id: z.string(),
  assigned_to_id: Opt(z.string()),
  date: z.string(),
  minutes_count: z.number().int(),
  f_started: Opt(z.number().int()),
  f_billed: Opt(z.number().int()),
});

const EditTimeSchema = z.object({
  time_id: z.string(),
  description: Opt(z.string()),
  assigned_to_id: Opt(z.string()),
  date: Opt(z.string()),
  minutes_count: Opt(z.number().int()),
});

const DeleteTimeSchema = z.object({ time_id: z.string() });
const TimeActionSchema = z.object({ time_id: z.string(), action: z.enum(["start","stop","bill","unbill"]) });

// Wikis
const FetchWikisSchema = PaginationSchema.extend({ project_id: z.string(), order_title: Opt(z.string()) });
const FetchWikiSchema = z.object({ wiki_id: z.string() });

const AddWikiSchema = z.object({
  title: z.string(),
  description: Opt(z.string()),
  project_id: z.string(),
  list_id: Opt(z.string()),
  list_title: Opt(z.string()),
  list_descr: Opt(z.string()),
  f_private: Opt(z.number().int()),
  f_public: Opt(z.number().int()),
  private_users: Opt(z.array(z.string())),
  attached_ids: Opt(z.array(z.string())),
});

const EditWikiSchema = z.object({
  wiki_id: z.string(),
  title: Opt(z.string()),
  description: Opt(z.string()),
  list_id: Opt(z.string()),
  list_title: Opt(z.string()),
  list_descr: Opt(z.string()),
  f_private: Opt(z.number().int()),
  f_public: Opt(z.number().int()),
  private_users: Opt(z.array(z.string())),
  attached_ids: Opt(z.array(z.string())),
  f_new_version: Opt(z.boolean()),
});

const DeleteWikiSchema = z.object({ wiki_id: z.string() });

const AddWikiVersionSchema = z.object({
  wiki_id: z.string(),
  title: Opt(z.string()),
  description: Opt(z.string()),
  attached_ids: Opt(z.array(z.string())),
});

// Projects
const FetchProjectSchema = z.object({ project_id: z.string() });

const AddProjectSchema = z.object({
  project_name: z.string(),
  project_description: Opt(z.string()),
  project_color: Opt(z.string()),
  todo_view_type: Opt(z.string()),
  usage_type: Opt(z.number().int()),
  group_id: Opt(z.string()),
  group_name: Opt(z.string()),
});

const EditProjectSchema = z.object({
  project_id: z.string(),
  project_name: Opt(z.string()),
  project_color: Opt(z.string()),
  group_id: Opt(z.string()),
  cs_tpl_id: Opt(z.string()),
});

const LeaveProjectSchema = z.object({ membership_id: z.string() });
const DeleteProjectSchema = z.object({ project_id: z.string() });

// CRM Tasks
const FetchCrmTasksSchema = PaginationSchema.extend({ group_id: z.string() });
const FetchCrmTaskSchema = z.object({ crm_task_id: z.string() });

const AddCrmTaskSchema = z.object({
  title: z.string(),
  description: Opt(z.string()),
  group_id: z.string(),
  type: Opt(z.number().int()),
  contact_title: Opt(z.string()),
  f_private: Opt(z.number().int()),
  assigned_to_id: Opt(z.string()),
  due_date: Opt(z.string()),
});

const EditCrmTaskSchema = z.object({
  crm_task_id: z.string(),
  title: Opt(z.string()),
  description: Opt(z.string()),
  status: Opt(z.number().int()),
  type: Opt(z.number().int()),
  contact_title: Opt(z.string()),
  f_private: Opt(z.number().int()),
  assigned_to_id: Opt(z.string()),
  due_date: Opt(z.string()),
});

const DeleteCrmTaskSchema = z.object({ crm_task_id: z.string() });

// CRM Calls
const FetchCrmCallsSchema = PaginationSchema.extend({ group_id: z.string() });
const FetchCrmCallSchema = z.object({ crm_call_id: z.string() });

const AddCrmCallSchema = z.object({
  title: z.string(),
  description: Opt(z.string()),
  group_id: z.string(),
  f_inbound: Opt(z.number().int()),
  contact_title: Opt(z.string()),
  assigned_to_id: Opt(z.string()),
  due_date: Opt(z.string()),
  duration: Opt(z.number().int()),
});

const EditCrmCallSchema = z.object({
  crm_call_id: z.string(),
  title: Opt(z.string()),
  description: Opt(z.string()),
  f_inbound: Opt(z.number().int()),
  contact_title: Opt(z.string()),
  assigned_to_id: Opt(z.string()),
  due_date: Opt(z.string()),
  duration: Opt(z.number().int()),
});

const DeleteCrmCallSchema = z.object({ crm_call_id: z.string() });

// Misc
const FetchLinkedItemsSchema = z.object({ app_id: z.number().int(), item_id: z.string() });
const AddLinkedItemsSchema = z.object({ app_id: z.number().int(), item_id: z.string(), links: z.record(z.array(z.string())) });
const FetchOverviewSchema = z.object({ project_id: z.string() });
const FetchUserSchema = z.object({ user_id: z.string() });
const FetchCfTemplatesSchema = z.object({ module_id: Opt(z.number().int()) });
const FetchNotificationsByProjectSchema = z.object({ project_id: z.string() });
const ValidateEmailSchema = z.object({ email: z.string().email() });
const RespondInvitationSchema = z.object({
  invitation_id: z.string(),
  action: Opt(z.string()),
  response: Opt(z.string()),
  project_id: Opt(z.string()),
});
const UpdateNotificationReadSchema = z.object({ uid: Opt(z.string()) });
const EditNotificationsSchema = z.object({
  new_state: Opt(z.string()),
  items: z.array(z.record(z.string())),
});
const RegisterUserSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  timezone: Opt(z.string()),
});
const UpdateCurrentUserSchema = z.object({
  first_name: Opt(z.string()),
  last_name: Opt(z.string()),
  email: Opt(z.string().email()),
  timezone: Opt(z.string()),
  password: Opt(z.string()),
  current_password: Opt(z.string()),
});
const DeleteAccountSchema = z.object({ password: z.string(), confirm: Opt(z.string()) });
const RequestPasswordResetSchema = z.object({ email: z.string().email() });
const ApplyPasswordResetSchema = z.object({ reset_key: z.string(), password: z.string() });
const AddFavoriteProjectSchema = z.object({ project_id: z.string() });

// ── Tool registry ──────────────────────────────────────────────────────────

const tools = [
  // Tasks
  { name: "fc_fetch_task", description: "Get a single Freedcamp task by ID", schema: FetchTaskSchema },
  { name: "fc_fetch_tasks", description: "List Freedcamp tasks with optional filters", schema: FetchTasksSchema },
  { name: "fc_add_task", description: "Create a new Freedcamp task", schema: AddTaskSchema },
  { name: "fc_update_task", description: "Update an existing Freedcamp task", schema: UpdateTaskSchema },
  { name: "fc_delete_task", description: "Delete a Freedcamp task", schema: DeleteTaskSchema },
  // Lists
  { name: "fc_fetch_lists", description: "Get lists for a project", schema: FetchListsSchema },
  { name: "fc_add_list", description: "Create a new list", schema: AddListSchema },
  { name: "fc_edit_list", description: "Edit an existing list", schema: EditListSchema },
  { name: "fc_delete_list", description: "Delete a list", schema: DeleteListSchema },
  // Comments
  { name: "fc_add_comment", description: "Add a comment to a Freedcamp item", schema: AddCommentSchema },
  { name: "fc_edit_comment", description: "Edit a comment", schema: EditCommentSchema },
  { name: "fc_delete_comment", description: "Delete a comment", schema: DeleteCommentSchema },
  // Calendar Events
  { name: "fc_fetch_events", description: "List calendar events", schema: FetchEventsSchema },
  { name: "fc_fetch_event", description: "Get a single calendar event", schema: FetchEventSchema },
  { name: "fc_add_event", description: "Create a calendar event", schema: AddEventSchema },
  { name: "fc_edit_event", description: "Edit a calendar event", schema: EditEventSchema },
  { name: "fc_delete_event", description: "Delete a calendar event", schema: DeleteEventSchema },
  // Discussions
  { name: "fc_fetch_discussions", description: "List discussions in a project", schema: FetchDiscussionsSchema },
  { name: "fc_fetch_discussion", description: "Get a single discussion", schema: FetchDiscussionSchema },
  { name: "fc_add_discussion", description: "Create a discussion", schema: AddDiscussionSchema },
  { name: "fc_edit_discussion", description: "Edit a discussion", schema: EditDiscussionSchema },
  { name: "fc_delete_discussion", description: "Delete a discussion", schema: DeleteDiscussionSchema },
  // Issues
  { name: "fc_fetch_issues", description: "List issues in a project", schema: FetchIssuesSchema },
  { name: "fc_fetch_issue", description: "Get a single issue", schema: FetchIssueSchema },
  { name: "fc_add_issue", description: "Create an issue", schema: AddIssueSchema },
  { name: "fc_edit_issue", description: "Edit an issue", schema: EditIssueSchema },
  { name: "fc_delete_issue", description: "Delete an issue", schema: DeleteIssueSchema },
  // Milestones
  { name: "fc_fetch_milestones", description: "List milestones in a project", schema: FetchMilestonesSchema },
  { name: "fc_fetch_milestone", description: "Get a single milestone", schema: FetchMilestoneSchema },
  { name: "fc_add_milestone", description: "Create a milestone", schema: AddMilestoneSchema },
  { name: "fc_edit_milestone", description: "Edit a milestone", schema: EditMilestoneSchema },
  { name: "fc_delete_milestone", description: "Delete a milestone", schema: DeleteMilestoneSchema },
  // Times
  { name: "fc_fetch_times", description: "List time entries in a project", schema: FetchTimesSchema },
  { name: "fc_fetch_time", description: "Get a single time entry", schema: FetchTimeSchema },
  { name: "fc_add_time", description: "Create a time entry", schema: AddTimeSchema },
  { name: "fc_edit_time", description: "Edit a time entry", schema: EditTimeSchema },
  { name: "fc_delete_time", description: "Delete a time entry", schema: DeleteTimeSchema },
  { name: "fc_time_action", description: "Perform a time action (start/stop/bill/unbill)", schema: TimeActionSchema },
  // Wikis
  { name: "fc_fetch_wikis", description: "List wikis in a project", schema: FetchWikisSchema },
  { name: "fc_fetch_wiki", description: "Get a single wiki", schema: FetchWikiSchema },
  { name: "fc_add_wiki", description: "Create a wiki", schema: AddWikiSchema },
  { name: "fc_edit_wiki", description: "Edit a wiki", schema: EditWikiSchema },
  { name: "fc_delete_wiki", description: "Delete a wiki", schema: DeleteWikiSchema },
  { name: "fc_add_wiki_version", description: "Add a new version to a wiki", schema: AddWikiVersionSchema },
  // Projects
  { name: "fc_fetch_projects", description: "List all Freedcamp projects", schema: z.object({}) },
  { name: "fc_fetch_project", description: "Get a single project", schema: FetchProjectSchema },
  { name: "fc_fetch_recent_project_ids", description: "Get recently accessed project IDs", schema: z.object({}) },
  { name: "fc_add_project", description: "Create a new project", schema: AddProjectSchema },
  { name: "fc_edit_project", description: "Edit a project", schema: EditProjectSchema },
  { name: "fc_leave_project", description: "Leave a project", schema: LeaveProjectSchema },
  { name: "fc_delete_project", description: "Delete a project", schema: DeleteProjectSchema },
  // CRM Tasks
  { name: "fc_fetch_crm_tasks", description: "List CRM tasks for a group", schema: FetchCrmTasksSchema },
  { name: "fc_fetch_crm_task", description: "Get a single CRM task", schema: FetchCrmTaskSchema },
  { name: "fc_add_crm_task", description: "Create a CRM task", schema: AddCrmTaskSchema },
  { name: "fc_edit_crm_task", description: "Edit a CRM task", schema: EditCrmTaskSchema },
  { name: "fc_delete_crm_task", description: "Delete a CRM task", schema: DeleteCrmTaskSchema },
  // CRM Calls
  { name: "fc_fetch_crm_calls", description: "List CRM calls for a group", schema: FetchCrmCallsSchema },
  { name: "fc_fetch_crm_call", description: "Get a single CRM call", schema: FetchCrmCallSchema },
  { name: "fc_add_crm_call", description: "Create a CRM call", schema: AddCrmCallSchema },
  { name: "fc_edit_crm_call", description: "Edit a CRM call", schema: EditCrmCallSchema },
  { name: "fc_delete_crm_call", description: "Delete a CRM call", schema: DeleteCrmCallSchema },
  // Misc
  { name: "fc_fetch_groups", description: "List all groups", schema: z.object({}) },
  { name: "fc_fetch_users", description: "List all users", schema: z.object({}) },
  { name: "fc_fetch_current_user", description: "Get the current authenticated user", schema: z.object({}) },
  { name: "fc_fetch_user", description: "Get a user by ID", schema: FetchUserSchema },
  { name: "fc_update_current_user", description: "Update current user profile", schema: UpdateCurrentUserSchema },
  { name: "fc_register_user", description: "Register a new user", schema: RegisterUserSchema },
  { name: "fc_fetch_cf_templates", description: "List custom field templates", schema: FetchCfTemplatesSchema },
  { name: "fc_fetch_linked_items", description: "Get linked items for an item", schema: FetchLinkedItemsSchema },
  { name: "fc_add_linked_items", description: "Link items together", schema: AddLinkedItemsSchema },
  { name: "fc_fetch_overview", description: "Get project overview", schema: FetchOverviewSchema },
  { name: "fc_fetch_current_session", description: "Get the current session", schema: z.object({}) },
  { name: "fc_fetch_invitations", description: "List pending invitations", schema: z.object({}) },
  { name: "fc_respond_invitation", description: "Respond to an invitation", schema: RespondInvitationSchema },
  { name: "fc_fetch_notifications", description: "Get recent notifications", schema: z.object({}) },
  { name: "fc_fetch_notifications_by_project", description: "Get notifications for a project", schema: FetchNotificationsByProjectSchema },
  { name: "fc_update_notification_read", description: "Mark a notification as read", schema: UpdateNotificationReadSchema },
  { name: "fc_edit_notifications", description: "Bulk update notification state", schema: EditNotificationsSchema },
  { name: "fc_fetch_calendar_items", description: "List calendar items for a project", schema: z.object({ project_id: Opt(z.string()) }) },
  { name: "fc_add_favorite_project", description: "Add a project to favorites", schema: AddFavoriteProjectSchema },
  { name: "fc_delete_favorite_project", description: "Remove a project from favorites", schema: AddFavoriteProjectSchema },
  { name: "fc_validate_email", description: "Validate an email address", schema: ValidateEmailSchema },
  { name: "fc_fetch_timezones", description: "List available timezones", schema: z.object({}) },
  { name: "fc_fetch_backups", description: "List account backups", schema: z.object({}) },
  { name: "fc_fetch_wipe_current", description: "Get wipe current info", schema: z.object({}) },
  { name: "fc_delete_account", description: "Delete the current account", schema: DeleteAccountSchema },
  { name: "fc_request_password_reset", description: "Request a password reset email", schema: RequestPasswordResetSchema },
  { name: "fc_apply_password_reset", description: "Apply a password reset", schema: ApplyPasswordResetSchema },
  { name: "fc_delete_avatar", description: "Delete the current user avatar", schema: z.object({}) },
];

// ── Server setup ───────────────────────────────────────────────────────────

const server = new Server(
  { name: "freedcamp-mcp-server", version: VERSION },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: tools.map(({ name, description, schema }) => ({
    name,
    description,
    inputSchema: zodToJsonSchema(schema),
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const ok = (data) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  });

  try {
    switch (name) {
      // Tasks
      case "fc_fetch_task": return ok(await fc.fetchTask(FetchTaskSchema.parse(args)));
      case "fc_fetch_tasks": return ok(await fc.fetchTasks(FetchTasksSchema.parse(args)));
      case "fc_add_task": return ok(await fc.addTask(AddTaskSchema.parse(args)));
      case "fc_update_task": return ok(await fc.updateTask(UpdateTaskSchema.parse(args)));
      case "fc_delete_task": return ok(await fc.deleteTask(DeleteTaskSchema.parse(args)));

      // Lists
      case "fc_fetch_lists": return ok(await fc.fetchLists(FetchListsSchema.parse(args)));
      case "fc_add_list": return ok(await fc.addList(AddListSchema.parse(args)));
      case "fc_edit_list": return ok(await fc.editList(EditListSchema.parse(args)));
      case "fc_delete_list": return ok(await fc.deleteList(DeleteListSchema.parse(args)));

      // Comments
      case "fc_add_comment": return ok(await fc.addComment(AddCommentSchema.parse(args)));
      case "fc_edit_comment": return ok(await fc.editComment(EditCommentSchema.parse(args)));
      case "fc_delete_comment": return ok(await fc.deleteComment(DeleteCommentSchema.parse(args)));

      // Calendar Events
      case "fc_fetch_events": return ok(await fc.fetchEvents(FetchEventsSchema.parse(args)));
      case "fc_fetch_event": return ok(await fc.fetchEvent(FetchEventSchema.parse(args)));
      case "fc_add_event": return ok(await fc.addEvent(AddEventSchema.parse(args)));
      case "fc_edit_event": return ok(await fc.editEvent(EditEventSchema.parse(args)));
      case "fc_delete_event": return ok(await fc.deleteEvent(DeleteEventSchema.parse(args)));

      // Discussions
      case "fc_fetch_discussions": return ok(await fc.fetchDiscussions(FetchDiscussionsSchema.parse(args)));
      case "fc_fetch_discussion": return ok(await fc.fetchDiscussion(FetchDiscussionSchema.parse(args)));
      case "fc_add_discussion": return ok(await fc.addDiscussion(AddDiscussionSchema.parse(args)));
      case "fc_edit_discussion": return ok(await fc.editDiscussion(EditDiscussionSchema.parse(args)));
      case "fc_delete_discussion": return ok(await fc.deleteDiscussion(DeleteDiscussionSchema.parse(args)));

      // Issues
      case "fc_fetch_issues": return ok(await fc.fetchIssues(FetchIssuesSchema.parse(args)));
      case "fc_fetch_issue": return ok(await fc.fetchIssue(FetchIssueSchema.parse(args)));
      case "fc_add_issue": return ok(await fc.addIssue(AddIssueSchema.parse(args)));
      case "fc_edit_issue": return ok(await fc.editIssue(EditIssueSchema.parse(args)));
      case "fc_delete_issue": return ok(await fc.deleteIssue(DeleteIssueSchema.parse(args)));

      // Milestones
      case "fc_fetch_milestones": return ok(await fc.fetchMilestones(FetchMilestonesSchema.parse(args)));
      case "fc_fetch_milestone": return ok(await fc.fetchMilestone(FetchMilestoneSchema.parse(args)));
      case "fc_add_milestone": return ok(await fc.addMilestone(AddMilestoneSchema.parse(args)));
      case "fc_edit_milestone": return ok(await fc.editMilestone(EditMilestoneSchema.parse(args)));
      case "fc_delete_milestone": return ok(await fc.deleteMilestone(DeleteMilestoneSchema.parse(args)));

      // Times
      case "fc_fetch_times": return ok(await fc.fetchTimes(FetchTimesSchema.parse(args)));
      case "fc_fetch_time": return ok(await fc.fetchTime(FetchTimeSchema.parse(args)));
      case "fc_add_time": return ok(await fc.addTime(AddTimeSchema.parse(args)));
      case "fc_edit_time": return ok(await fc.editTime(EditTimeSchema.parse(args)));
      case "fc_delete_time": return ok(await fc.deleteTime(DeleteTimeSchema.parse(args)));
      case "fc_time_action": return ok(await fc.timeAction(TimeActionSchema.parse(args)));

      // Wikis
      case "fc_fetch_wikis": return ok(await fc.fetchWikis(FetchWikisSchema.parse(args)));
      case "fc_fetch_wiki": return ok(await fc.fetchWiki(FetchWikiSchema.parse(args)));
      case "fc_add_wiki": return ok(await fc.addWiki(AddWikiSchema.parse(args)));
      case "fc_edit_wiki": return ok(await fc.editWiki(EditWikiSchema.parse(args)));
      case "fc_delete_wiki": return ok(await fc.deleteWiki(DeleteWikiSchema.parse(args)));
      case "fc_add_wiki_version": return ok(await fc.addWikiVersion(AddWikiVersionSchema.parse(args)));

      // Projects
      case "fc_fetch_projects": return ok(await fc.fetchProjects());
      case "fc_fetch_project": return ok(await fc.fetchProject(FetchProjectSchema.parse(args)));
      case "fc_fetch_recent_project_ids": return ok(await fc.fetchRecentProjectIds());
      case "fc_add_project": return ok(await fc.addProject(AddProjectSchema.parse(args)));
      case "fc_edit_project": return ok(await fc.editProject(EditProjectSchema.parse(args)));
      case "fc_leave_project": return ok(await fc.leaveProject(LeaveProjectSchema.parse(args)));
      case "fc_delete_project": return ok(await fc.deleteProject(DeleteProjectSchema.parse(args)));

      // CRM Tasks
      case "fc_fetch_crm_tasks": return ok(await fc.fetchCrmTasks(FetchCrmTasksSchema.parse(args)));
      case "fc_fetch_crm_task": return ok(await fc.fetchCrmTask(FetchCrmTaskSchema.parse(args)));
      case "fc_add_crm_task": return ok(await fc.addCrmTask(AddCrmTaskSchema.parse(args)));
      case "fc_edit_crm_task": return ok(await fc.editCrmTask(EditCrmTaskSchema.parse(args)));
      case "fc_delete_crm_task": return ok(await fc.deleteCrmTask(DeleteCrmTaskSchema.parse(args)));

      // CRM Calls
      case "fc_fetch_crm_calls": return ok(await fc.fetchCrmCalls(FetchCrmCallsSchema.parse(args)));
      case "fc_fetch_crm_call": return ok(await fc.fetchCrmCall(FetchCrmCallSchema.parse(args)));
      case "fc_add_crm_call": return ok(await fc.addCrmCall(AddCrmCallSchema.parse(args)));
      case "fc_edit_crm_call": return ok(await fc.editCrmCall(EditCrmCallSchema.parse(args)));
      case "fc_delete_crm_call": return ok(await fc.deleteCrmCall(DeleteCrmCallSchema.parse(args)));

      // Misc
      case "fc_fetch_groups": return ok(await fc.fetchGroups());
      case "fc_fetch_users": return ok(await fc.fetchUsers());
      case "fc_fetch_current_user": return ok(await fc.fetchCurrentUser());
      case "fc_fetch_user": return ok(await fc.fetchUser(FetchUserSchema.parse(args)));
      case "fc_update_current_user": return ok(await fc.updateCurrentUser(UpdateCurrentUserSchema.parse(args)));
      case "fc_register_user": return ok(await fc.registerUser(RegisterUserSchema.parse(args)));
      case "fc_fetch_cf_templates": return ok(await fc.fetchCfTemplates(FetchCfTemplatesSchema.parse(args)));
      case "fc_fetch_linked_items": return ok(await fc.fetchLinkedItems(FetchLinkedItemsSchema.parse(args)));
      case "fc_add_linked_items": return ok(await fc.addLinkedItems(AddLinkedItemsSchema.parse(args)));
      case "fc_fetch_overview": return ok(await fc.fetchOverview(FetchOverviewSchema.parse(args)));
      case "fc_fetch_current_session": return ok(await fc.fetchCurrentSession());
      case "fc_fetch_invitations": return ok(await fc.fetchInvitations());
      case "fc_respond_invitation": return ok(await fc.respondInvitation(RespondInvitationSchema.parse(args)));
      case "fc_fetch_notifications": return ok(await fc.fetchNotifications());
      case "fc_fetch_notifications_by_project": return ok(await fc.fetchNotificationsByProject(FetchNotificationsByProjectSchema.parse(args)));
      case "fc_update_notification_read": {
        const { uid } = UpdateNotificationReadSchema.parse(args);
        return ok(await fc.updateNotificationRead(uid));
      }
      case "fc_edit_notifications": return ok(await fc.editNotifications(EditNotificationsSchema.parse(args)));
      case "fc_fetch_calendar_items": return ok(await fc.fetchCalendarItems(args));
      case "fc_add_favorite_project": return ok(await fc.addFavoriteProject(AddFavoriteProjectSchema.parse(args)));
      case "fc_delete_favorite_project": return ok(await fc.deleteFavoriteProject(AddFavoriteProjectSchema.parse(args)));
      case "fc_validate_email": return ok(await fc.validateEmail(ValidateEmailSchema.parse(args)));
      case "fc_fetch_timezones": return ok(await fc.fetchTimezones());
      case "fc_fetch_backups": return ok(await fc.fetchBackups());
      case "fc_fetch_wipe_current": return ok(await fc.fetchWipeCurrent());
      case "fc_delete_account": return ok(await fc.deleteAccount(DeleteAccountSchema.parse(args)));
      case "fc_request_password_reset": return ok(await fc.requestPasswordReset(RequestPasswordResetSchema.parse(args)));
      case "fc_apply_password_reset": return ok(await fc.applyPasswordReset(ApplyPasswordResetSchema.parse(args)));
      case "fc_delete_avatar": return ok(await fc.deleteAvatar());

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new Error(`Invalid input: ${JSON.stringify(err.errors)}`);
    }
    throw err;
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Freedcamp MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
