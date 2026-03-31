import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const SECRET = process.env.NEXTAUTH_SECRET || "qrjuego-secret-key-2024";

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email }, include: { organization: true } });
  if (!user || !user.organization?.isActive) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;
  const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role, organizationId: user.organizationId }, SECRET, { expiresIn: "7d" });
  return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
}

export function verifyToken(token: string) {
  try { return jwt.verify(token, SECRET) as any; } catch { return null; }
}
