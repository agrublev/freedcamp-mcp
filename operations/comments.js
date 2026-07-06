import { z } from "zod";
import { Opt } from "./schemas.js";

export const AddCommentSchema = z.object({
    item_id: z.string().describe("ID of the item (task, issue, discussion, etc.) to comment on."),
    app_id: z
        .number()
        .int()
        .describe(
            "Freedcamp app ID that owns the item (e.g. 2=Tasks, 13=Issue Tracker, 3=Discussions)."
        ),
    description: z.string().describe("Comment body text."),
    attached_ids: Opt(z.array(z.string())).describe(
        "IDs of previously uploaded files to attach to this comment."
    )
});

export const EditCommentSchema = z.object({
    comment_id: z.string().describe("ID of the comment to edit."),
    description: z.string().describe("New comment body text.")
});

export const DeleteCommentSchema = z.object({
    comment_id: z.string().describe("ID of the comment to delete.")
});
