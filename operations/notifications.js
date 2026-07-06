import { z } from "zod";
import { Opt } from "./schemas.js";

export const FetchNotificationsByProjectSchema = z.object({
    project_id: z.string().describe("ID of the project whose notifications to fetch.")
});

export const UpdateNotificationReadSchema = z.object({
    uid: Opt(z.string()).describe("Unique key (item_u_key) of the notification to mark as read.")
});

export const EditNotificationsSchema = z.object({
    new_state: Opt(z.string()).describe(
        "New state to apply, e.g. 'read' or 'unread' (default 'read')."
    ),
    items: z
        .array(z.record(z.string()))
        .describe("Notification items to update, each identified by an 'item_u_key' field.")
});
