"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { acceptPendingInvites, createSession, destroySession } from "@/lib/auth";

const credentialsSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().trim().min(1).max(60).optional(),
});

export type AuthState = { error?: string } | undefined;

export async function register(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid data" };
  }
  const { email, password, name } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "This email is already registered" };

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, name: name ?? null },
  });

  await acceptPendingInvites(user.id, user.email);
  await createSession({ userId: user.id, email: user.email });
  redirect("/boards");
}

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = credentialsSchema
    .omit({ name: true })
    .safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
  if (!parsed.success) return { error: "Email and password are required" };

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (!user) return { error: "Email or password is incorrect" };

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return { error: "Email or password is incorrect" };

  await createSession({ userId: user.id, email: user.email });
  redirect("/boards");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
