import { Request } from "express";

export interface AuthenticatedUser {
  userId: string;
}

export interface AuthenticatedRequest<
  P extends Record<string, string> = Record<string, string>,
> extends Request<P> {
  user?: AuthenticatedUser;
}
