import { z } from "zod";
import { Opt, PaginationSchema } from "./schemas.js";

export const FetchMilestonesSchema = PaginationSchema.extend({ project_id: z.string() });

export const FetchMilestoneSchema = z.object({ milestone_id: z.string() });

export const AddMilestoneSchema = z.object({
  title: z.string(),
  description: Opt(z.string()),
  project_id: z.string(),
  priority: Opt(z.number().int()),
  assigned_to_id: Opt(z.string()),
  due_date: Opt(z.string()),
  status: Opt(z.number().int()),
  start_date: Opt(z.string()),
});

export const EditMilestoneSchema = z.object({
  milestone_id: z.string(),
  title: Opt(z.string()),
  description: Opt(z.string()),
  priority: Opt(z.number().int()),
  status: Opt(z.number().int()),
  assigned_to_id: Opt(z.string()),
  due_date: Opt(z.string()),
  start_date: Opt(z.string()),
});

export const DeleteMilestoneSchema = z.object({ milestone_id: z.string() });
