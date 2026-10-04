import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { LoginInput, LoginResponse } from '@portfolio/shared';
import { AppError } from '../../utils/app-error.js';
import type { AuthRepo } from './repo.js';

export interface AuthService {
  login(input: LoginInput): Promise<LoginResponse>;
}

export interface AuthConfig {
  jwtSecret: string;
  /** Token lifetime in seconds (already converted from `JWT_EXPIRES_IN`). */
  expiresInSeconds: number;
}

// Compared against when the email is unknown, so an unknown email costs as much as a wrong password.
const decoyHash = bcrypt.hash('decoy-password-never-matches', 12);

export function createAuthService(repo: AuthRepo, config: AuthConfig): AuthService {
  return {
    async login({ email, password }) {
      const admin = await repo.findByEmail(email);
      const matches = await bcrypt.compare(password, admin?.passwordHash ?? (await decoyHash));
      if (!admin || !matches) {
        throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
      }
      // HS256 is pinned to match the algorithm allow-list of middleware/auth-jwt.ts.
      const token = jwt.sign({}, config.jwtSecret, {
        algorithm: 'HS256',
        subject: admin.id,
        expiresIn: config.expiresInSeconds,
      });
      return { token, expiresIn: config.expiresInSeconds };
    },
  };
}
