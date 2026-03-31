import { redirect } from "next/navigation";

export default async function HomePage() {
  const token = (await import("next/headers")).cookies().get("auth-token")?.value;
  const session = token ? { user: (await import("@/lib/auth")).verifyToken(token) } : null;
  if (session?.user) redirect("/dashboard");
  redirect("/login");
}
