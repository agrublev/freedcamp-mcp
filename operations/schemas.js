import { z } from "zod";

export const Opt = (schema) => schema.optional().nullable();

export const PaginationSchema = z.object({
  limit: Opt(z.number().int().positive()),
  offset: Opt(z.number().int().nonnegative()),
});
