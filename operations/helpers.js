import { z } from "zod";
import { id_to_name, name_to_app_id, statuses } from "./constants.js";

// ── High-level, human-readable-name convenience tools ──────────────────────
// These wrap the ID-based primitives (fc_add_task, fc_add_comment, ...) with
// lookups by project/app *name* instead of numeric ID, for callers that only
// know names (e.g. an LLM working from a conversation, not from prior IDs).

export const GetGroupsProjectsSchema = z.object({});

// MCP structuredContent must be a JSON object (not a top-level array).
export const GroupsProjectsOutputSchema = z.object({
    groups: z.array(
        z
            .object({
                name: z.string().optional(),
                id: z.union([z.string(), z.number()]).optional(),
                applications: z.array(z.string().nullable()).optional(),
                projects: z
                    .array(
                        z
                            .object({
                                id: z.union([z.string(), z.number()]),
                                project_name: z.string().optional(),
                                applications: z.array(z.string().nullable()).optional()
                            })
                            .passthrough()
                    )
                    .optional()
            })
            .passthrough()
    )
});

export const AddItemByNamesSchema = z.object({
    project_name: z.string().describe("A project name inside a project group."),
    app_name: z
        .string()
        .describe(`An app name from ${JSON.stringify(Object.values(id_to_name).map((a) => a.name))}.`),
    title: z.string().describe("The title of the item to add.")
});

export const AddCommentByNamesSchema = z.object({
    item_id: z.string().describe("ID of the item (task, issue, discussion, etc.) to comment on."),
    app_name: z
        .string()
        .describe(`An app name from ${JSON.stringify(Object.values(id_to_name).map((a) => a.name))}.`),
    description: z.string().describe("Comment body text (wrap in <p> tags).")
});

export const UpdateStatusSchema = z.object({
    item_id: z.string().describe("ID of the task to update."),
    status: z
        .union([z.string(), z.number()])
        .describe(`Status value from ${JSON.stringify(statuses)} (numeric value, e.g. 2 for in progress).`)
});

/**
 * Flattens a Freedcamp session's groups/projects/applications into a
 * human-readable tree: { groups: [{ name, id, applications: [...],
 * projects: [{ id, project_name, applications: [...] }] }] }.
 */
export function getGroupsAndProjects(session) {
    const groups = [];
    (session?.groups || []).forEach((group) => {
        const groupObj = { name: group.name, id: group.group_id };
        groupObj.applications = (group.applications || []).map((appId) => id_to_name[appId]?.name);
        const projectsAll = (group.projects || []).map((projectId) => {
            const project = (session.projects || []).find((p) => p.id === projectId);
            // Archived projects may no longer appear in session.projects.
            if (!project) return undefined;
            return {
                id: project.id,
                project_name: project.project_name,
                applications: (project.applications || []).map((appId) => id_to_name[appId]?.name)
            };
        });
        groupObj.projects = projectsAll.filter((p) => p !== undefined);
        groups.push(groupObj);
    });
    // Object wrapper: CallToolResult.structuredContent is a record, not an array.
    return { groups };
}

/**
 * Adds an item to an app inside a project, resolving both by human-readable
 * name instead of numeric ID. Currently supports Tasks (app_id 2); other
 * apps resolve their app ID but are not yet wired to a create call here.
 */
export async function addItemByNames({ fc, session, title, project_name, app_name }) {
    const project = (session?.projects || []).find((p) => p.project_name === project_name);
    if (!project) {
        throw new Error(`No project found named "${project_name}"`);
    }
    const appId = name_to_app_id(app_name);
    if (Number(appId) === 2) {
        return fc.addTask({ title, project_id: project.id });
    }
    throw new Error(`fc_add_item_by_names does not yet support the "${app_name}" app`);
}

/** Adds a comment to an item, resolving the app by human-readable name. */
export async function addCommentByNames({ fc, item_id, app_name, description }) {
    const app_id = name_to_app_id(app_name);
    return fc.addComment({ item_id, app_id, description });
}

/** Updates a task's status. Thin, name-agnostic convenience wrapper. */
export async function updateStatus({ fc, item_id, status }) {
    return fc.updateTask({ task_id: item_id, status });
}
