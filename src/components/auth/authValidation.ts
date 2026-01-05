import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .min(1, { message: "Email jest wymagany." })
  .email({ message: "Podaj poprawny adres e-mail." });

const passwordSchema = z
  .string()
  .min(1, { message: "Hasło jest wymagane." })
  .min(6, { message: "Hasło musi mieć co najmniej 6 znaków." });

const readFirstError = (issues: z.ZodIssue[]) => issues[0]?.message;

export const getEmailError = (value: string) => {
  const result = emailSchema.safeParse(value);
  return result.success ? undefined : readFirstError(result.error.issues);
};

export const getPasswordError = (value: string) => {
  const result = passwordSchema.safeParse(value);
  return result.success ? undefined : readFirstError(result.error.issues);
};
