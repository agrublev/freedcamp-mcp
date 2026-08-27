import { z } from "zod";

// NOTE: `.optional()` only — do NOT add `.nullable()`. MCP clients omit absent
// fields rather than sending null, and zod-to-json-schema renders a
// .optional().nullable() chain as a nested anyOf union
// ({ anyOf: [{ anyOf: [{ not: {} }, ...] }, { type: "null" }] }) that MCP
// Inspector's form generator cannot match to a string widget (it falls back to
// an object editor). A plain optional maps cleanly to { type: "string" }.
export const Opt = (schema) => schema.optional();

export const PaginationSchema = z.object({
    limit: Opt(z.number().int().positive()).describe(
        "Maximum number of results to return per page."
    ),
    offset: Opt(z.number().int().nonnegative()).describe(
        "Number of results to skip before starting to return results (for paging)."
    )
});
