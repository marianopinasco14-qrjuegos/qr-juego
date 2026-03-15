import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });
export const { handlers, signIn, signOut, auth } = NextAuth({ session: { strategy: "jwt" }, pages: { signIn: "/login" }, providers: [Credentials({ async authorize(credentials) { const parsed = loginSchema.safeParse(credentials); if (!parsed.success) return null; const user = await prisma.user.findUnique({ where: { email: parsed.data.email }, include: { organization: true } }); if (!user || !user.organization.isActive) return null; const valid = await bcrypt.compare(parsed.data.password, user.passwordHash); if (!valid) return null; return { id: user.id, email: user.email, name: user.name, role: user.role, organizationId: user.organizationId }; } })], callbacks: { async jwt({ token, user }) { if (user) { token.role = (user as any).role; token.organizationId = (user as any).organizationId; token.id = user.id; } return token; }, async session({ session, token }) { if (session.user) { (session.user as any).role = token.role; (session.user as any).organizationId = token.organizationId; (session.user as any).id = token.id; } return session; } } });
