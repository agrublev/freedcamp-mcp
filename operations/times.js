import { z } from "zod";
import { Opt, PaginationSchema } from "./schemas.js";

export const FetchTimesSchema = PaginationSchema.extend({ project_id: z.string() });

export const FetchTimeSchema = z.object({ time_id: z.string() });

export const AddTimeSchema = z.object({
  description: Opt(z.string()),
  project_id: z.string(),
  assigned_to_id: Opt(z.string()),
  date: z.string(),
  minutes_count: z.number().int(),
  f_started: Opt(z.number().int()),
  f_billed: Opt(z.number().int()),
});

export const EditTimeSchema = z.object({
  time_id: z.string(),
  description: Opt(z.string()),
  assigned_to_id: Opt(z.string()),
  date: Opt(z.string()),
  minutes_count: Opt(z.number().int()),
});

export const DeleteTimeSchema = z.object({ time_id: z.string() });

export const TimeActionSchema = z.object({
  time_id: z.string(),
  action: z.enum(["start", "stop", "bill", "unbill"]),
});
