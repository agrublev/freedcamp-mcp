import { z } from "zod";
import { Opt } from "./schemas.js";

export const FetchProjectSchema = z.object({
    project_id: z.string().describe("ID of the project to fetch.")
});

// One person to add on project creation (POST /projects changed_users.added[]).
// The API reads context_role_id as a standard role type on create.
const AddedProjectUserInput = z.object({
    email: z.string().describe("Email of the person to add. Required; entries without it are skipped."),
    name: Opt(z.string()).describe("Full name, used when the email has no Freedcamp account yet."),
    context_role_id: Opt(z.number().int().min(-3).max(1)).describe(
        "Role type: 1 Organizer (admin), 0 Team Player, -1 Contributor, -2 Guest, -3 Observer (read-only). " +
            "Omit for the project's default role. An unknown value silently falls back to the default role."
    )
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
    ),
    app_ids: Opt(z.array(z.number().int())).describe(
        "App IDs to turn on: 2 Tasks, 3 Discussions, 4 Milestones, 5 Time, 13 Issue Tracker, 14 Wikis, 19 Calendar. " +
            "Files (6) is always added. IDs the group owner's plan does not allow are dropped without an error, " +
            "and with none allowed the project gets the default apps, so read the project's applications afterwards."
    ),
    changed_users: Opt(
        z.object({
            added: Opt(z.array(AddedProjectUserInput)).describe("People to add to the new project.")
        })
    ).describe(
        "People to add on creation. Freedcamp may notify them. The group owner and group admins are skipped " +
            "(they already have access). An invalid email fails the request; read the project's user_ids afterwards."
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
