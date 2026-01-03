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