import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { userRepository } from "../repositories/user.repository";
import { env } from "../config/env";
import { AuthTokenPayload, UserResponse } from "../types";

export interface AuthResult {
  token: string;
  user: UserResponse;
}

export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

export const authService = {
  /**
   * Register a new user
   */
  async register(email: string, password: string, name: string): Promise<AuthResult> {
    const trimmedEmail = (email || "").trim().toLowerCase();
    const trimmedName = (name || "").trim();

    // 1. Validation
    if (!trimmedEmail) {
      throw new AuthError("Email is required", 400);
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      throw new AuthError("Please provide a valid email address", 400);
    }

    if (!trimmedName || trimmedName.length < 2) {
      throw new AuthError("Name must be at least 2 characters", 400);
    }

    if (!password || password.length < 6) {
      throw new AuthError("Password must be at least 6 characters long", 400);
    }

    // 2. Check for duplicate registration
    const existing = await userRepository.findByEmail(trimmedEmail);
    if (existing) {
      throw new AuthError("An account with this email already exists", 409);
    }

    // 3. Hash password securely
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // 4. Create user in database
    const user = await userRepository.create({
      email: trimmedEmail,
      password_hash,
      name: trimmedName,
      role: "user",
    });

    // 5. Generate signed JWT token
    const payload: AuthTokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  },

  /**
   * Authenticate user with email and password
   */
  async login(email: string, password: string): Promise<AuthResult> {
    const trimmedEmail = (email || "").trim().toLowerCase();

    if (!trimmedEmail || !password) {
      throw new AuthError("Email and password are required", 400);
    }

    // 1. Retrieve user
    const user = await userRepository.findByEmail(trimmedEmail);
    if (!user) {
      // Intentionally generic error to prevent email enumeration
      throw new AuthError("Invalid email or password", 401);
    }

    // 2. Verify hashed password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AuthError("Invalid email or password", 401);
    }

    // 3. Generate token
    const payload: AuthTokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  },

  /**
   * Retrieve current user profile by verified user ID
   */
  async getProfile(userId: string): Promise<UserResponse> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AuthError("User not found", 404);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  },
};
