import { Request, Response, NextFunction } from "express";
import { authService, AuthError } from "../services/auth.service";

export const authController = {
  /**
   * Register a new user account
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, name } = req.body;
      const result = await authService.register(email, password, name);

      res.status(201).json({
        success: true,
        message: "Account created successfully.",
        data: result,
      });
    } catch (err: any) {
      if (err instanceof AuthError) {
        res.status(err.statusCode).json({
          success: false,
          message: err.message,
        });
        return;
      }
      next(err);
    }
  },

  /**
   * Log in with existing credentials
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      res.status(200).json({
        success: true,
        message: "Signed in successfully.",
        data: result,
      });
    } catch (err: any) {
      if (err instanceof AuthError) {
        res.status(err.statusCode).json({
          success: false,
          message: err.message,
        });
        return;
      }
      next(err);
    }
  },

  /**
   * Get authenticated user profile
   */
  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const user = await authService.getProfile(req.user.id);
      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (err: any) {
      if (err instanceof AuthError) {
        res.status(err.statusCode).json({
          success: false,
          message: err.message,
        });
        return;
      }
      next(err);
    }
  },

  /**
   * Logout endpoint (clears client session)
   */
  async logout(_req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  },
};
