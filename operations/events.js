import { z } from "zod";
import { Opt } from "./schemas.js";

export const FetchEventsSchema = z.object({ project_id: Opt(z.string()) });

export const FetchEventSchema = z.object({ event_id: z.string() });

export const AddEventSchema = z.object({
  project_id: z.string(),
  title: z.string(),
  description: Opt(z.string()),
  f_all_day: Opt(z.number().int()),
  start_date: z.string(),
  start_time: Opt(z.string()),
  end_date: Opt(z.string()),
  end_time: Opt(z.string()),
  r_rule: Opt(z.string()),
  f_response_notify: Opt(z.number().int()),
  mixed_users: Opt(z.array(z.string())),
  attached_ids: Opt(z.array(z.string())),
});

export const EditEventSchema = z.object({
  event_id: z.string(),
  title: Opt(z.string()),
  description: Opt(z.string()),
  f_all_day: Opt(z.number().int()),
  start_date: Opt(z.string()),
  start_time: Opt(z.string()),
  end_date: Opt(z.string()),
  end_time: Opt(z.string()),
  r_rule: Opt(z.string()),
  attached_ids: Opt(z.array(z.string())),
});

export const DeleteEventSchema = z.object({ event_id: z.string() });
