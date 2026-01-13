import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Read the "sticker" from the route handler (e.g., ['Admin'])
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // 2. If there is no sticker (no roles required), let everyone in
    if (!requiredRoles) {
      return true;
    }

    // 3. Get the User from the Request (AuthGuard put it there!)
    const { user } = context.switchToHttp().getRequest();

    // 4. Check if the user has the role
    // user.role comes from the JWT payload we verified earlier
    return requiredRoles.includes(user.role);
  }
}