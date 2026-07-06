import { z } from "zod";
import { Opt, PaginationSchema } from "./schemas.js";

// CRM Tasks
export const FetchCrmTasksSchema = PaginationSchema.extend({
    group_id: z.string().describe("ID of the group (CRM workspace) whose CRM tasks to fetch.")
});

export const FetchCrmTaskSchema = z.object({
    crm_task_id: z.string().describe("ID of the CRM task to fetch.")
});

export const AddCrmTaskSchema = z.object({
    title: z.string().describe("CRM task title."),
    description: Opt(z.string()).describe("CRM task description."),
    group_id: z.string().describe("ID of the group (CRM workspace) this task belongs to."),
    type: Opt(z.number().int()).describe(
        "CRM task type ID (Freedcamp-defined, e.g. call/meeting/to-do)."
    ),
    contact_title: Opt(z.string()).describe("Name of the CRM contact this task relates to."),
    f_private: Opt(z.number().int()).describe("Set to 1 to make this CRM task private."),
    assigned_to_id: Opt(z.string()).describe("User ID to assign this CRM task to."),
    due_date: Opt(z.string()).describe("Due date, e.g. 'YYYY-MM-DD'.")
});

export const EditCrmTaskSchema = z.object({
    crm_task_id: z.string().describe("ID of the CRM task to edit."),
    title: Opt(z.string()).describe("New CRM task title."),
    description: Opt(z.string()).describe("New CRM task description."),
    status: Opt(z.number().int()).describe("CRM task status ID."),
    type: Opt(z.number().int()).describe(
        "CRM task type ID (Freedcamp-defined, e.g. call/meeting/to-do)."
    ),
    contact_title: Opt(z.string()).describe("Name of the CRM contact this task relates to."),
    f_private: Opt(z.number().int()).describe("Set to 1 to make this CRM task private."),
    assigned_to_id: Opt(z.string()).describe("User ID to reassign this CRM task to."),
    due_date: Opt(z.string()).describe("New due date, e.g. 'YYYY-MM-DD'.")
});

export const DeleteCrmTaskSchema = z.object({
    crm_task_id: z.string().describe("ID of the CRM task to delete.")
});

// CRM Calls
export const FetchCrmCallsSchema = PaginationSchema.extend({
    group_id: z.string().describe("ID of the group (CRM workspace) whose CRM calls to fetch.")
});

export const FetchCrmCallSchema = z.object({
    crm_call_id: z.string().describe("ID of the CRM call to fetch.")
});

export const AddCrmCallSchema = z.object({
    title: z.string().describe("CRM call title/subject."),
    description: Opt(z.string()).describe("Notes about the call."),
    group_id: z.string().describe("ID of the group (CRM workspace) this call belongs to."),
    f_inbound: Opt(z.number().int()).describe("Set to 1 if the call was inbound; 0 for outbound."),
    contact_title: Opt(z.string()).describe("Name of the CRM contact this call was with."),
    assigned_to_id: Opt(z.string()).describe("User ID who logged/owns this call."),
    due_date: Opt(z.string()).describe(
        "Date the call occurred or is scheduled, e.g. 'YYYY-MM-DD'."
    ),
    duration: Opt(z.number().int()).describe("Call duration in minutes.")
});

export const EditCrmCallSchema = z.object({
    crm_call_id: z.string().describe("ID of the CRM call to edit."),
    title: Opt(z.string()).describe("New CRM call title/subject."),
    description: Opt(z.string()).describe("New notes about the call."),
    f_inbound: Opt(z.number().int()).describe("Set to 1 if the call was inbound; 0 for outbound."),
    contact_title: Opt(z.string()).describe("Name of the CRM contact this call was with."),
    assigned_to_id: Opt(z.string()).describe("User ID who logged/owns this call."),
    due_date: Opt(z.string()).describe("New call date, e.g. 'YYYY-MM-DD'."),
    duration: Opt(z.number().int()).describe("New call duration in minutes.")
});

export const DeleteCrmCallSchema = z.object({
    crm_call_id: z.string().describe("ID of the CRM call to delete.")
});
