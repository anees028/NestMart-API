# Database setup — PostgreSQL + TypeORM 🔧

Excellent choice. TypeORM is the "Enterprise Standard" for NestJS: mature, powerful, and aligned with Nest's architecture.

This document shows a pragmatic, developer-friendly workflow for adding PostgreSQL + TypeORM to NestMart using Docker, including how to create a `User` entity and wire up repositories via `TypeOrmModule`.

---

## The strategy

- Database: **PostgreSQL** (robust, SQL, ACID)
- ORM: **TypeORM** (maps classes to tables and exposes repositories)
- Local development: **Docker Compose** (keeps your laptop clean and consistent)

---

## Concepts (short)

- **ORM (Object-Relational Mapper)** — You define classes (Entities). TypeORM converts them into SQL (tables) and runs SQL for you.
- **Repository Pattern** — Use injected Repositories (e.g., `Repository<User>`) in Services instead of hand-written SQL.

---

## Step 1 — Install dependencies

```bash
npm install --save @nestjs/typeorm typeorm pg
```

- `@nestjs/typeorm` — Nest integration
- `typeorm` — ORM core
- `pg` — Postgres driver

---

## Step 2 — Set up PostgreSQL (Docker)

Create a `docker-compose.yml` at the project root (next to `package.json`) with:

```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    restart: always
    environment:
      POSTGRES_USER: nest_user. # Username for the database
      POSTGRES_PASSWORD: nest # Password for the database
      POSTGRES_DB: nestmart_db # Database name.
    ports:
      - '5432:5432'
```

Start the DB:

```bash
docker-compose up -d
```

If you don't have Docker, install PostgreSQL and create a database named `nestmart_db` with the same user/password values (or adapt the configuration below).

---

## Step 3 — Connect NestJS to the DB

Open `src/app.module.ts` and import `TypeOrmModule`:

```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { User } from './users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'nest_user',
      password: 'nest_password',
      database: 'nestmart_db',
      entities: [User],
      synchronize: true, // AUTO-CREATE TABLES — set to FALSE in production!
    }),
    UsersModule,
  ],
})
export class AppModule {}
```

Notes:
- `synchronize: true` is convenient for development; it auto-generates tables from entities. **Do not** use in production — use migrations instead.
- Prefer using environment variables (or `@nestjs/config`) instead of hardcoding credentials.

---

## Step 4 — Create the `User` entity

Create `src/users/user.entity.ts`:

```ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  role: string;

  // In a real app, you'd also add a password column and hash it before storing
}
```

---

## Step 5 — Register the entity

A. Add the entity to global config in `TypeOrmModule.forRoot({ entities: [User] })` (see Step 3).

B. Register the repository in `src/users/users.module.ts` so the `UsersModule` can inject the repository:

```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
```

---

## Example: Update `UsersService` to use the repository

Replace the in-memory array with a repository-backed implementation. Example `src/users/users.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  findAll() {
    return this.usersRepository.find();
  }

  async create(createUserDto: CreateUserDto) {
    const user = this.usersRepository.create(createUserDto as Partial<User>);
    return this.usersRepository.save(user);
  }
}
```

Notes and best practices:
- Handle unique constraint errors (e.g., email already exists) and translate DB errors into clean HTTP responses.
- If you add a `password` field, hash it (bcrypt) before saving and never return it in responses.

---

## Optional: Migrations (recommended for production)

- `synchronize: false` in production.
- Use TypeORM migrations to apply schema changes deterministically. With TypeORM 0.3+, generate migrations with the DataSource API or use a CLI helper package. Keep migrations under version control.

---

## Environment & security notes 🔒

- Use environment variables or `@nestjs/config` to store DB credentials.
- Do not commit secrets to source control.

---

## Next steps & suggestions ✨

- Add a `password` column + hashing, then add a `User` DTO for responses that omits the password.
- Add integration tests using an ephemeral Postgres instance (Docker) or test containers.
- Add migrations and CI steps to run them during deploy.

---

If you want, I can implement the code changes for you (create `user.entity.ts`, update `app.module.ts`, modify `users.service.ts` to use a repository, and re-enable/extend `CreateUserDto` with password hashing). Tell me which parts you'd like me to implement next.