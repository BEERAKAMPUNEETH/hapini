import crypto from "crypto";
import { query, isDbActive } from "../config/db";
import { User } from "../types";

// In-memory fallback store for users (active when PostgreSQL is not yet running)
const inMemoryUsers: Map<string, User> = new Map();

export const userRepository = {
  /**
   * Find a user by email address (case-insensitive)
   */
  async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.trim().toLowerCase();

    if (isDbActive()) {
      try {
        const sql = `
          SELECT id, email, password_hash, name, role, created_at, updated_at
          FROM users
          WHERE LOWER(email) = LOWER($1)
          LIMIT 1;
        `;
        const result = await query<User>(sql, [normalizedEmail]);
        if (result.rows.length > 0) {
          return result.rows[0];
        }
      } catch (err: any) {
        console.warn("User DB lookup failed, falling back to memory:", err.message);
      }
    }

    // In-memory lookup
    for (const user of inMemoryUsers.values()) {
      if (user.email.toLowerCase() === normalizedEmail) {
        return user;
      }
    }

    return null;
  },

  /**
   * Find a user by UUID
   */
  async findById(id: string): Promise<User | null> {
    if (isDbActive()) {
      try {
        const sql = `
          SELECT id, email, password_hash, name, role, created_at, updated_at
          FROM users
          WHERE id = $1
          LIMIT 1;
        `;
        const result = await query<User>(sql, [id]);
        if (result.rows.length > 0) {
          return result.rows[0];
        }
      } catch (err: any) {
        console.warn("User DB lookup failed, falling back to memory:", err.message);
      }
    }

    return inMemoryUsers.get(id) || null;
  },

  /**
   * Create a new user with hashed password
   */
  async create(userData: {
    email: string;
    password_hash: string;
    name: string;
    role?: string;
  }): Promise<User> {
    const id = crypto.randomUUID();
    const role = userData.role || "user";
    const now = new Date().toISOString();

    const newUser: User = {
      id,
      email: userData.email.trim().toLowerCase(),
      password_hash: userData.password_hash,
      name: userData.name.trim(),
      role,
      created_at: now,
      updated_at: now,
    };

    if (isDbActive()) {
      try {
        const sql = `
          INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          RETURNING id, email, password_hash, name, role, created_at, updated_at;
        `;
        const result = await query<User>(sql, [
          newUser.id,
          newUser.email,
          newUser.password_hash,
          newUser.name,
          newUser.role,
        ]);
        if (result.rows.length > 0) {
          // Keep in memory in sync
          inMemoryUsers.set(result.rows[0].id, result.rows[0]);
          return result.rows[0];
        }
      } catch (err: any) {
        console.warn("User DB create failed, storing in memory:", err.message);
      }
    }

    inMemoryUsers.set(newUser.id, newUser);
    return newUser;
  },

  /**
   * Direct accessor for tests or seed initialization
   */
  _clearMemory(): void {
    inMemoryUsers.clear();
  },
};
