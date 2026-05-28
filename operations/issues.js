import { z } from "zod";
import { Opt, PaginationSchema } from "./schemas.js";

export const FetchIssuesSchema = PaginationSchema.extend({ project_id: z.string() });

export const FetchIssueSchema = z.object({ issue_id: z.string() });

export const AddIssueSchema = z.object({
  title: z.string(),
  description: Opt(z.string()),
  project_id: z.string(),
  priority: Opt(z.number().int()),
  status: Opt(z.number().int()),
  type: Opt(z.number().int()),
  assigned_to_id: Opt(z.string()),
  due_date: Opt(z.string()),
  closer_id: Opt(z.string()),
  attached_ids: Opt(z.array(z.string())),
});

export const EditIssueSchema = z.object({
  issue_id: z.string(),
  title: Opt(z.string()),
  description: Opt(z.string()),
  priority: Opt(z.number().int()),
  status: Opt(z.number().int()),
  type: Opt(z.number().int()),
  assigned_to_id: Opt(z.string()),
  due_date: Opt(z.string()),
  closer_id: Opt(z.string()),
  attached_ids: Opt(z.array(z.string())),
});

export const DeleteIssueSchema = z.object({ issue_id: z.string() });
