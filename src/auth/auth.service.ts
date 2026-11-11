import { Injectable, UnauthorizedException } from "@nestjs/common";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaService } from "../prisma.service";
import type { SessionUser } from "./session";

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  private secret() {
    return process.env.SESSION_SECRET || "damakese-local-desk-secret";
  }

  read(token: string | undefined): SessionUser | null {
    if (!token) return null;
    try {
      const payload = jwt.verify(token, this.secret()) as SessionUser & { sub?: string };
      if (!payload.id || (payload.role !== "owner" && payload.role !== "desk")) return null;
      return { id: payload.id, email: payload.email, name: payload.name, role: payload.role };
    } catch {
      return null;
    }
  }

  async login(email: string, password: string) {
    const seat = await this.prisma.seat.findUnique({ where: { email: email.trim().toLowerCase() } });
    const match = seat ? await bcrypt.compare(password, seat.passwordHash) : false;
    if (!seat || !match || (seat.role !== "owner" && seat.role !== "desk")) {
      throw new UnauthorizedException("That email and password do not open the desk.");
    }
    const user: SessionUser = {
      id: seat.id,
      email: seat.email,
      name: seat.name,
      role: seat.role,
    };
    const token = jwt.sign(user, this.secret(), { expiresIn: "12h" });
    return { token, user };
  }
}
