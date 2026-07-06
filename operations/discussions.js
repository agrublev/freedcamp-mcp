import { z } from "zod";
import { Opt, PaginationSchema } from "./schemas.js";

export const FetchDiscussionsSchema = PaginationSchema.extend({
    project_id: z.string().describe("ID of the project whose discussions to fetch.")
});

export const FetchDiscussionSchema = z.object({
    discussion_id: z.string().describe("ID of the discussion to fetch.")
});

export const AddDiscussionSchema = z.object({
    title: z.string().describe("Discussion title."),
    description: Opt(z.string()).describe("Discussion body text."),
    project_id: z.string().describe("ID of the project this discussion belongs to."),
    list_id: Opt(z.string()).describe("ID of an existing list to file this discussion under."),
    list_title: Opt(z.string()).describe(
        "Title for a new list to create and file this discussion under."
    ),
    list_descr: Opt(z.string()).describe("Description for the new list (used with list_title)."),
    f_sticky: Opt(z.number().int()).describe("Set to 1 to pin this discussion to the top."),
    f_private: Opt(z.number().int()).describe(
        "Set to 1 to make this discussion private to selected users."
    ),
    private_users: Opt(z.array(z.string())).describe(
        "User IDs allowed to view this discussion when f_private is 1."
    ),
    notifications: Opt(z.array(z.string())).describe("User IDs to notify about this discussion."),
    attached_ids: Opt(z.array(z.string())).describe(
        "IDs of previously uploaded files to attach to this discussion."
    )
});

export const EditDiscussionSchema = z.object({
    discussion_id: z.string().describe("ID of the discussion to edit."),
    title: Opt(z.string()).describe("New discussion title."),
    list_id: Opt(z.string()).describe("Move the discussion to this list ID."),
    list_title: Opt(z.string()).describe("Title for a new list to move the discussion into."),
    list_descr: Opt(z.string()).describe("Description for the new list (used with list_title)."),
    f_sticky: Opt(z.number().int()).describe(
        "Set to 1 to pin this discussion to the top; 0 to unpin."
    )
});

export const DeleteDiscussionSchema = z.object({
    discussion_id: z.string().describe("ID of the discussion to delete.")
});
