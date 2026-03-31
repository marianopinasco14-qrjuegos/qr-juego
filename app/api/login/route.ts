import { NextResponse } from "next/server";
import { loginUser } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const result = await loginUser(email, password);
  if (!result) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  const response = NextResponse.json({ user: result.user });
  response.cookies.set("auth-token", result.token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return response;
}
