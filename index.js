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
import { Opt } from "./operations/schemas.js";

import * as tasks from "./operations/tasks.js";
import * as lists from "./operations/lists.js";
import * as comments from "./operations/comments.js";
import * as events from "./operations/events.js";
import * as discussions from "./operations/discussions.js";
import * as issues from "./operations/issues.js";
import * as milestones from "./operations/milestones.js";
import * as times from "./operations/times.js";
import * as wikis from "./operations/wikis.js";
import * as projects from "./operations/projects.js";
import * as crm from "./operations/crm.js";
import * as users from "./operations/users.js";
import * as notifications from "./operations/notifications.js";
import * as misc from "./operations/misc.js";

const apiKey = process.env.FREEDCAMP_API_KEY;
const apiSecret = process.env.FREEDCAMP_API_SECRET;

const missingCreds = [
  !apiKey && "FREEDCAMP_API_KEY",
  !apiSecret && "FREEDCAMP_API_SECRET",
].filter(Boolean);

if (missingCreds.length) {
  console.error("=== LOGIN ERROR ===");
  console.error(`Missing required credential env var(s): ${missingCreds.join(", ")}`);
  console.error("The Freedcamp MCP server cannot authenticate without these.");
  console.error("Pass them when launching the server, e.g.:");
  console.error("  FREEDCAMP_API_KEY=xxx FREEDCAMP_API_SECRET=yyy npx freedcamp-mcp-server");
  process.exit(1);
}

const fc = new FreedcampHandler(apiKey, apiSecret, undefined, { sessionFilePath: null });
await fc.initialize();

// ── Tool registry ──────────────────────────────────────────────────────────

