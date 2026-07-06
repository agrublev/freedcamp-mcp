import { z } from "zod";
import { Opt, PaginationSchema } from "./schemas.js";

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
                "Filter by parent list status, e.g. 'active' or 'archived'."
            ),
            order_due_date: Opt(z.string()).describe("Sort order for due_date: 'asc' or 'desc'.")
        })
    ).describe("Optional filters to narrow down the task list.")
});

export const AddTaskSchema = z.object({
    title: z.string().describe("Task title."),
    description: Opt(z.string()).describe("Task description (plain text or HTML)."),
    project_id: z.string().describe("ID of the project this task belongs to."),
    task_group_id: Opt(z.string()).describe(
        "ID of the list (task group) to place this task in. Omit to use the project's default list."
    ),
    priority: Opt(z.number().int()).describe("Priority: 0=none, 1=low, 2=medium, 3=high."),
    assigned_to_id: Opt(z.string()).describe("User ID to assign this task to."),
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
    )
});

export const UpdateTaskSchema = z.object({
    task_id: z.string().describe("ID of the task to update."),
    title: Opt(z.string()).describe("New task title."),
    description: Opt(z.string()).describe("New task description (plain text or HTML)."),
    task_group_id: Opt(z.string()).describe("Move the task to this list (task group) ID."),
    status: Opt(z.number().int()).describe(
        "Status: 0=not started, 1=completed, 2=in progress, 3=invalid, 4=review."
    ),
    priority: Opt(z.number().int()).describe("Priority: 0=none, 1=low, 2=medium, 3=high."),
    assigned_to_id: Opt(z.string()).describe("User ID to reassign this task to."),
    due_date: Opt(z.string()).describe(
        "New due date/time, e.g. 'YYYY-MM-DD' or 'YYYY-MM-DD HH:mm:ss'."
    )
});

export const DeleteTaskSchema = z.object({
    task_id: z.string().describe("ID of the task to delete.")
});
