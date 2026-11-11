import { createParamDecorator, ExecutionContext, UnauthorizedException, ForbiddenException } from "@nestjs/common";
import type { CanActivate } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import type { Request } from "express";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "owner" | "desk";
};

export const COOKIE = "damakese_desk";

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): SessionUser | null => {
  const req = ctx.switchToHttp().getRequest<Request & { user?: SessionUser | null }>();
  return req.user ?? null;
});

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<Request & { user?: SessionUser | null }>();
    if (!req.user) throw new UnauthorizedException("Sign in to open the desk.");
    return true;
  }
}

@Injectable()
export class OwnerGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<Request & { user?: SessionUser | null }>();
    if (req.user?.role !== "owner") throw new ForbiddenException("Only the owner can remove this.");
    return true;
  }
}
