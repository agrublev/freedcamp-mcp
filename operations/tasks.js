import { z } from "zod";
import { Opt, PaginationSchema, CustomFieldValueInput } from "./schemas.js";

export const FetchTaskSchema = z.object({
    task_id: z.string().describe("ID of the Freedcamp task to fetch.")
});

export const FetchTasksSchema = PaginationSchema.extend({
    project_id: Opt(z.string()).describe(
        "Restrict results to this project ID. Omit to fetch tasks across all accessible projects."
    ),
    filters: Opt(
        z.object({
            status: Opt(
                z.array(
                    z.enum([
                        "STATUS_NOT_STARTED",
                        "STATUS_COMPLETED",
                        "STATUS_IN_PROGRESS",
                        "STATUS_INVALID",
                        "STATUS_REVIEW"
                    ])
                )
            ).describe("Only include tasks with one of these statuses."),
            assigned_to_id: Opt(z.array(z.string())).describe(
                "Only include tasks assigned to one of these user IDs."
            ),
            created_by_id: Opt(z.string()).describe("Only include tasks created by this user ID."),
            due_date_from: Opt(z.string()).describe(
                "Only include tasks due on or after this date (YYYY-MM-DD)."
            ),
            due_date_to: Opt(z.string()).describe(
                "Only include tasks due on or before this date (YYYY-MM-DD)."
            ),
            created_date_from: Opt(z.string()).describe(
                "Only include tasks created on or after this date (YYYY-MM-DD)."
            ),
            created_date_to: Opt(z.string()).describe(
                "Only include tasks created on or before this date (YYYY-MM-DD)."
            ),
            f_with_archived: Opt(z.number().int()).describe(
                "Set to 1 to include tasks from archived lists; 0 (default) excludes them."
            ),
            list_status: Opt(z.string()).describe(
                "Filter by parent list status, e.g. 'active' or 'archived'. " +
                    "Sent to the API as lists_status."
            ),
            f_include_tags: Opt(z.number().int()).describe(
                "Set to 1 to include each task's tags in the response; 0 (default) omits them."
            ),
            order_priority: Opt(z.enum(["asc", "desc", "ASC", "DESC"])).describe(
                "Sort results by priority: 'asc' (low→high) or 'desc' (high→low)."
            ),
            order_due_date: Opt(z.string()).describe("Sort order for due_date: 'asc' or 'desc'.")
        })
    ).describe("Optional filters to narrow down the task list.")
});

export const AddTaskSchema = z.object({
    title: z.string().describe("Task title."),
    description: Opt(z.string()).describe("Task description (plain text or HTML)."),
    project_id: z.string().describe("ID of the project this task belongs to."),
    list_id: Opt(z.string()).describe(
        "ID of the task list to place this task in (the API field for this is list_id; " +
            "task_group_id is an alias for it). Omit to use the project's default list."
    ),
    task_group_id: Opt(z.string()).describe(
        "Legacy alias for list_id. Prefer list_id; only one of the two should be provided."
    ),
    priority: Opt(z.number().int()).describe("Priority: 0=none, 1=low, 2=medium, 3=high."),
    assigned_to_id: Opt(z.string()).describe("User ID to assign this task to."),
    start_date: Opt(z.string()).describe(
        "Start date of the task, e.g. 'YYYY-MM-DD' or 'YYYY-MM-DD HH:mm:ss'. " +
            "Shows up in the calendar via fc_fetch_calendar_items."
    ),
    r_rule: Opt(z.string()).describe(
        "Recurrence rule for repeating tasks, e.g. 'FREQ=DAILY;INTERVAL=1', " +
            "'FREQ=WEEKLY;BYDAY=MO,WE', 'FREQ=MONTHLY;BYMONTHDAY=1', or " +
            "'FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=25'. Omit for a non-recurring task."
    ),
    due_date: Opt(z.string()).describe(
        "Due date/time, e.g. 'YYYY-MM-DD' or 'YYYY-MM-DD HH:mm:ss'."
    ),
    status: Opt(z.number().int()).describe(
        "Status: 0=not started, 1=completed, 2=in progress, 3=invalid, 4=review."
    ),
    completed_date: Opt(z.string()).describe(
        "Completion date/time. Set when status is 1 (completed)."
    ),
    attached_ids: Opt(z.array(z.string())).describe(
        "IDs of previously uploaded files to attach to this task."
    ),
    h_parent_id: Opt(z.string()).describe(
        "ID of the parent task to create this task under (makes it a subtask). The parent " +
            "must be in the same list (task_group_id) and must not itself be a subtask."
    ),
    cf_tpl_id: Opt(z.number().int()).describe(
        "Custom-fields template id to use for this task's custom fields " +
            "(see fc_fetch_cf_templates). Usually inferred; omit unless needed."
    ),
    custom_fields: Opt(z.array(CustomFieldValueInput)).describe(
        "Custom field values for this task (cf_id from fc_fetch_cf_templates)."
    )
});

