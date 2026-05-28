import { z } from "zod";

// ── Primitives ─────────────────────────────────────────────────────────────

export const TimestampSchema = z.union([z.string(), z.number()]).nullable().optional();

// ── User ───────────────────────────────────────────────────────────────────

export const UserSchema = z.object({
  id: z.union([z.string(), z.number()]),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().optional(),
  avatar: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  user_id: z.union([z.string(), z.number()]).optional(),
}).passthrough();

// ── Session ────────────────────────────────────────────────────────────────

export const SessionSchema = z.object({
  api_token: z.string().nullable().optional(),
  token: z.string().nullable().optional(),
  user_id: z.union([z.string(), z.number()]).nullable().optional(),
}).passthrough();

// ── Project ────────────────────────────────────────────────────────────────

export const ProjectSchema = z.object({
  id: z.union([z.string(), z.number()]),
  project_name: z.string(),
  project_description: z.string().nullable().optional(),
  project_color: z.string().nullable().optional(),
  group_id: z.union([z.string(), z.number()]).nullable().optional(),
  group_name: z.string().nullable().optional(),
  created_ts: TimestampSchema,
  updated_ts: TimestampSchema,
  usage_type: z.number().optional(),
  todo_view_type: z.string().nullable().optional(),
}).passthrough();

// ── Task ───────────────────────────────────────────────────────────────────

export const TaskSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  description: z.string().nullable().optional(),
  project_id: z.union([z.string(), z.number()]),
  task_group_id: z.union([z.string(), z.number()]).nullable().optional(),
  priority: z.number().int().nullable().optional(),
  assigned_to_id: z.union([z.string(), z.number()]).nullable().optional(),
  created_by_id: z.union([z.string(), z.number()]).nullable().optional(),
  status: z.number().int().nullable().optional(),
  due_date: TimestampSchema,
  completed_date: TimestampSchema,
  created_ts: TimestampSchema,
  updated_ts: TimestampSchema,
}).passthrough();

export const TaskListResponseSchema = z.object({
  tasks: z.array(TaskSchema),
  meta: z.object({
    total: z.number().optional(),
    limit: z.number().optional(),
    offset: z.number().optional(),
  }).passthrough().optional(),
});

// ── List ───────────────────────────────────────────────────────────────────

export const ListSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  description: z.string().nullable().optional(),
  project_id: z.union([z.string(), z.number()]),
  app_id: z.number().optional(),
  created_ts: TimestampSchema,
}).passthrough();

// ── Comment ────────────────────────────────────────────────────────────────

export const CommentSchema = z.object({
  id: z.union([z.string(), z.number()]),
  item_id: z.union([z.string(), z.number()]),
  app_id: z.number(),
  description: z.string(),
  user_id: z.union([z.string(), z.number()]).nullable().optional(),
  created_ts: TimestampSchema,
  updated_ts: TimestampSchema,
  attached_ids: z.array(z.string()).optional(),
}).passthrough();

// ── Calendar Event ─────────────────────────────────────────────────────────

export const EventSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  description: z.string().nullable().optional(),
  project_id: z.union([z.string(), z.number()]),
  f_all_day: z.number().int().optional(),
  start_date: z.union([z.string(), z.number()]).nullable().optional(),
  start_time: z.string().nullable().optional(),
  end_date: z.union([z.string(), z.number()]).nullable().optional(),
  end_time: z.string().nullable().optional(),
  r_rule: z.string().nullable().optional(),
  created_ts: TimestampSchema,
}).passthrough();

// ── Discussion ─────────────────────────────────────────────────────────────

export const DiscussionSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  description: z.string().nullable().optional(),
  project_id: z.union([z.string(), z.number()]),
  list_id: z.union([z.string(), z.number()]).nullable().optional(),
  f_sticky: z.number().int().optional(),
  f_private: z.number().int().optional(),
  created_by_id: z.union([z.string(), z.number()]).nullable().optional(),
  created_ts: TimestampSchema,
  updated_ts: TimestampSchema,
}).passthrough();

// ── Issue (Freedcamp Issue Tracker) ────────────────────────────────────────

