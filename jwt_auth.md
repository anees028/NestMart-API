# JWT Authentication — The Nightclub Wristband (Step-by-step) 🎟️🔐

This is the modern standard for API auth. If you understand JWTs and can explain them clearly, you’ll understand how most mobile apps and web services (Twitter/X, Instagram, Gmail) handle login.

---

## The concept: The Nightclub Wristband

- The **Bouncer (Login endpoint)** checks your ID (email/password).
- If valid, the bouncer gives you a **Wristband (JWT)** that proves you were authorized.
- Inside the **Club (protected routes)** the bartenders check your wristband — they don't need to ask for ID again.

Why this works:
- **Stateless**: The server doesn’t store session state; the token carries the necessary data.
- **Efficient**: No per-user session store required; verification is based on signature and expiry.

---

## Step 1 — Install dependencies

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install --save-dev @types/passport-jwt
```

- `@nestjs/jwt` provides a thin wrapper for signing/verifying tokens.
- `passport` + `passport-jwt` lets you implement guards and strategies.

---

## Step 2 — Create the Auth module (if not already)

```bash
nest g module auth
nest g service auth
nest g controller auth
```

Auth is a separate feature and should live in its own module.

---

## Step 3 — Configure the `JwtModule`

In `src/auth/auth.module.ts` register the module and the secret (in production use env vars):

```ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'superSecretKey123', // use env var in prod
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
```

**Notes:**
- Use a strong secret and keep it in a secrets manager or environment variable.
- Set appropriate `expiresIn` and consider refresh tokens.

---

## Step 4 — Export `UsersService` so Auth can use it

In `src/users/users.module.ts` add:

```ts
exports: [UsersService]
```

This lets `AuthService` call `usersService.findOneByEmail(...)`.

---

## Step 5 — Implement the login logic (AuthService)

`src/auth/auth.service.ts` (simplified):

```ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async signIn(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, username: user.email, role: user.role };
    return { access_token: await this.jwtService.signAsync(payload) };
  }
}
```

**Note:** Ensure `UsersService.findOneByEmail` exists and returns the user (including the hashed `password`).

---

## Step 6 — Login Controller

Create `POST /auth/login` that accepts `{ email, password }` and calls `AuthService.signIn`:

```ts
import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: { email: string; password: string }) {
    return this.authService.signIn(signInDto.email, signInDto.password);
  }
}
```

**Tip:** Create a `LoginDto` for validation and documentation with `class-validator` and `@ApiProperty()`.

---

## Step 7 — Test it (manual)

1. Start server: `npm run start:dev`.
2. Create a user (POST `/users`) with `email` and `password`.
3. Call POST `/auth/login` with the same credentials.

If successful, you’ll receive:

```json
{ "access_token": "<JWT string>" }
```

Copy the JWT to `jwt.io` to decode it and inspect the payload.

---

## Protecting routes (brief)

- Use `Passport`'s JWT strategy to validate incoming JWTs and attach `req.user`.
- Protect controllers with `@UseGuards(AuthGuard('jwt'))` or a global auth guard.

This ensures endpoints check the token signature, expiry, and optionally the payload claims (e.g., `sub`, `role`).

---

## Production considerations & best practices

- **Secret management:** Do not hardcode secrets; use `process.env` or a secrets manager (KMS, Vault).
- **Short-lived access tokens + refresh tokens:** Use refresh tokens to obtain new access tokens with stricter revocation rules.
- **Revoke/Blacklist:** Design a strategy for revoking tokens (e.g., store token jtis in a blacklist or use short access token lifetime with refresh tokens).
- **HTTPS:** Always transport tokens over HTTPS and consider `HttpOnly` cookies for browser clients.
- **Token size:** Keep the payload small to reduce bandwidth and avoid exposing sensitive data.

---

## Interview-ready summary (one-liner)

"JWTs are stateless signed tokens that let servers authenticate requests without storing session state; they’re efficient, scalable, and rely on secure key management and token expiry for safety." 

---

If you want, I can implement the missing pieces for you now:
- Add `findOneByEmail` to `UsersService`
- Implement `AuthService` and `AuthController` if not present
- Add a JWT strategy and a guard to protect routes
- Add tests for login flow

Which of these would you like me to do next?

---

## Guards — The Bouncer at the Door (Simple English)

You have the Wristband (Token). Now we need to put a Bouncer at the door of your API endpoints to check it.

- **Guard = Bouncer**: The Guard stands at a route and says "Stop! Let me see your wristband and validate it before I let the request proceed." 
- **Rulebook = Strategy**: This is the file that describes how to check the wristband (where to look for the token, how to validate it, what secret to use, whether to reject expired tokens).

### Step 1 — Create the Strategy (the Rulebook)

Create `src/auth/jwt.strategy.ts` that tells Passport how to validate tokens and what to attach to `req.user` when valid:

```ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Look in Authorization header
      ignoreExpiration: false, // Reject expired tokens
      secretOrKey: process.env.JWT_SECRET || 'superSecretKey123', // Use env var in prod
    });
  }

  async validate(payload: any) {
    // This return value is attached to req.user
    return { userId: payload.sub, username: payload.username, role: payload.role };
  }
}
```

### Step 2 — Register the Strategy

Tell `AuthModule` about the strategy so Nest can initialize it:

```ts
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [/* UsersModule, JwtModule */],
  providers: [AuthService, JwtStrategy], // register here
  controllers: [AuthController],
})
export class AuthModule {}
```

### Step 3 — Add the Guard to a Route (the Bouncer is present)

Use the guard on a route with `@UseGuards(AuthGuard('jwt'))`.

Example: `GET /users/profile` in `src/users/users.controller.ts`:

```ts
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UsersController {
  // ... existing endpoints ...

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req) {
    // req.user exists because JwtStrategy validated the token
    return req.user;
  }
}
```

### Step 4 — Test the Bouncer

- Without a token: `GET /users/profile` → 401 Unauthorized (the Bouncer stops the request).
- With a token (use `Authorization: Bearer <token>`): the route returns `req.user` (data from the token).

Example cURL:

```bash
curl http://localhost:3000/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Why this is efficient

Because the token already contains the necessary claims (user id, email, role), the protected endpoint can often avoid a database lookup and use `req.user` directly. This reduces latency and load on your database for simple checks.

### Bonus: Role-based Guard (Challenge)

If you need only admins to access a route, create a custom guard that checks `req.user.role === 'admin'` and returns `true` only for allowed roles. This is like giving the bouncer a small rulebook with role checks.

---

If you'd like, I can implement the `JwtStrategy`, add the guard-protected `/users/profile` endpoint, and write a small test (401 without token, 200 with token). Tell me which of those you'd like me to implement next.