const tools = [
  // Tasks
  { name: "fc_fetch_task", description: "Get a single Freedcamp task by ID", schema: tasks.FetchTaskSchema },
  { name: "fc_fetch_tasks", description: "List Freedcamp tasks with optional filters", schema: tasks.FetchTasksSchema },
  { name: "fc_add_task", description: "Create a new Freedcamp task", schema: tasks.AddTaskSchema },
  { name: "fc_update_task", description: "Update an existing Freedcamp task", schema: tasks.UpdateTaskSchema },
  { name: "fc_delete_task", description: "Delete a Freedcamp task", schema: tasks.DeleteTaskSchema },
  // Lists
  { name: "fc_fetch_lists", description: "Get lists for a project", schema: lists.FetchListsSchema },
  { name: "fc_add_list", description: "Create a new list", schema: lists.AddListSchema },
  { name: "fc_edit_list", description: "Edit an existing list", schema: lists.EditListSchema },
  { name: "fc_delete_list", description: "Delete a list", schema: lists.DeleteListSchema },
  // Comments
  { name: "fc_add_comment", description: "Add a comment to a Freedcamp item", schema: comments.AddCommentSchema },
  { name: "fc_edit_comment", description: "Edit a comment", schema: comments.EditCommentSchema },
  { name: "fc_delete_comment", description: "Delete a comment", schema: comments.DeleteCommentSchema },
  // Calendar Events
  { name: "fc_fetch_events", description: "List calendar events", schema: events.FetchEventsSchema },
  { name: "fc_fetch_event", description: "Get a single calendar event", schema: events.FetchEventSchema },
  { name: "fc_add_event", description: "Create a calendar event", schema: events.AddEventSchema },
  { name: "fc_edit_event", description: "Edit a calendar event", schema: events.EditEventSchema },
  { name: "fc_delete_event", description: "Delete a calendar event", schema: events.DeleteEventSchema },
  // Discussions
  { name: "fc_fetch_discussions", description: "List discussions in a project", schema: discussions.FetchDiscussionsSchema },
  { name: "fc_fetch_discussion", description: "Get a single discussion", schema: discussions.FetchDiscussionSchema },
  { name: "fc_add_discussion", description: "Create a discussion", schema: discussions.AddDiscussionSchema },
  { name: "fc_edit_discussion", description: "Edit a discussion", schema: discussions.EditDiscussionSchema },
  { name: "fc_delete_discussion", description: "Delete a discussion", schema: discussions.DeleteDiscussionSchema },
  // Issues
  { name: "fc_fetch_issues", description: "List issues in a project", schema: issues.FetchIssuesSchema },
  { name: "fc_fetch_issue", description: "Get a single issue", schema: issues.FetchIssueSchema },
  { name: "fc_add_issue", description: "Create an issue", schema: issues.AddIssueSchema },
  { name: "fc_edit_issue", description: "Edit an issue", schema: issues.EditIssueSchema },
  { name: "fc_delete_issue", description: "Delete an issue", schema: issues.DeleteIssueSchema },
  // Milestones
  { name: "fc_fetch_milestones", description: "List milestones in a project", schema: milestones.FetchMilestonesSchema },
  { name: "fc_fetch_milestone", description: "Get a single milestone", schema: milestones.FetchMilestoneSchema },
  { name: "fc_add_milestone", description: "Create a milestone", schema: milestones.AddMilestoneSchema },
  { name: "fc_edit_milestone", description: "Edit a milestone", schema: milestones.EditMilestoneSchema },
  { name: "fc_delete_milestone", description: "Delete a milestone", schema: milestones.DeleteMilestoneSchema },
  // Times
  { name: "fc_fetch_times", description: "List time entries in a project", schema: times.FetchTimesSchema },
  { name: "fc_fetch_time", description: "Get a single time entry", schema: times.FetchTimeSchema },
  { name: "fc_add_time", description: "Create a time entry", schema: times.AddTimeSchema },
  { name: "fc_edit_time", description: "Edit a time entry", schema: times.EditTimeSchema },
  { name: "fc_delete_time", description: "Delete a time entry", schema: times.DeleteTimeSchema },
  { name: "fc_time_action", description: "Perform a time action (start/stop/bill/unbill)", schema: times.TimeActionSchema },
  // Wikis
  { name: "fc_fetch_wikis", description: "List wikis in a project", schema: wikis.FetchWikisSchema },
  { name: "fc_fetch_wiki", description: "Get a single wiki", schema: wikis.FetchWikiSchema },
  { name: "fc_add_wiki", description: "Create a wiki", schema: wikis.AddWikiSchema },
  { name: "fc_edit_wiki", description: "Edit a wiki", schema: wikis.EditWikiSchema },
  { name: "fc_delete_wiki", description: "Delete a wiki", schema: wikis.DeleteWikiSchema },
  { name: "fc_add_wiki_version", description: "Add a new version to a wiki", schema: wikis.AddWikiVersionSchema },
  // Projects
  { name: "fc_fetch_projects", description: "List all Freedcamp projects", schema: z.object({}) },
  { name: "fc_fetch_project", description: "Get a single project", schema: projects.FetchProjectSchema },
  { name: "fc_fetch_recent_project_ids", description: "Get recently accessed project IDs", schema: z.object({}) },
  { name: "fc_add_project", description: "Create a new project", schema: projects.AddProjectSchema },
  { name: "fc_edit_project", description: "Edit a project", schema: projects.EditProjectSchema },
  { name: "fc_leave_project", description: "Leave a project", schema: projects.LeaveProjectSchema },
  { name: "fc_delete_project", description: "Delete a project", schema: projects.DeleteProjectSchema },
  // CRM Tasks
  { name: "fc_fetch_crm_tasks", description: "List CRM tasks for a group", schema: crm.FetchCrmTasksSchema },
  { name: "fc_fetch_crm_task", description: "Get a single CRM task", schema: crm.FetchCrmTaskSchema },
  { name: "fc_add_crm_task", description: "Create a CRM task", schema: crm.AddCrmTaskSchema },
  { name: "fc_edit_crm_task", description: "Edit a CRM task", schema: crm.EditCrmTaskSchema },
  { name: "fc_delete_crm_task", description: "Delete a CRM task", schema: crm.DeleteCrmTaskSchema },
  // CRM Calls
  { name: "fc_fetch_crm_calls", description: "List CRM calls for a group", schema: crm.FetchCrmCallsSchema },
  { name: "fc_fetch_crm_call", description: "Get a single CRM call", schema: crm.FetchCrmCallSchema },
  { name: "fc_add_crm_call", description: "Create a CRM call", schema: crm.AddCrmCallSchema },
  { name: "fc_edit_crm_call", description: "Edit a CRM call", schema: crm.EditCrmCallSchema },
  { name: "fc_delete_crm_call", description: "Delete a CRM call", schema: crm.DeleteCrmCallSchema },
  // Users
  { name: "fc_fetch_groups", description: "List all groups", schema: z.object({}) },
  { name: "fc_fetch_users", description: "List all users", schema: z.object({}) },
  { name: "fc_fetch_current_user", description: "Get the current authenticated user", schema: z.object({}) },
  { name: "fc_fetch_user", description: "Get a user by ID", schema: users.FetchUserSchema },
  { name: "fc_update_current_user", description: "Update current user profile", schema: users.UpdateCurrentUserSchema },
  { name: "fc_register_user", description: "Register a new user", schema: users.RegisterUserSchema },
  { name: "fc_delete_account", description: "Delete the current account", schema: users.DeleteAccountSchema },
  { name: "fc_request_password_reset", description: "Request a password reset email", schema: users.RequestPasswordResetSchema },
  { name: "fc_apply_password_reset", description: "Apply a password reset", schema: users.ApplyPasswordResetSchema },
  { name: "fc_validate_email", description: "Validate an email address", schema: users.ValidateEmailSchema },
  { name: "fc_delete_avatar", description: "Delete the current user avatar", schema: z.object({}) },
  // Notifications
  { name: "fc_fetch_notifications", description: "Get recent notifications", schema: z.object({}) },
  { name: "fc_fetch_notifications_by_project", description: "Get notifications for a project", schema: notifications.FetchNotificationsByProjectSchema },
  { name: "fc_update_notification_read", description: "Mark a notification as read", schema: notifications.UpdateNotificationReadSchema },
  { name: "fc_edit_notifications", description: "Bulk update notification state", schema: notifications.EditNotificationsSchema },
  // Misc
  { name: "fc_fetch_cf_templates", description: "List custom field templates", schema: misc.FetchCfTemplatesSchema },
  { name: "fc_fetch_linked_items", description: "Get linked items for an item", schema: misc.FetchLinkedItemsSchema },
  { name: "fc_add_linked_items", description: "Link items together", schema: misc.AddLinkedItemsSchema },
  { name: "fc_fetch_overview", description: "Get project overview", schema: misc.FetchOverviewSchema },
  { name: "fc_fetch_current_session", description: "Get the current session", schema: z.object({}) },
  { name: "fc_fetch_invitations", description: "List pending invitations", schema: z.object({}) },
  { name: "fc_respond_invitation", description: "Respond to an invitation", schema: misc.RespondInvitationSchema },
  { name: "fc_fetch_calendar_items", description: "List calendar items for a project", schema: misc.FetchCalendarItemsSchema },
  { name: "fc_add_favorite_project", description: "Add a project to favorites", schema: misc.FavoriteProjectSchema },
  { name: "fc_delete_favorite_project", description: "Remove a project from favorites", schema: misc.FavoriteProjectSchema },
  { name: "fc_fetch_timezones", description: "List available timezones", schema: z.object({}) },
  { name: "fc_fetch_backups", description: "List account backups", schema: z.object({}) },
  { name: "fc_fetch_wipe_current", description: "Get wipe current info", schema: z.object({}) },
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
      case "fc_fetch_task": return ok(await fc.fetchTask(tasks.FetchTaskSchema.parse(args)));
      case "fc_fetch_tasks": return ok(await fc.fetchTasks(tasks.FetchTasksSchema.parse(args)));
      case "fc_add_task": return ok(await fc.addTask(tasks.AddTaskSchema.parse(args)));
      case "fc_update_task": return ok(await fc.updateTask(tasks.UpdateTaskSchema.parse(args)));
      case "fc_delete_task": return ok(await fc.deleteTask(tasks.DeleteTaskSchema.parse(args)));

      // Lists
      case "fc_fetch_lists": return ok(await fc.fetchLists(lists.FetchListsSchema.parse(args)));
      case "fc_add_list": return ok(await fc.addList(lists.AddListSchema.parse(args)));
      case "fc_edit_list": return ok(await fc.editList(lists.EditListSchema.parse(args)));
      case "fc_delete_list": return ok(await fc.deleteList(lists.DeleteListSchema.parse(args)));

      // Comments
      case "fc_add_comment": return ok(await fc.addComment(comments.AddCommentSchema.parse(args)));
      case "fc_edit_comment": return ok(await fc.editComment(comments.EditCommentSchema.parse(args)));
      case "fc_delete_comment": return ok(await fc.deleteComment(comments.DeleteCommentSchema.parse(args)));

      // Calendar Events
      case "fc_fetch_events": return ok(await fc.fetchEvents(events.FetchEventsSchema.parse(args)));
      case "fc_fetch_event": return ok(await fc.fetchEvent(events.FetchEventSchema.parse(args)));
      case "fc_add_event": return ok(await fc.addEvent(events.AddEventSchema.parse(args)));
      case "fc_edit_event": return ok(await fc.editEvent(events.EditEventSchema.parse(args)));
      case "fc_delete_event": return ok(await fc.deleteEvent(events.DeleteEventSchema.parse(args)));

      // Discussions
      case "fc_fetch_discussions": return ok(await fc.fetchDiscussions(discussions.FetchDiscussionsSchema.parse(args)));
      case "fc_fetch_discussion": return ok(await fc.fetchDiscussion(discussions.FetchDiscussionSchema.parse(args)));
      case "fc_add_discussion": return ok(await fc.addDiscussion(discussions.AddDiscussionSchema.parse(args)));
      case "fc_edit_discussion": return ok(await fc.editDiscussion(discussions.EditDiscussionSchema.parse(args)));
      case "fc_delete_discussion": return ok(await fc.deleteDiscussion(discussions.DeleteDiscussionSchema.parse(args)));

      // Issues
      case "fc_fetch_issues": return ok(await fc.fetchIssues(issues.FetchIssuesSchema.parse(args)));
      case "fc_fetch_issue": return ok(await fc.fetchIssue(issues.FetchIssueSchema.parse(args)));
      case "fc_add_issue": return ok(await fc.addIssue(issues.AddIssueSchema.parse(args)));
      case "fc_edit_issue": return ok(await fc.editIssue(issues.EditIssueSchema.parse(args)));
      case "fc_delete_issue": return ok(await fc.deleteIssue(issues.DeleteIssueSchema.parse(args)));

      // Milestones
      case "fc_fetch_milestones": return ok(await fc.fetchMilestones(milestones.FetchMilestonesSchema.parse(args)));
      case "fc_fetch_milestone": return ok(await fc.fetchMilestone(milestones.FetchMilestoneSchema.parse(args)));
      case "fc_add_milestone": return ok(await fc.addMilestone(milestones.AddMilestoneSchema.parse(args)));
      case "fc_edit_milestone": return ok(await fc.editMilestone(milestones.EditMilestoneSchema.parse(args)));
      case "fc_delete_milestone": return ok(await fc.deleteMilestone(milestones.DeleteMilestoneSchema.parse(args)));

      // Times
      case "fc_fetch_times": return ok(await fc.fetchTimes(times.FetchTimesSchema.parse(args)));
      case "fc_fetch_time": return ok(await fc.fetchTime(times.FetchTimeSchema.parse(args)));
      case "fc_add_time": return ok(await fc.addTime(times.AddTimeSchema.parse(args)));
      case "fc_edit_time": return ok(await fc.editTime(times.EditTimeSchema.parse(args)));
      case "fc_delete_time": return ok(await fc.deleteTime(times.DeleteTimeSchema.parse(args)));
      case "fc_time_action": return ok(await fc.timeAction(times.TimeActionSchema.parse(args)));

      // Wikis
      case "fc_fetch_wikis": return ok(await fc.fetchWikis(wikis.FetchWikisSchema.parse(args)));
      case "fc_fetch_wiki": return ok(await fc.fetchWiki(wikis.FetchWikiSchema.parse(args)));
      case "fc_add_wiki": return ok(await fc.addWiki(wikis.AddWikiSchema.parse(args)));
      case "fc_edit_wiki": return ok(await fc.editWiki(wikis.EditWikiSchema.parse(args)));
      case "fc_delete_wiki": return ok(await fc.deleteWiki(wikis.DeleteWikiSchema.parse(args)));
      case "fc_add_wiki_version": return ok(await fc.addWikiVersion(wikis.AddWikiVersionSchema.parse(args)));

      // Projects
      case "fc_fetch_projects": return ok(await fc.fetchProjects());
      case "fc_fetch_project": return ok(await fc.fetchProject(projects.FetchProjectSchema.parse(args)));
      case "fc_fetch_recent_project_ids": return ok(await fc.fetchRecentProjectIds());
      case "fc_add_project": return ok(await fc.addProject(projects.AddProjectSchema.parse(args)));
      case "fc_edit_project": return ok(await fc.editProject(projects.EditProjectSchema.parse(args)));
      case "fc_leave_project": return ok(await fc.leaveProject(projects.LeaveProjectSchema.parse(args)));
      case "fc_delete_project": return ok(await fc.deleteProject(projects.DeleteProjectSchema.parse(args)));

      // CRM Tasks
      case "fc_fetch_crm_tasks": return ok(await fc.fetchCrmTasks(crm.FetchCrmTasksSchema.parse(args)));
      case "fc_fetch_crm_task": return ok(await fc.fetchCrmTask(crm.FetchCrmTaskSchema.parse(args)));
      case "fc_add_crm_task": return ok(await fc.addCrmTask(crm.AddCrmTaskSchema.parse(args)));
      case "fc_edit_crm_task": return ok(await fc.editCrmTask(crm.EditCrmTaskSchema.parse(args)));
      case "fc_delete_crm_task": return ok(await fc.deleteCrmTask(crm.DeleteCrmTaskSchema.parse(args)));

      // CRM Calls
      case "fc_fetch_crm_calls": return ok(await fc.fetchCrmCalls(crm.FetchCrmCallsSchema.parse(args)));
      case "fc_fetch_crm_call": return ok(await fc.fetchCrmCall(crm.FetchCrmCallSchema.parse(args)));
      case "fc_add_crm_call": return ok(await fc.addCrmCall(crm.AddCrmCallSchema.parse(args)));
      case "fc_edit_crm_call": return ok(await fc.editCrmCall(crm.EditCrmCallSchema.parse(args)));
      case "fc_delete_crm_call": return ok(await fc.deleteCrmCall(crm.DeleteCrmCallSchema.parse(args)));

      // Users
      case "fc_fetch_groups": return ok(await fc.fetchGroups());
      case "fc_fetch_users": return ok(await fc.fetchUsers());
      case "fc_fetch_current_user": return ok(await fc.fetchCurrentUser());
      case "fc_fetch_user": return ok(await fc.fetchUser(users.FetchUserSchema.parse(args)));
      case "fc_update_current_user": return ok(await fc.updateCurrentUser(users.UpdateCurrentUserSchema.parse(args)));
      case "fc_register_user": return ok(await fc.registerUser(users.RegisterUserSchema.parse(args)));
      case "fc_delete_account": return ok(await fc.deleteAccount(users.DeleteAccountSchema.parse(args)));
      case "fc_request_password_reset": return ok(await fc.requestPasswordReset(users.RequestPasswordResetSchema.parse(args)));
      case "fc_apply_password_reset": return ok(await fc.applyPasswordReset(users.ApplyPasswordResetSchema.parse(args)));
      case "fc_validate_email": return ok(await fc.validateEmail(users.ValidateEmailSchema.parse(args)));
      case "fc_delete_avatar": return ok(await fc.deleteAvatar());

      // Notifications
      case "fc_fetch_notifications": return ok(await fc.fetchNotifications());
      case "fc_fetch_notifications_by_project": return ok(await fc.fetchNotificationsByProject(notifications.FetchNotificationsByProjectSchema.parse(args)));
      case "fc_update_notification_read": {
        const { uid } = notifications.UpdateNotificationReadSchema.parse(args);
        return ok(await fc.updateNotificationRead(uid));
      }
      case "fc_edit_notifications": return ok(await fc.editNotifications(notifications.EditNotificationsSchema.parse(args)));

      // Misc
      case "fc_fetch_cf_templates": return ok(await fc.fetchCfTemplates(misc.FetchCfTemplatesSchema.parse(args)));
      case "fc_fetch_linked_items": return ok(await fc.fetchLinkedItems(misc.FetchLinkedItemsSchema.parse(args)));
      case "fc_add_linked_items": return ok(await fc.addLinkedItems(misc.AddLinkedItemsSchema.parse(args)));
      case "fc_fetch_overview": return ok(await fc.fetchOverview(misc.FetchOverviewSchema.parse(args)));
      case "fc_fetch_current_session": return ok(await fc.fetchCurrentSession());
      case "fc_fetch_invitations": return ok(await fc.fetchInvitations());
      case "fc_respond_invitation": return ok(await fc.respondInvitation(misc.RespondInvitationSchema.parse(args)));
      case "fc_fetch_calendar_items": return ok(await fc.fetchCalendarItems(misc.FetchCalendarItemsSchema.parse(args)));
      case "fc_add_favorite_project": return ok(await fc.addFavoriteProject(misc.FavoriteProjectSchema.parse(args)));
      case "fc_delete_favorite_project": return ok(await fc.deleteFavoriteProject(misc.FavoriteProjectSchema.parse(args)));
      case "fc_fetch_timezones": return ok(await fc.fetchTimezones());
      case "fc_fetch_backups": return ok(await fc.fetchBackups());
      case "fc_fetch_wipe_current": return ok(await fc.fetchWipeCurrent());

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
