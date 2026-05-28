import { z } from "zod";
import { Opt, PaginationSchema } from "./schemas.js";

export const FetchTaskSchema = z.object({ task_id: z.string() });

export const FetchTasksSchema = PaginationSchema.extend({
  project_id: Opt(z.string()),
  filters: Opt(z.object({
    status: Opt(z.array(z.enum(["STATUS_NOT_STARTED","STATUS_COMPLETED","STATUS_IN_PROGRESS","STATUS_INVALID","STATUS_REVIEW"]))),
    assigned_to_id: Opt(z.array(z.string())),
    created_by_id: Opt(z.string()),
    due_date_from: Opt(z.string()),
    due_date_to: Opt(z.string()),
    created_date_from: Opt(z.string()),
    created_date_to: Opt(z.string()),
    f_with_archived: Opt(z.number().int()),
    list_status: Opt(z.string()),
    order_due_date: Opt(z.string()),
  })),
});

export const AddTaskSchema = z.object({
  title: z.string(),
  description: Opt(z.string()),
  project_id: z.string(),
  task_group_id: Opt(z.string()),
  priority: Opt(z.number().int()),
  assigned_to_id: Opt(z.string()),
  due_date: Opt(z.string()),
  status: Opt(z.number().int()),
  completed_date: Opt(z.string()),
  attached_ids: Opt(z.array(z.string())),
});

export const UpdateTaskSchema = z.object({
  task_id: z.string(),
  title: Opt(z.string()),
  description: Opt(z.string()),
  task_group_id: Opt(z.string()),
  status: Opt(z.number().int()),
  priority: Opt(z.number().int()),
  assigned_to_id: Opt(z.string()),
  due_date: Opt(z.string()),
});

export const DeleteTaskSchema = z.object({ task_id: z.string() });
