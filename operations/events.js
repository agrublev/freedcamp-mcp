import { z } from "zod";
import { Opt } from "./schemas.js";

export const FetchEventsSchema = z.object({
    project_id: Opt(z.string()).describe(
        "Restrict results to this project ID. Omit to fetch events across all accessible projects."
    )
});

export const FetchEventSchema = z.object({
    event_id: z.string().describe("ID of the calendar event to fetch.")
});

export const AddEventSchema = z.object({
    project_id: z.string().describe("ID of the project this event belongs to."),
    title: z.string().describe("Event title."),
    description: Opt(z.string()).describe("Event description."),
    f_all_day: Opt(z.number().int()).describe(
        "Set to 1 for an all-day event; 0 for a timed event."
    ),
    start_date: z.string().describe("Event start date, e.g. 'YYYY-MM-DD'."),
    start_time: Opt(z.string()).describe(
        "Event start time, e.g. 'HH:mm'. Omit for all-day events."
    ),
    end_date: Opt(z.string()).describe("Event end date, e.g. 'YYYY-MM-DD'."),
    end_time: Opt(z.string()).describe("Event end time, e.g. 'HH:mm'. Omit for all-day events."),
    r_rule: Opt(z.string()).describe(
        "iCalendar RRULE string for recurring events, e.g. 'FREQ=WEEKLY;COUNT=10'."
    ),
    f_response_notify: Opt(z.number().int()).describe(
        "Set to 1 to notify the organizer when invitees respond."
    ),
    mixed_users: Opt(z.array(z.string())).describe("User IDs to invite to this event."),
    attached_ids: Opt(z.array(z.string())).describe(
        "IDs of previously uploaded files to attach to this event."
    )
});

export const EditEventSchema = z.object({
    event_id: z.string().describe("ID of the calendar event to edit."),
    title: Opt(z.string()).describe("New event title."),
    description: Opt(z.string()).describe("New event description."),
    f_all_day: Opt(z.number().int()).describe(
        "Set to 1 for an all-day event; 0 for a timed event."
    ),
    start_date: Opt(z.string()).describe("New start date, e.g. 'YYYY-MM-DD'."),
    start_time: Opt(z.string()).describe("New start time, e.g. 'HH:mm'."),
    end_date: Opt(z.string()).describe("New end date, e.g. 'YYYY-MM-DD'."),
    end_time: Opt(z.string()).describe("New end time, e.g. 'HH:mm'."),
    r_rule: Opt(z.string()).describe("iCalendar RRULE string for recurring events."),
    attached_ids: Opt(z.array(z.string())).describe(
        "IDs of previously uploaded files to attach to this event."
    )
});

export const DeleteEventSchema = z.object({
    event_id: z.string().describe("ID of the calendar event to delete.")
});
