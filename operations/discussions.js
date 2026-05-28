import { z } from "zod";
import { Opt, PaginationSchema } from "./schemas.js";

export const FetchDiscussionsSchema = PaginationSchema.extend({ project_id: z.string() });

export const FetchDiscussionSchema = z.object({ discussion_id: z.string() });

export const AddDiscussionSchema = z.object({
  title: z.string(),
  description: Opt(z.string()),
  project_id: z.string(),
  list_id: Opt(z.string()),
  list_title: Opt(z.string()),
  list_descr: Opt(z.string()),
  f_sticky: Opt(z.number().int()),
  f_private: Opt(z.number().int()),
  private_users: Opt(z.array(z.string())),
  notifications: Opt(z.array(z.string())),
  attached_ids: Opt(z.array(z.string())),
});

export const EditDiscussionSchema = z.object({
  discussion_id: z.string(),
  title: Opt(z.string()),
  list_id: Opt(z.string()),
  list_title: Opt(z.string()),
  list_descr: Opt(z.string()),
  f_sticky: Opt(z.number().int()),
});

export const DeleteDiscussionSchema = z.object({ discussion_id: z.string() });
