import { z } from "zod";
import { Opt, PaginationSchema } from "./schemas.js";

// CRM Tasks
export const FetchCrmTasksSchema = PaginationSchema.extend({ group_id: z.string() });

export const FetchCrmTaskSchema = z.object({ crm_task_id: z.string() });

export const AddCrmTaskSchema = z.object({
  title: z.string(),
  description: Opt(z.string()),
  group_id: z.string(),
  type: Opt(z.number().int()),
  contact_title: Opt(z.string()),
  f_private: Opt(z.number().int()),
  assigned_to_id: Opt(z.string()),
  due_date: Opt(z.string()),
});

export const EditCrmTaskSchema = z.object({
  crm_task_id: z.string(),
  title: Opt(z.string()),
  description: Opt(z.string()),
  status: Opt(z.number().int()),
  type: Opt(z.number().int()),
  contact_title: Opt(z.string()),
  f_private: Opt(z.number().int()),
  assigned_to_id: Opt(z.string()),
  due_date: Opt(z.string()),
});

export const DeleteCrmTaskSchema = z.object({ crm_task_id: z.string() });

// CRM Calls
export const FetchCrmCallsSchema = PaginationSchema.extend({ group_id: z.string() });

export const FetchCrmCallSchema = z.object({ crm_call_id: z.string() });

export const AddCrmCallSchema = z.object({
  title: z.string(),
  description: Opt(z.string()),
  group_id: z.string(),
  f_inbound: Opt(z.number().int()),
  contact_title: Opt(z.string()),
  assigned_to_id: Opt(z.string()),
  due_date: Opt(z.string()),
  duration: Opt(z.number().int()),
});

export const EditCrmCallSchema = z.object({
  crm_call_id: z.string(),
  title: Opt(z.string()),
  description: Opt(z.string()),
  f_inbound: Opt(z.number().int()),
  contact_title: Opt(z.string()),
  assigned_to_id: Opt(z.string()),
  due_date: Opt(z.string()),
  duration: Opt(z.number().int()),
});

export const DeleteCrmCallSchema = z.object({ crm_call_id: z.string() });
