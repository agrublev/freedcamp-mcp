import { z } from "zod";
import { Opt, PaginationSchema } from "./schemas.js";

export const FetchMilestonesSchema = PaginationSchema.extend({
    project_id: z.string().describe("ID of the project whose milestones to fetch.")
});

export const FetchMilestoneSchema = z.object({
    milestone_id: z.string().describe("ID of the milestone to fetch.")
});

export const AddMilestoneSchema = z.object({
    title: z.string().describe("Milestone title."),
    description: Opt(z.string()).describe("Milestone description."),
    project_id: z.string().describe("ID of the project this milestone belongs to."),
    priority: Opt(z.number().int()).describe("Priority: 0=none, 1=low, 2=medium, 3=high."),
    assigned_to_id: Opt(z.string()).describe("User ID to assign this milestone to."),
    due_date: Opt(z.string()).describe("Due date, e.g. 'YYYY-MM-DD'."),
    status: Opt(z.number().int()).describe(
        "Status: 0=not started, 1=completed, 2=in progress, 3=invalid, 4=review."
    ),
    start_date: Opt(z.string()).describe("Start date, e.g. 'YYYY-MM-DD'.")
});

export const EditMilestoneSchema = z.object({
    milestone_id: z.string().describe("ID of the milestone to edit."),
    title: Opt(z.string()).describe("New milestone title."),
    description: Opt(z.string()).describe("New milestone description."),
    priority: Opt(z.number().int()).describe("Priority: 0=none, 1=low, 2=medium, 3=high."),
    status: Opt(z.number().int()).describe(
        "Status: 0=not started, 1=completed, 2=in progress, 3=invalid, 4=review."
    ),
    assigned_to_id: Opt(z.string()).describe("User ID to reassign this milestone to."),
    due_date: Opt(z.string()).describe("New due date, e.g. 'YYYY-MM-DD'."),
    start_date: Opt(z.string()).describe("New start date, e.g. 'YYYY-MM-DD'.")
});

export const DeleteMilestoneSchema = z.object({
    milestone_id: z.string().describe("ID of the milestone to delete.")
});
