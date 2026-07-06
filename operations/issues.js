import { z } from "zod";
import { Opt, PaginationSchema } from "./schemas.js";

export const FetchIssuesSchema = PaginationSchema.extend({
    project_id: z.string().describe("ID of the project whose issues to fetch.")
});

export const FetchIssueSchema = z.object({
    issue_id: z.string().describe("ID of the issue to fetch.")
});

export const AddIssueSchema = z.object({
    title: z.string().describe("Issue title."),
    description: Opt(z.string()).describe("Issue description."),
    project_id: z.string().describe("ID of the project this issue belongs to."),
    priority: Opt(z.number().int()).describe("Priority: 0=none, 1=low, 2=medium, 3=high."),
    status: Opt(z.number().int()).describe(
        "Issue status ID (Freedcamp project-defined workflow status)."
    ),
    type: Opt(z.number().int()).describe(
        "Issue type ID (Freedcamp project-defined, e.g. bug/feature/task)."
    ),
    assigned_to_id: Opt(z.string()).describe("User ID to assign this issue to."),
    due_date: Opt(z.string()).describe("Due date, e.g. 'YYYY-MM-DD'."),
    closer_id: Opt(z.string()).describe("User ID who closed/resolved this issue."),
    attached_ids: Opt(z.array(z.string())).describe(
        "IDs of previously uploaded files to attach to this issue."
    )
});

export const EditIssueSchema = z.object({
    issue_id: z.string().describe("ID of the issue to edit."),
    title: Opt(z.string()).describe("New issue title."),
    description: Opt(z.string()).describe("New issue description."),
    priority: Opt(z.number().int()).describe("Priority: 0=none, 1=low, 2=medium, 3=high."),
    status: Opt(z.number().int()).describe(
        "Issue status ID (Freedcamp project-defined workflow status)."
    ),
    type: Opt(z.number().int()).describe(
        "Issue type ID (Freedcamp project-defined, e.g. bug/feature/task)."
    ),
    assigned_to_id: Opt(z.string()).describe("User ID to reassign this issue to."),
    due_date: Opt(z.string()).describe("New due date, e.g. 'YYYY-MM-DD'."),
    closer_id: Opt(z.string()).describe("User ID who closed/resolved this issue."),
    attached_ids: Opt(z.array(z.string())).describe(
        "IDs of previously uploaded files to attach to this issue."
    )
});

export const DeleteIssueSchema = z.object({
    issue_id: z.string().describe("ID of the issue to delete.")
});
