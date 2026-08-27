import { z } from "zod";
import { Opt } from "./schemas.js";

export const FetchLinkedItemsSchema = z.object({
    app_id: z
        .number()
        .int()
        .describe("Freedcamp app ID that owns the item, e.g. 2=Tasks, 13=Issue Tracker."),
    item_id: z.string().describe("ID of the item whose links to fetch.")
});

export const AddLinkedItemsSchema = z.object({
    app_id: z
        .number()
        .int()
        .describe("Freedcamp app ID that owns the source item, e.g. 2=Tasks, 13=Issue Tracker."),
    item_id: z.string().describe("ID of the source item to link from."),
    links: z
        .record(z.array(z.string()))
        .describe(
            "Map of target app ID (as a string key, e.g. '2') to an array of item IDs to link to."
        )
});

export const FetchOverviewSchema = z.object({
    project_id: z.string().describe("ID of the project whose overview to fetch.")
});

export const FetchCfTemplatesSchema = z.object({
    module_id: Opt(z.number().int()).describe(
        "Freedcamp app ID to fetch custom-field templates for (default 2 = Tasks)."
    )
});

// One custom field definition as accepted by the custom-field templates API
// (api_docs/swagger.json → CfTemplateCreate.fields[]).
const CfTemplateFieldInput = z.object({
    title: Opt(z.string()).describe("Label shown for this custom field."),
    type: z.enum(["text", "textarea", "date", "number", "currency", "dd", "checkbox", "separator"]).describe(
        "Field type: text, textarea, date, number, currency, dd (dropdown), checkbox, or separator."
    ),
    f_required: Opt(z.boolean()).describe("Whether this field must be filled in."),
    cf_order: Opt(z.number().int()).describe("Display order of this field within the template."),
    currency_code: Opt(z.string()).describe(
        "ISO currency code, required when type is 'currency' (e.g. 'USD')."
    ),
    dd_options: Opt(
        z.array(
            z.object({
                option_id: Opt(z.number().int()).describe("Stable id of this dropdown option."),
                title: Opt(z.string()).describe("Label of this dropdown option."),
                f_default: Opt(z.boolean()).describe("Whether this option is the default choice.")
            })
        )
    ).describe("Choices for a dropdown ('dd') field, in display order.")
});

export const AddCfTemplateSchema = z.object({
    title: z.string().describe("Name of the custom field template."),
    module_id: z.number().int().describe(
        "Freedcamp app ID the template applies to: 2=Tasks, 13=Issue Tracker, 37=CRM."
    ),
    owner_id: Opt(z.string()).describe("Owner user ID for the template; defaults to the current user."),
    fields: z.array(CfTemplateFieldInput).describe("Custom fields to create in this template.")
});

export const EditCfTemplateSchema = z.object({
    cft_id: z.string().describe("ID of the custom field template to edit."),
    title: z.string().describe("New name of the custom field template."),
    module_id: z.number().int().describe(
        "Freedcamp app ID the template applies to: 2=Tasks, 13=Issue Tracker, 37=CRM."
    ),
    owner_id: Opt(z.string()).describe("Owner user ID for the template."),
    fields: z.array(CfTemplateFieldInput).describe("Full replacement set of custom fields for this template."),
    deleted_field_ids: Opt(z.array(z.number().int())).describe(
        "IDs of existing fields to remove from the template."
    ),
    f_archived: Opt(z.boolean()).describe("Whether the template is archived.")
});

export const FetchCalendarItemsSchema = z.object({
    project_id: Opt(z.string()).describe(
        "Restrict results to this project ID. Omit to fetch across all accessible projects."
    )
});

export const FavoriteProjectSchema = z.object({
    project_id: z.string().describe("ID of the project to add to or remove from favorites.")
});

export const RespondInvitationSchema = z.object({
    invitation_id: z.string().describe("ID of the invitation to respond to."),
    action: Opt(z.string()).describe("Response action, e.g. 'accept' or 'decline'."),
    response: Opt(z.string()).describe(
        "Additional response value required by some invitation types."
    ),
    project_id: Opt(z.string()).describe("ID of the project the invitation is for, if applicable.")
});
