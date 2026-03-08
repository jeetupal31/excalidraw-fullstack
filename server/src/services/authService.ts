import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { PrismaClient } from "@prisma/client";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
}

interface AuthTokenPayload {
  userId: string;
  email: string;
  username: string;
}

const SALT_ROUNDS = 10;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET. Add it to server/.env before starting the server.");
  }
  return secret;
}

export class AuthService {
  constructor(private readonly prisma: PrismaClient) {}

  async signup(email: string, username: string, password: string): Promise<{ user: AuthUser; token: string }> {
    const existingEmail = await this.prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      throw new Error("Email already registered.");
    }

    const existingUsername = await this.prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      throw new Error("Username already taken.");
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: { email, username, password: hashedPassword },
    });

    const token = this.generateToken(user);

    return {
      user: { id: user.id, email: user.email, username: user.username },
      token,
    };
  }

  async login(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error("Invalid email or password.");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password.");
    }

    const token = this.generateToken(user);

    return {
      user: { id: user.id, email: user.email, username: user.username },
      token,
    };
  }

  verifyToken(token: string): AuthUser | null {
    try {
      const payload = jwt.verify(token, getJwtSecret()) as AuthTokenPayload;
      return {
        id: payload.userId,
        email: payload.email,
        username: payload.username,
      };
    } catch {
      return null;
    }
  }

  private generateToken(user: { id: string; email: string; username: string }): string {
    const payload: AuthTokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };

    return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
  }
}
