import { z } from "zod";
import { Opt } from "./schemas.js";

export const AddCommentSchema = z.object({
  item_id: z.string(),
  app_id: z.number().int(),
  description: z.string(),
  attached_ids: Opt(z.array(z.string())),
});

export const EditCommentSchema = z.object({
  comment_id: z.string(),
  description: z.string(),
});

export const DeleteCommentSchema = z.object({ comment_id: z.string() });
