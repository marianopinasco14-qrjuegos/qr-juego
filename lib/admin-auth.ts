import { cookies } from "next/headers";
import { verifyToken } from "./auth";

export function requireSuperAdmin() {
  const cookieStore = cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.role !== "SUPERADMIN") return null;
  return payload;
}
