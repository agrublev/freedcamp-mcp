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
        "User ID this time entry is logged for, or '-1' for everyone. The Freedcamp API " +
            "requires this field, so it defaults to '-1' (assigned to everyone) when omitted."
    ),
    date: z.string().describe("Date the time was logged, e.g. 'YYYY-MM-DD'."),
    minutes_count: z.number().int().describe("Duration of the time entry, in minutes."),
    f_started: Opt(BoolFlag).describe(
        "Set to 1 (or true) to create this entry as a running timer (started, not yet stopped)."
    ),
    f_billed: Opt(BoolFlag).describe("Set to 1 (or true) to mark this time entry as billed.")
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
            "Action to perform: 'start' begins a running timer, 'stop' ends it, 'bill' marks the entry billed, 'unbill' reverts that. The response includes a `warning` field if the entry's state did not actually change (e.g. starting an already-running timer)."
        )
});
