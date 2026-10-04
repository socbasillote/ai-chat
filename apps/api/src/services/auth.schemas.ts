import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().trim().optional(),
    firstName: z.string().trim().optional(),
    lastName: z.string().trim().optional(),

    email: z.string().trim().email("Invalid email address").toLowerCase(),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must not exceed 128 characters"),
  })
  .superRefine((data, ctx) => {
    const resolvedName = (
      data.name ?? `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim()
    ).trim();

    if (resolvedName.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["name"],
        message: "Name must be at least 2 characters",
      });
    }
  });

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address").toLowerCase(),

  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