export const UpdateTaskSchema = z.object({
    task_id: z.string().describe("ID of the task to update."),
    title: Opt(z.string()).describe("New task title."),
    description: Opt(z.string()).describe("New task description (plain text or HTML)."),
    list_id: Opt(z.string()).describe("Move the task to this list ID (task_group_id is an alias)."),
    task_group_id: Opt(z.string()).describe("Legacy alias for list_id; only one of the two should be provided."),
    status: Opt(z.number().int()).describe(
        "Status: 0=not started, 1=completed, 2=in progress, 3=invalid, 4=review."
    ),
    priority: Opt(z.number().int()).describe("Priority: 0=none, 1=low, 2=medium, 3=high."),
    assigned_to_id: Opt(z.string()).describe("User ID to reassign this task to."),
    start_date: Opt(z.string()).describe(
        "New start date, e.g. 'YYYY-MM-DD' or 'YYYY-MM-DD HH:mm:ss'. Pass an empty string to clear it."
    ),
    r_rule: Opt(z.string()).describe(
        "New recurrence rule, e.g. 'FREQ=WEEKLY;BYDAY=MO,WE'. Pass an empty string to stop recurrence."
    ),
    due_date: Opt(z.string()).describe(
        "New due date/time, e.g. 'YYYY-MM-DD' or 'YYYY-MM-DD HH:mm:ss'."
    ),
    attached_ids: Opt(z.array(z.string())).describe(
        "IDs of previously uploaded files to attach to this task (replaces the current set)."
    ),
    h_parent_id: Opt(z.string()).describe(
        "ID of the parent task. Set to make this task a subtask of that parent (parent must be " +
            "in the same task_group_id and not itself a subtask). Pass an empty string to convert " +
            "a subtask back into a top-level task. Omit to leave the current parent unchanged."
    ),
    cf_tpl_id: Opt(z.number().int()).describe(
        "Custom-fields template id to use for this task's custom fields."
    ),
    custom_fields: Opt(z.array(CustomFieldValueInput)).describe(
        "Custom field values to set on this task (cf_id from fc_fetch_cf_templates)."
    )
});

export const BatchEditTasksSchema = z.object({
    batch_ids: z.array(z.string()).min(1).max(500).describe(
        "IDs of the tasks to edit in one request (up to 500)."
    ),
    title: Opt(z.string()).describe("New title to set on every listed task."),
    description: Opt(z.string()).describe("New description to set on every listed task."),
    status: Opt(z.number().int()).describe(
        "Status to set on every listed task: 0=not started, 1=completed, 2=in progress."
    ),
    priority: Opt(z.number().int()).describe("Priority to set: 0=none, 1=low, 2=medium, 3=high."),
    assigned_to_id: Opt(z.string()).describe("Single user ID to assign every listed task to."),
    assigned_ids: Opt(z.array(z.string())).describe(
        "Multiple assignee user IDs to set on every listed task (replaces assignees)."
    ),
    start_date: Opt(z.string()).describe("Start date to set, e.g. 'YYYY-MM-DD HH:mm:ss'."),
    due_date: Opt(z.string()).describe("Due date/time to set, e.g. 'YYYY-MM-DD' or 'YYYY-MM-DD HH:mm:ss'."),
    ms_id: Opt(z.string()).describe("Milestone ID to link the listed tasks to."),
    h_parent_id: Opt(z.string()).describe("Parent task ID to nest the listed tasks under."),
    tags: Opt(z.array(z.string())).describe("Tag names to set on every listed task."),
    custom_fields: Opt(z.array(CustomFieldValueInput)).describe(
        "Custom field values to set on every listed task (cf_id from fc_fetch_cf_templates)."
    ),
    follower_ids: Opt(z.array(z.string())).describe(
        "User IDs to add/remove as followers, according to followers_operation."
    ),
    followers_operation: Opt(z.string()).describe(
        "How to apply follower_ids, e.g. 'append' to add or 'remove' to remove."
    )
}).describe(
    "Edit up to 500 tasks with one request. Only the fields that are provided are changed; " +
        "at least one field besides batch_ids is required by the API."
);

export const DeleteTaskSchema = z.object({
    task_id: z.string().describe("ID of the task to delete.")
});
