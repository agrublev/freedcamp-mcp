import { z } from "zod";
import { Opt } from "./schemas.js";

export const FetchListsSchema = z.object({
    project_id: z.string().describe("ID of the project whose lists to fetch."),
    app_id: Opt(z.number().int()).describe(
        "Freedcamp app ID the lists belong to (default 2 = Tasks)."
    )
});

export const AddListSchema = z.object({
    app_id: Opt(z.number().int()).describe(
        "Freedcamp app ID to create the list under (default 2 = Tasks)."
    ),
    project_id: z.string().describe("ID of the project this list belongs to."),
    title: z.string().describe("List title."),
    description: Opt(z.string()).describe("List description.")
});

export const EditListSchema = z.object({
    app_id: Opt(z.number().int()).describe(
        "Freedcamp app ID the list belongs to (default 2 = Tasks)."
    ),
    list_id: z.string().describe("ID of the list to edit."),
    title: z.string().describe("New list title."),
    description: Opt(z.string()).describe("New list description.")
});

export const DeleteListSchema = z.object({
    app_id: Opt(z.number().int()).describe(
        "Freedcamp app ID the list belongs to (default 2 = Tasks)."
    ),
    list_id: z.string().describe("ID of the list to delete.")
});
