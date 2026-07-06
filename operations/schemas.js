import { z } from "zod";

export const Opt = (schema) => schema.optional().nullable();

export const PaginationSchema = z.object({
    limit: Opt(z.number().int().positive()).describe(
        "Maximum number of results to return per page."
    ),
    offset: Opt(z.number().int().nonnegative()).describe(
        "Number of results to skip before starting to return results (for paging)."
    )
});
