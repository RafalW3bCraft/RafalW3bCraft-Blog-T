import { User as SchemaUser } from '../shared/schema';
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    isAdmin?: boolean;
    user?: any;
  }
}

declare global {
  namespace Express {
    interface User {
      id?: string;
      email?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      username?: string | null;
      bio?: string | null;
      profileImageUrl?: string | null;
      role?: string | null;
      provider?: string | null;
      providerId?: string | null;
      isActive?: boolean | null;
      lastLogin?: Date | null;
      createdAt?: Date | null;
      updatedAt?: Date | null;
      claims?: {
        sub: string;
        email?: string;
        first_name?: string;
        last_name?: string;
        profile_image_url?: string;
      };
      access_token?: string;
      refresh_token?: string;
      expires_at?: number;
    }
  }
}

export {};