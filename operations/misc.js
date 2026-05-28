import { z } from "zod";
import { Opt } from "./schemas.js";

export const FetchLinkedItemsSchema = z.object({
  app_id: z.number().int(),
  item_id: z.string(),
});

export const AddLinkedItemsSchema = z.object({
  app_id: z.number().int(),
  item_id: z.string(),
  links: z.record(z.array(z.string())),
});

export const FetchOverviewSchema = z.object({ project_id: z.string() });

export const FetchCfTemplatesSchema = z.object({ module_id: Opt(z.number().int()) });

export const FetchCalendarItemsSchema = z.object({ project_id: Opt(z.string()) });

export const FavoriteProjectSchema = z.object({ project_id: z.string() });

export const RespondInvitationSchema = z.object({
  invitation_id: z.string(),
  action: Opt(z.string()),
  response: Opt(z.string()),
  project_id: Opt(z.string()),
});
