import { z } from "zod";
import { Opt, PaginationSchema } from "./schemas.js";

export const FetchWikisSchema = PaginationSchema.extend({
    project_id: z.string().describe("ID of the project whose wiki pages to fetch."),
    order_title: Opt(z.string()).describe("Sort order by title: 'asc' or 'desc' (default 'asc').")
});

export const FetchWikiSchema = z.object({
    wiki_id: z.string().describe("ID of the wiki page to fetch.")
});

export const AddWikiSchema = z.object({
    title: z.string().describe("Wiki page title."),
    description: Opt(z.string()).describe("Wiki page content (HTML or plain text)."),
    project_id: z.string().describe("ID of the project this wiki page belongs to."),
    list_id: Opt(z.string()).describe(
        "ID of an existing list (wiki folder) to file this page under."
    ),
    list_title: Opt(z.string()).describe(
        "Title for a new list (wiki folder) to create and file this page under."
    ),
    list_descr: Opt(z.string()).describe("Description for the new list (used with list_title)."),
    f_private: Opt(z.number().int()).describe(
        "Set to 1 to make this page private to selected users."
    ),
    f_public: Opt(z.number().int()).describe(
        "Set to 1 to make this page publicly viewable without login."
    ),
    private_users: Opt(z.array(z.string())).describe(
        "User IDs allowed to view this page when f_private is 1."
    ),
    attached_ids: Opt(z.array(z.string())).describe(
        "IDs of previously uploaded files to attach to this page."
    )
});

export const EditWikiSchema = z.object({
    wiki_id: z.string().describe("ID of the wiki page to edit."),
    title: Opt(z.string()).describe("New wiki page title."),
    description: Opt(z.string()).describe("New wiki page content (HTML or plain text)."),
    list_id: Opt(z.string()).describe("Move the page to this list (wiki folder) ID."),
    list_title: Opt(z.string()).describe("Title for a new list to move the page into."),
    list_descr: Opt(z.string()).describe("Description for the new list (used with list_title)."),
    f_private: Opt(z.number().int()).describe(
        "Set to 1 to make this page private to selected users."
    ),
    f_public: Opt(z.number().int()).describe(
        "Set to 1 to make this page publicly viewable without login."
    ),
    private_users: Opt(z.array(z.string())).describe(
        "User IDs allowed to view this page when f_private is 1."
    ),
    attached_ids: Opt(z.array(z.string())).describe(
        "IDs of previously uploaded files to attach to this page."
    ),
    f_new_version: Opt(z.boolean()).describe(
        "Set to true to save this edit as a new version instead of overwriting the current one."
    )
});

export const DeleteWikiSchema = z.object({
    wiki_id: z.string().describe("ID of the wiki page to delete.")
});

export const AddWikiVersionSchema = z.object({
    wiki_id: z.string().describe("ID of the wiki page to add a new version to."),
    title: Opt(z.string()).describe("Title for the new version."),
    description: Opt(z.string()).describe("Content for the new version (HTML or plain text)."),
    attached_ids: Opt(z.array(z.string())).describe(
        "IDs of previously uploaded files to attach to this version."
    )
});
