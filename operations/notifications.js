import { z } from "zod";
import { Opt } from "./schemas.js";

export const FetchNotificationsByProjectSchema = z.object({ project_id: z.string() });

export const UpdateNotificationReadSchema = z.object({ uid: Opt(z.string()) });

export const EditNotificationsSchema = z.object({
  new_state: Opt(z.string()),
  items: z.array(z.record(z.string())),
});
