import { z } from "zod";
import { Opt } from "./schemas.js";

export const FetchFileSchema = z.object({
    file_id: z.string().describe("ID of the file to fetch metadata for.")
});

export const AddFileMetaSchema = z.object({
    project_id: Opt(z.string()).describe("ID of the project this file belongs to."),
    group_id: Opt(z.string()).describe(
        "ID of the group this file belongs to (alternative to project_id)."
    ),
    application_id: z
        .number()
        .int()
        .describe("Freedcamp app ID of the item this file is attached to, e.g. 2=Tasks, 14=Wikis."),
    item_id: Opt(z.string()).describe("ID of the item this file is attached to."),
    comment_id: Opt(z.string()).describe(
        "ID of the comment this file is attached to, if applicable."
    ),
    temporary: Opt(z.boolean()).describe(
        "Set to true to create a temporary file record not yet linked to a permanent item."
    )
});

export const UploadFileSchema = z.object({
    file_path: Opt(z.string()).describe(
        "Absolute local file path to upload. Provide this or content_base64."
    ),
    filename: Opt(z.string()).describe(
        "Filename to store; defaults to the basename of file_path or 'file'."
    ),
    mime_type: Opt(z.string()).describe(
        "MIME type of the file, e.g. 'image/png'. Defaults to 'application/octet-stream'."
    ),
    content_base64: Opt(z.string()).describe(
        "Base64-encoded file content. Provide this or file_path."
    ),
    project_id: Opt(z.string()).describe("ID of the project this file belongs to."),
    group_id: Opt(z.string()).describe(
        "ID of the group this file belongs to (alternative to project_id)."
    ),
    application_id: Opt(z.number().int()).describe(
        "Freedcamp app ID of the item this file is attached to, e.g. 2=Tasks, 14=Wikis."
    ),
    item_id: Opt(z.string()).describe("ID of the item this file is attached to."),
    comment_id: Opt(z.string()).describe(
        "ID of the comment this file is attached to, if applicable."
    ),
    temporary: Opt(z.boolean()).describe(
        "Set to true to create a temporary file record not yet linked to a permanent item."
    )
});

export const DeleteFileSchema = z.object({
    file_id: z.string().describe("ID of the file to delete.")
});

export const UploadAvatarSchema = z.object({
    file_path: Opt(z.string()).describe(
        "Absolute local file path of the avatar image to upload. Provide this or content_base64."
    ),
    filename: Opt(z.string()).describe(
        "Filename to store; defaults to the basename of file_path or 'avatar'."
    ),
    mime_type: Opt(z.string()).describe(
        "MIME type of the image, e.g. 'image/png'. Defaults to 'application/octet-stream'."
    ),
    content_base64: Opt(z.string()).describe(
        "Base64-encoded image content. Provide this or file_path."
    )
});
