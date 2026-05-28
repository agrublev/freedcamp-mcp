import { z } from "zod";
import { Opt } from "./schemas.js";

export const FetchUserSchema = z.object({ user_id: z.string() });

export const RegisterUserSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  timezone: Opt(z.string()),
});

export const UpdateCurrentUserSchema = z.object({
  first_name: Opt(z.string()),
  last_name: Opt(z.string()),
  email: Opt(z.string().email()),
  timezone: Opt(z.string()),
  password: Opt(z.string()),
  current_password: Opt(z.string()),
});

export const DeleteAccountSchema = z.object({
  password: z.string(),
  confirm: Opt(z.string()),
});

export const RequestPasswordResetSchema = z.object({ email: z.string().email() });

export const ApplyPasswordResetSchema = z.object({
  reset_key: z.string(),
  password: z.string(),
});

export const ValidateEmailSchema = z.object({ email: z.string().email() });
