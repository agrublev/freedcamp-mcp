import { z } from "zod";
import { Opt } from "./schemas.js";

export const FetchProjectSchema = z.object({
    project_id: z.string().describe("ID of the project to fetch.")
});

export const AddProjectSchema = z.object({
    project_name: z.string().describe("Name of the new project."),
    project_description: Opt(z.string()).describe("Description of the new project."),
    project_color: Opt(z.string()).describe(
        "Hex color code for the project, e.g. '1C7160' (no leading '#')."
    ),
    todo_view_type: Opt(z.string()).describe(
        "Default task view type for the project, e.g. 'list' or 'board'."
    ),
    usage_type: Opt(z.number().int()).describe("Freedcamp usage-type ID for the project template."),
    group_id: Opt(z.string()).describe("ID of an existing group to create this project under."),
    group_name: Opt(z.string()).describe(
        "Name for a new group to create and place this project under."
    )
});

export const EditProjectSchema = z.object({
    project_id: z.string().describe("ID of the project to edit."),
    project_name: Opt(z.string()).describe("New project name."),
    project_color: Opt(z.string()).describe(
        "New hex color code for the project, e.g. '1C7160' (no leading '#')."
    ),
    group_id: Opt(z.string()).describe("Move the project to this group ID."),
    cs_tpl_id: Opt(z.string()).describe("Custom-field template ID to apply to the project.")
});

export const LeaveProjectSchema = z.object({
    membership_id: z
        .string()
        .describe("ID of your project membership to leave (not the project ID).")
});

export const DeleteProjectSchema = z.object({
    project_id: z.string().describe("ID of the project to permanently delete.")
});
