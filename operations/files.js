import { z } from "zod";
import { Opt } from "./schemas.js";

export const FetchFileSchema = z.object({
    file_id: z.string().describe("ID of the file to fetch metadata for.")
});

export const AddFileMetaSchema = z.object({
    project_id: Opt(z.string()).describe("ID of the project the file belongs to."),
    group_id: Opt(z.string()).describe("ID of the group the file belongs to."),
    application_id: Opt(z.number().int()).describe(
        "Freedcamp app ID the file is attached to, e.g. 2=Tasks, 13=Issue Tracker."
    ),
    item_id: Opt(z.string()).describe("ID of the item to attach the file to."),
    comment_id: Opt(z.string()).describe("ID of the comment to attach the file to."),
    temporary: Opt(z.number().int()).describe(
        "Set to 1 to create a temporary record; attach it later via attached_ids."
    )
});

const fileContentShape = {
    file_path: Opt(z.string()).describe(
        "Absolute path to a local file to upload. Provide this or content_base64."
    ),
    filename: Opt(z.string()).describe("Name to give the uploaded file."),
    mime_type: Opt(z.string()).describe(
        "MIME type of the file, e.g. 'image/png'. Defaults to application/octet-stream."
    ),
    content_base64: Opt(z.string()).describe(
        "Base64-encoded file contents. Provide this or file_path."
    )
};

const requireContent = (schema) =>
    schema.refine((v) => v.file_path || v.content_base64, {
        message: "Provide file_path or content_base64"
    });

export const UploadFileSchema = requireContent(
    z.object({
        ...fileContentShape,
        project_id: Opt(z.string()).describe("ID of the project the file belongs to."),
        group_id: Opt(z.string()).describe("ID of the group the file belongs to."),
        application_id: Opt(z.number().int()).describe(
            "Freedcamp app ID the file is attached to, e.g. 2=Tasks, 13=Issue Tracker."
        ),
        item_id: Opt(z.string()).describe("ID of the item to attach the file to."),
        comment_id: Opt(z.string()).describe("ID of the comment to attach the file to."),
        temporary: Opt(z.number().int()).describe(
            "Set to 1 to upload as a temporary file; attach it later via attached_ids."
        )
    })
);

export const DeleteFileSchema = z.object({
    file_id: z.string().describe("ID of the file to delete.")
});

export const UploadAvatarSchema = requireContent(z.object({ ...fileContentShape }));