export const IssueSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  description: z.string().nullable().optional(),
  project_id: z.union([z.string(), z.number()]),
  priority: z.number().int().nullable().optional(),
  status: z.number().int().nullable().optional(),
  type: z.number().int().nullable().optional(),
  assigned_to_id: z.union([z.string(), z.number()]).nullable().optional(),
  closer_id: z.union([z.string(), z.number()]).nullable().optional(),
  due_date: TimestampSchema,
  created_ts: TimestampSchema,
  updated_ts: TimestampSchema,
}).passthrough();

// ── Milestone ──────────────────────────────────────────────────────────────

export const MilestoneSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  description: z.string().nullable().optional(),
  project_id: z.union([z.string(), z.number()]),
  priority: z.number().int().nullable().optional(),
  status: z.number().int().nullable().optional(),
  assigned_to_id: z.union([z.string(), z.number()]).nullable().optional(),
  due_date: TimestampSchema,
  start_date: TimestampSchema,
  created_ts: TimestampSchema,
}).passthrough();

// ── Time Entry ─────────────────────────────────────────────────────────────

export const TimeEntrySchema = z.object({
  id: z.union([z.string(), z.number()]),
  description: z.string().nullable().optional(),
  project_id: z.union([z.string(), z.number()]),
  assigned_to_id: z.union([z.string(), z.number()]).nullable().optional(),
  date: z.union([z.string(), z.number()]),
  minutes_count: z.number().int(),
  f_started: z.number().int().optional(),
  f_billed: z.number().int().optional(),
  created_ts: TimestampSchema,
}).passthrough();

// ── Wiki ───────────────────────────────────────────────────────────────────

export const WikiSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  description: z.string().nullable().optional(),
  project_id: z.union([z.string(), z.number()]),
  list_id: z.union([z.string(), z.number()]).nullable().optional(),
  f_private: z.number().int().optional(),
  f_public: z.number().int().optional(),
  created_by_id: z.union([z.string(), z.number()]).nullable().optional(),
  created_ts: TimestampSchema,
  updated_ts: TimestampSchema,
}).passthrough();

// ── CRM Task ───────────────────────────────────────────────────────────────

export const CrmTaskSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  description: z.string().nullable().optional(),
  group_id: z.union([z.string(), z.number()]),
  type: z.number().int().nullable().optional(),
  status: z.number().int().nullable().optional(),
  contact_title: z.string().nullable().optional(),
  f_private: z.number().int().optional(),
  assigned_to_id: z.union([z.string(), z.number()]).nullable().optional(),
  due_date: TimestampSchema,
  created_ts: TimestampSchema,
}).passthrough();

// ── CRM Call ───────────────────────────────────────────────────────────────

export const CrmCallSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  description: z.string().nullable().optional(),
  group_id: z.union([z.string(), z.number()]),
  f_inbound: z.number().int().nullable().optional(),
  contact_title: z.string().nullable().optional(),
  assigned_to_id: z.union([z.string(), z.number()]).nullable().optional(),
  due_date: TimestampSchema,
  duration: z.number().int().nullable().optional(),
  created_ts: TimestampSchema,
}).passthrough();

// ── Group ──────────────────────────────────────────────────────────────────

export const GroupSchema = z.object({
  id: z.union([z.string(), z.number()]),
  group_name: z.string().optional(),
  title: z.string().optional(),
  created_ts: TimestampSchema,
}).passthrough();

// ── Notification ───────────────────────────────────────────────────────────

export const NotificationSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  item_u_key: z.string().optional(),
  state: z.string().optional(),
  project_id: z.union([z.string(), z.number()]).nullable().optional(),
  app_id: z.number().nullable().optional(),
  created_ts: TimestampSchema,
}).passthrough();

// ── Invitation ─────────────────────────────────────────────────────────────

export const InvitationSchema = z.object({
  id: z.union([z.string(), z.number()]),
  project_id: z.union([z.string(), z.number()]).nullable().optional(),
  email: z.string().nullable().optional(),
  created_ts: TimestampSchema,
}).passthrough();

// ── Generic API response envelope ─────────────────────────────────────────

export const ApiResponseSchema = z.object({
  data: z.unknown().optional(),
  msg: z.string().optional(),
  status: z.union([z.string(), z.number()]).optional(),
}).passthrough();
