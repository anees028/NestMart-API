# Hashing vs Encryption — Interview-ready explanation 🔐🧠

This is one of the most important security concepts you will learn. If you can explain this clearly in an interview, you show that you understand trust and liability, not just code.

---

## Short answer

**Encryption is reversible (two-way). Hashing is one-way and intentionally irreversible.**

- Use **hashing** for passwords.
- Use **encryption** when you need to recover the original data (e.g., credit card numbers, messages that must be read later).

---

## The core difference: The Safe vs. The Blender

- **Encryption (Two-way)** — Think of a **Safe**. You lock data with a key and later open it with the same (or related) key. If someone steals the key, they can unlock everything.
- **Hashing (One-way)** — Think of a **Blender**. You put a strawberry (the password) in and blend it. You get a smoothie (the hash). You cannot turn the smoothie back into the strawberry.

This analogy helps you explain why we never *encrypt* passwords.

---

## The hacker scenario — Why encryption for passwords fails

Imagine your app has 1,000,000 users.

- **You used encryption:** To validate logins you must decrypt the stored value. That means your server stores the key. If a hacker steals the database *and* the key, they decrypt every password instantly — total compromise.

- **You used hashing (e.g., bcrypt):** The attacker steals the database and sees only hashed strings (e.g., `$2b$10$X8f...`). They cannot reverse those hashes. Cracking even one password requires enormous compute/time and targeted effort.

Result: hashing reduces the blast radius dramatically because there is no single secret that decrypts all passwords.

---

## How do logins work if you can't reverse the hash?

You do the same operation (replay the blend):

1. Sign up: User types `password123`. Server computes `Hash(password123)` → `HashXYZ` and stores `HashXYZ`.
2. Log in: User types `password123`. Server computes `Hash(password123)` → compare with `HashXYZ`.
3. If they match → success; otherwise → reject.

Important: Use a slow, adaptive hashing algorithm (bcrypt, Argon2, scrypt) with a salt and configurable cost factor to slow down brute-force attacks.

---

## When should you use encryption?

Use encryption when you need to recover the original value later:

- Credit card numbers (if you must send them to a payment provider and need to decrypt)
- Shipping addresses (you may need to print them)
- Private messages (recipient needs to read plaintext)

Encryption is appropriate for data that must be recovered, but it introduces a key management problem: keep keys secure (HSM, KMS, or secrets managers) and rotate them carefully.

---

## Interview summary (one-liner you can use)

"We hash passwords (one-way) because there's no need to recover the original text — this avoids a single-point-of-failure key that would expose all user credentials; encryption should be used only when we must recover plaintext and then only with strict key management." 

---

## Quick best-practices

- Use `bcrypt`, `argon2`, or `scrypt` for passwords (avoid plain SHA-1/SHA-256 without salts and iterations).
- Always use a unique salt per password (modern libraries do this for you).
- Use a high cost factor that fits your hardware and threat model.
- Never log raw passwords.
- For data that must be decrypted, use secure key management (KMS/HSM) and never hard-code keys.

---

If you'd like, I can:

- Add `bcrypt` to the project and implement hashing in `UsersService`.
- Re-enable the `password` field in `CreateUserDto` and add tests for signup/login flows.

Tell me which step you'd like me to take next.



---

## Interview topic: Interceptors & `ClassSerializerInterceptor` — The "Quality Control" inspector

Interceptors sit between your Controller and the Client. They can run after a handler returns data but before the response is serialized and sent — which makes them perfect for consistent response shaping and cross-cutting concerns.

### The Concept: The "Quality Control" Inspector

- **Middleware** (Express-style) runs before the request hits the controller.
- **Interceptors** can run *after* the handler returns — they are like a Quality Control inspector at the end of the factory line.

Example: The controller produces a `User` entity that includes a `password` field. The `ClassSerializerInterceptor` inspects the outgoing object, respects `class-transformer` decorators like `@Exclude()`, and removes sensitive fields (e.g., `password`) before the JSON is sent to the client.

### Step 1: Update the `User` entity

Mark sensitive fields with `@Exclude()` from `class-transformer` and optionally hash the password before insert:

```ts
import { Entity, Column, PrimaryGeneratedColumn, BeforeInsert } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Exclude } from 'class-transformer';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude() // NEVER include in serialized responses
  password: string;

  @Column()
  role: string;

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }
}
```

### Step 2: Activate the interceptor (globally recommended)

Open `src/main.ts` and add the `ClassSerializerInterceptor` globally. The interceptor uses `Reflector` to read `class-transformer` metadata:

```ts
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  // Activate serializer globally — ensures @Exclude is respected everywhere
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // ... Swagger and other setup ...

  await app.listen(3000);
}
bootstrap();
```

Optionally, you can apply the interceptor per-controller instead of globally if you only want the behavior in a limited scope.

### Step 3: Verification

- Restart the server.
- Use Swagger or `curl` to call `GET /users`.
- The returned JSON should NOT contain `password`:

```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@test.com",
    "role": "User"
  }
]
```

> The password still exists in the DB (so authentication works), but it never leaves the API surface.

### Interview Knowledge: Why use `ClassSerializerInterceptor`?

- **Consistency**: It prevents accidentally leaking sensitive fields in any route that returns the entity. Manually deleting properties in services is error-prone and easy to forget.
- **Immutability**: Serializers produce a derived view for responses instead of mutating the entity instance, avoiding side effects.

Use this explanation to show you understand cross-cutting concerns, consistent response shaping, and secure defaults in NestJS.