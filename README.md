<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Project: NestMart API

NestMart is a small sample API built with NestJS to demonstrate a clean module structure, input validation, Swagger docs, and a minimal in-memory user store. This repository contains the initial implementation for managing users (list & create), basic app routes, and unit tests.

---

## Features implemented ✅

- Users module with two endpoints:
  - GET /users — returns a list of users (in-memory)
  - POST /users — create a new user using `CreateUserDto` and class-validator rules
- Global validation using Nest's `ValidationPipe` with `whitelist` and `forbidNonWhitelisted` enabled (strips unexpected properties and rejects requests with extra props)
- Swagger/OpenAPI documentation available at `/api` (configured in `src/main.ts`)
- Simple in-memory "database" in `UsersService` (for demo and testing purposes)
- Unit tests for `AppController` and a basic test scaffold for `UsersController`

---

## Quick start 🔧

1. Install dependencies

```bash
npm install
```

2. Run in development (watch mode)

```bash
npm run start:dev
# app runs at http://localhost:3000
# swagger UI available at http://localhost:3000/api
```

3. Run tests

```bash
# unit tests
npm run test

# e2e tests (if added)
npm run test:e2e
```

---

## API examples

- Get users:

```bash
curl http://localhost:3000/users
```

- Create user (valid payload):

```bash
curl -X POST http://localhost:3000/users \
  -H 'Content-Type: application/json' \
  -d '{"name":"John","email":"john@example.com","password":"secret123","role":"customer"}'
```

Validation notes:
- `name` must be a string with minimum length 2
- `email` must be a valid email
- `password` must be at least 6 characters
- Extra properties will be stripped or rejected depending on the request due to global validation

---

## Project structure & file explanations 📁

- `src/main.ts` — App bootstrap and global configuration
  - Enables `ValidationPipe` (with `whitelist` and `forbidNonWhitelisted`)
  - Configures Swagger (`/api`)
  - Starts the app on port 3000

- `src/app.module.ts` — Root module that imports `UsersModule` and other application modules

- `src/app.controller.ts` & `src/app.service.ts` — Example root endpoint that returns `Hello World!` (used by the unit test)

- `src/users/users.module.ts` — Module that declares and wires `UsersController` and `UsersService`

- `src/users/users.controller.ts` — Defines the HTTP endpoints for users (`GET /users`, `POST /users`). Uses `CreateUserDto` and Nest's decorators. Includes Swagger decorators for nice docs.

- `src/users/users.service.ts` — Business logic and temporary in-memory user storage. Implements `findAll()` and `create()`.

- `src/users/create-user.dto.ts` — DTO with `class-validator` decorators (`@IsString()`, `@IsEmail()`, `@MinLength()`), and `@ApiProperty()` for Swagger examples.

- `src/*.spec.ts` — Unit tests (Jest). `AppController` has a test for `getHello()`. `UsersController` has a scaffold test to assert controller is defined.

- `test/` — (e2e) test configuration files if you add integration tests later.

---

## Design decisions & notes 💡

- Persistence: currently in-memory for simplicity. For production-like behavior, integrate a database (Postgres, MongoDB, etc.) and move persistence to a repository layer.
- Passwords: currently stored as plain text in the in-memory store. Add password hashing (bcrypt) and remove plain-text storage before shipping.
- Validation: global pipe enforces DTO constraints and removes unexpected properties; this improves security and reduces accidental behavior.
- Swagger: helpful for manual testing and discovering endpoints. Keep DTO descriptions and `@ApiProperty()` metadata up to date.

---

## Next steps / suggestions ✨

- Add database integration (TypeORM / Prisma) and migration scripts
- Add authentication (JWT) and role-based guards
- Expand tests (unit & e2e), including negative test cases for validation
- Add CI configuration, linting, and prettier rules if desired

---

If you want, I can also:
- Add example e2e tests for the user endpoints
- Implement a simple persistence layer using SQLite or an in-memory database for tests
- Add basic authentication flow (signup/login)

Feel free to tell me which of the next steps you'd like me to implement next.

---

**License**: This project follows the same MIT licensing used by NestJS starter templates.

**Author**: Anees ur Rehman

