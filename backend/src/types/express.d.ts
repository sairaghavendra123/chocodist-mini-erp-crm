import { UserRole } from '../types';

export interface JwtPayloadUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayloadUser;
    }
  }
}
