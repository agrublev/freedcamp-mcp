import { z } from "zod";
import { Opt } from "./schemas.js";

export const FetchProjectSchema = z.object({ project_id: z.string() });

export const AddProjectSchema = z.object({
  project_name: z.string(),
  project_description: Opt(z.string()),
  project_color: Opt(z.string()),
  todo_view_type: Opt(z.string()),
  usage_type: Opt(z.number().int()),
  group_id: Opt(z.string()),
  group_name: Opt(z.string()),
});

export const EditProjectSchema = z.object({
  project_id: z.string(),
  project_name: Opt(z.string()),
  project_color: Opt(z.string()),
  group_id: Opt(z.string()),
  cs_tpl_id: Opt(z.string()),
});

export const LeaveProjectSchema = z.object({ membership_id: z.string() });

export const DeleteProjectSchema = z.object({ project_id: z.string() });
