import { Injectable, NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { AuthService } from "./auth/auth.service";
import { COOKIE, type SessionUser } from "./auth/session";

@Injectable()
export class SessionMiddleware implements NestMiddleware {
  constructor(private readonly auth: AuthService) {}

  use(req: Request & { user?: SessionUser | null }, _res: Response, next: NextFunction) {
    req.user = this.auth.read(req.cookies?.[COOKIE]);
    next();
  }
}
