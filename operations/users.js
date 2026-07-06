import { z } from "zod";
import { Opt } from "./schemas.js";

export const FetchUserSchema = z.object({
    user_id: z.string().describe("ID of the user to fetch.")
});

export const RegisterUserSchema = z.object({
    email: z.string().email().describe("Email address for the new account."),
    password: z.string().describe("Password for the new account."),
    first_name: z.string().describe("First name."),
    last_name: z.string().describe("Last name."),
    timezone: Opt(z.string()).describe("IANA timezone name, e.g. 'America/Los_Angeles'.")
});

export const UpdateCurrentUserSchema = z.object({
    first_name: Opt(z.string()).describe("New first name."),
    last_name: Opt(z.string()).describe("New last name."),
    email: Opt(z.string().email()).describe("New email address."),
    timezone: Opt(z.string()).describe("New IANA timezone name, e.g. 'America/Los_Angeles'."),
    password: Opt(z.string()).describe("New password. Requires current_password to also be set."),
    current_password: Opt(z.string()).describe(
        "Current password, required when changing password or email."
    )
});

export const DeleteAccountSchema = z.object({
    password: z.string().describe("Current account password, required to confirm deletion."),
    confirm: Opt(z.string()).describe(
        "Confirmation flag/string required by the API to finalize deletion."
    )
});

export const RequestPasswordResetSchema = z.object({
    email: z.string().email().describe("Email address to send the password reset link to.")
});

export const ApplyPasswordResetSchema = z.object({
    reset_key: z.string().describe("Reset key/token received in the password reset email."),
    password: z.string().describe("New password to set.")
});

export const ValidateEmailSchema = z.object({
    email: z.string().email().describe("Email address to validate/check availability for.")
});
