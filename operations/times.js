import { z } from "zod";
import { Opt, PaginationSchema } from "./schemas.js";

export const FetchTimesSchema = PaginationSchema.extend({
    project_id: z.string().describe("ID of the project whose time entries to fetch.")
});

export const FetchTimeSchema = z.object({
    time_id: z.string().describe("ID of the time entry to fetch.")
});

export const AddTimeSchema = z.object({
    description: Opt(z.string()).describe("Description of the work performed."),
    project_id: z.string().describe("ID of the project this time entry belongs to."),
    assigned_to_id: Opt(z.string()).describe(
        "User ID this time entry is logged for. Defaults to the current user."
    ),
    date: z.string().describe("Date the time was logged, e.g. 'YYYY-MM-DD'."),
    minutes_count: z.number().int().describe("Duration of the time entry, in minutes."),
    f_started: Opt(z.number().int()).describe(
        "Set to 1 to create this entry as a running timer (started, not yet stopped)."
    ),
    f_billed: Opt(z.number().int()).describe("Set to 1 to mark this time entry as billed.")
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
            "Action to perform: 'start' begins a running timer, 'stop' ends it, 'bill' marks the entry billed, 'unbill' reverts that."
        )
});
