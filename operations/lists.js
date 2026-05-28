import { z } from "zod";
import { Opt } from "./schemas.js";

export const FetchListsSchema = z.object({
  project_id: z.string(),
  app_id: Opt(z.number().int()),
});

export const AddListSchema = z.object({
  app_id: Opt(z.number().int()),
  project_id: z.string(),
  title: z.string(),
  description: Opt(z.string()),
});

export const EditListSchema = z.object({
  app_id: Opt(z.number().int()),
  list_id: z.string(),
  title: z.string(),
  description: Opt(z.string()),
});

export const DeleteListSchema = z.object({
  app_id: Opt(z.number().int()),
  list_id: z.string(),
});
