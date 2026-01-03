# JWT Authorization — The VIP Section (Simple English) 🛂👑

Once authentication (the wristband) is complete, **authorization** decides what that user is allowed to do. This document explains role-based authorization in simple words, shows how to implement it in NestJS, and provides interview-ready answers.

---

## The Concept: The VIP Section

- **AuthGuard (Main Entrance Bouncer)**: Confirms the wristband (JWT) is valid. If yes, you’re inside the building.
- **RolesGuard (VIP Bouncer)**: Stands in front of a room (e.g., "Delete Products") and checks your badge (role). If your badge says `Admin`, you enter; if it says `User`, you get denied.

Think of `AuthGuard` as checking you actually entered the club, and `RolesGuard` as checking whether you can enter the VIP room.

---

## Step 1 — Create the `@Roles()` decorator (Add a sticker to the door)

File: `src/auth/roles.decorator.ts`

```ts
import { SetMetadata } from '@nestjs/common';

// Usage: @Roles('Admin', 'Manager')
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
```

This attaches metadata to a route that says which roles are allowed.

---

## Step 2 — Create the `RolesGuard` (The VIP Bouncer)

File: `src/auth/roles.guard.ts`

```ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1) Read required roles from metadata attached by @Roles(...)
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // 2) If no roles are set on the route, allow access
    if (!requiredRoles) return true;

    // 3) Get user from request (AuthGuard placed it there)
    const { user } = context.switchToHttp().getRequest();

    // 4) Allow if user's role is included
    return requiredRoles.includes(user.role);
  }
}
```

Notes:
- Guards run _after_ `AuthGuard` (so `req.user` exists).
- `Reflector` reads metadata that the `@Roles()` decorator stored.

---

## Step 3 — Apply it to routes (Put the VIP Bouncer in front of the room)

Example: `src/users/users.controller.ts`

```ts
import { Controller, Delete, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('users')
export class UsersController {
  // ... other endpoints ...

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard) // Auth first, then Roles
  @Roles('Admin') // Only Admins allowed
  deleteUser(@Param('id') id: string) {
    return { message: `User ${id} deleted (simulated)` };
  }
}
```

Order matters: run `AuthGuard` to validate token and set `req.user`, then run `RolesGuard`.

---

## Step 4 — How to test the VIP Bouncer

1. Create two users: one with `role: 'User'` and another `role: 'Admin'`.
2. Login both users and get their JWTs.
3. Try `DELETE /users/5` with the User token → **403 Forbidden**.
4. Try the same with the Admin token → **200 OK** (allowed).

Tip: If you change a user's role in the DB, re-login to get a token that contains the updated role.

---

## Patterns & Practical Notes

- Simple Role Strings: `User`, `Admin`, `Manager` — easy to implement and understand.
- Permissions vs Roles: For fine-grained control, store permissions instead of (or in addition to) roles, and check permissions in guards.
- Token freshness: If role changes must be effective immediately, you need a revocation strategy (short-lived tokens + refresh tokens, or store a `tokenVersion` in DB).

---

## Interview Questions & Short Answers (Use these in interviews)

Q: "What's the difference between authentication and authorization?"
A: "Authentication verifies identity (who you are). Authorization verifies permissions (what you can do)."

Q: "Why use a RolesGuard instead of checking `if (user.role !== 'Admin')` inside the controller?"
A: "Guards centralize access control, avoid duplicated checks, and keep controller code focused on business logic. They also integrate cleanly with Nest's lifecycle and metadata APIs."

Q: "What happens if a user’s role changes in the DB but their existing token still has the old role?"
A: "If tokens are long-lived, the change won't be effective until they re-authenticate. Use short-lived access tokens + refresh tokens or maintain a revoke list/token version to enforce immediate changes."

Q: "Is it safe to trust role claims inside a JWT?"
A: "Yes if the token is signed and validated (signature + expiry). However, if role changes must be immediate, validate against the DB or use a token version mechanism." 

---

## Best practices & security tips 🔒

- Use least-privilege: give users the minimal roles they need.
- Keep token expiry short for sensitive systems.
- Consider using permissions/claims for complex authorization rules.
- Log authorization failures for auditing and anomaly detection.

---

If you'd like, I can implement the `@Roles()` decorator, `RolesGuard`, add the Admin-only route in `UsersController`, and add tests verifying 403/200 behavior. Tell me which pieces you'd like me to implement next.