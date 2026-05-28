import { z } from "zod";
import { Opt, PaginationSchema } from "./schemas.js";

export const FetchWikisSchema = PaginationSchema.extend({
  project_id: z.string(),
  order_title: Opt(z.string()),
});

export const FetchWikiSchema = z.object({ wiki_id: z.string() });

export const AddWikiSchema = z.object({
  title: z.string(),
  description: Opt(z.string()),
  project_id: z.string(),
  list_id: Opt(z.string()),
  list_title: Opt(z.string()),
  list_descr: Opt(z.string()),
  f_private: Opt(z.number().int()),
  f_public: Opt(z.number().int()),
  private_users: Opt(z.array(z.string())),
  attached_ids: Opt(z.array(z.string())),
});

export const EditWikiSchema = z.object({
  wiki_id: z.string(),
  title: Opt(z.string()),
  description: Opt(z.string()),
  list_id: Opt(z.string()),
  list_title: Opt(z.string()),
  list_descr: Opt(z.string()),
  f_private: Opt(z.number().int()),
  f_public: Opt(z.number().int()),
  private_users: Opt(z.array(z.string())),
  attached_ids: Opt(z.array(z.string())),
  f_new_version: Opt(z.boolean()),
});

export const DeleteWikiSchema = z.object({ wiki_id: z.string() });

export const AddWikiVersionSchema = z.object({
  wiki_id: z.string(),
  title: Opt(z.string()),
  description: Opt(z.string()),
  attached_ids: Opt(z.array(z.string())),
});
