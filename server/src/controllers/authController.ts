import type { Request, Response } from "express";
import type { AuthService } from "../services/authService";

export function createAuthController(authService: AuthService) {
  const signup = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, username, password } = req.body as {
        email?: string;
        username?: string;
        password?: string;
      };

      if (!email || !username || !password) {
        res.status(400).json({ error: "Email, username, and password are required." });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ error: "Password must be at least 6 characters." });
        return;
      }

      const result = await authService.signup(email, username, password);
      res.status(201).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Signup failed.";
      res.status(400).json({ error: message });
    }
  };

  const login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body as {
        email?: string;
        password?: string;
      };

      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required." });
        return;
      }

      const result = await authService.login(email, password);
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed.";
      res.status(401).json({ error: message });
    }
  };

  const me = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated." });
      return;
    }

    res.status(200).json({ user: req.user });
  };

  return { signup, login, me };
}
