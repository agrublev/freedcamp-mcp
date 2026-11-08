import { z } from "zod";
import { Opt, PaginationSchema } from "./schemas.js";

export const FetchTimesSchema = PaginationSchema.extend({
    project_id: z.string().describe("ID of the project whose time entries to fetch.")
});

export const FetchTimeSchema = z.object({
    time_id: z.string().describe("ID of the time entry to fetch.")
});

// Accepts 1/0 or true/false and normalizes to the 1/0 integer the API expects.
const BoolFlag = z
    .union([z.boolean(), z.number().int().min(0).max(1)])
    .transform((v) => (v === true ? 1 : v === false ? 0 : v));

export const AddTimeSchema = z.object({
    description: Opt(z.string()).describe("Description of the work performed."),
    project_id: z.string().describe("ID of the project this time entry belongs to."),
    assigned_to_id: Opt(z.string()).describe(
        "User ID this time entry is logged for. The Freedcamp API requires this field; when " +
            "omitted it defaults to the authenticated user. Pass a different user ID only to log " +
            "time for someone else."
    ),
    date: z.string().describe("Date the time was logged, e.g. 'YYYY-MM-DD'."),
    minutes_count: z.number().int().describe("Duration of the time entry, in minutes."),
    f_started: Opt(BoolFlag).describe(
        "Set to 1 (or true) to create this entry as a running timer (started, not yet stopped)."
    ),
    f_billed: Opt(BoolFlag).describe("Set to 1 (or true) to mark this time entry as billed."),
    link_item_id: Opt(z.string()).describe(
        "ID of the item to link this time entry to (e.g. a task ID), so the time shows up on " +
            "that item. Use together with link_app_id."
    ),
    link_app_id: Opt(z.string()).describe(
        "App ID of the linked item: '2' = Tasks, '13' = Issue Tracker. Required when " +
            "link_item_id is set."
    )
}).refine((v) => !v.link_item_id || !!v.link_app_id, {
    message: "link_app_id is required when link_item_id is set (e.g. '2' for a task).",
    path: ["link_app_id"]
});

export const EditTimeSchema = z.object({
    time_id: z.string().describe("ID of the time entry to edit."),
    description: Opt(z.string()).describe("New description of the work performed."),
    assigned_to_id: Opt(z.string()).describe("Reassign this time entry to this user ID."),
    date: Opt(z.string()).describe("New date, e.g. 'YYYY-MM-DD'."),
    minutes_count: Opt(z.number().int()).describe("New duration in minutes.")
});

export const DeleteTimeSchema = z.object({
    time_id: z.string().describe("ID of the time entry to delete.")
});

export const TimeActionSchema = z.object({
    time_id: z.string().describe("ID of the time entry to act on."),
    action: z
        .enum(["start", "stop", "bill", "unbill"])
        .describe(
            "Action to perform: 'start' begins a running timer, 'stop' ends it, 'bill' marks the entry billed, 'unbill' reverts that. The entry's state is compared before and after the action; if nothing actually changed (e.g. starting an already-running timer), the tool call fails with isError:true rather than reporting a false success."
        )
});
