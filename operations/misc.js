import { z } from "zod";
import { Opt } from "./schemas.js";

export const FetchLinkedItemsSchema = z.object({
    app_id: z
        .number()
        .int()
        .describe("Freedcamp app ID that owns the item, e.g. 2=Tasks, 13=Issue Tracker."),
    item_id: z.string().describe("ID of the item whose links to fetch.")
});

export const AddLinkedItemsSchema = z.object({
    app_id: z
        .number()
        .int()
        .describe("Freedcamp app ID that owns the source item, e.g. 2=Tasks, 13=Issue Tracker."),
    item_id: z.string().describe("ID of the source item to link from."),
    links: z
        .record(z.array(z.string()))
        .describe(
            "Map of target app ID (as a string key, e.g. '2') to an array of item IDs to link to."
        )
});

export const FetchOverviewSchema = z.object({
    project_id: z.string().describe("ID of the project whose overview to fetch.")
});

export const FetchCfTemplatesSchema = z.object({
    module_id: Opt(z.number().int()).describe(
        "Freedcamp app ID to fetch custom-field templates for (default 2 = Tasks)."
    )
});

export const FetchCalendarItemsSchema = z.object({
    project_id: Opt(z.string()).describe(
        "Restrict results to this project ID. Omit to fetch across all accessible projects."
    )
});

export const FavoriteProjectSchema = z.object({
    project_id: z.string().describe("ID of the project to add to or remove from favorites.")
});

export const RespondInvitationSchema = z.object({
    invitation_id: z.string().describe("ID of the invitation to respond to."),
    action: Opt(z.string()).describe("Response action, e.g. 'accept' or 'decline'."),
    response: Opt(z.string()).describe(
        "Additional response value required by some invitation types."
    ),
    project_id: Opt(z.string()).describe("ID of the project the invitation is for, if applicable.")
});
