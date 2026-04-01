import type { AuthSession } from "@/lib/auth";

function toUsernameSlug(input?: string | null): string | null {
  if (!input) return null;

  const localPart = input.includes("@") ? input.split("@")[0] : input;
  const slug = localPart
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-._]+|[-._]+$/g, "");

  return slug || null;
}

export function resolvePostLoginPath(session: Pick<AuthSession, "role" | "login" | "userId">): string {
  const role = (session.role || "").toUpperCase();
  if (role === "ADMIN") {
    return "/admin";
  }

  const username = toUsernameSlug(session.login) ?? toUsernameSlug(session.userId) ?? "utilisateur";
  return `/${username}`;
}

