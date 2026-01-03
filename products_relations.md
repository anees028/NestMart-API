# Products & Relations — One-to-Many (Simple English) 🧩🛍️

Relating data is the bread-and-butter of backend engineering. In the real world, data is rarely isolated. In NestMart:

- **One Admin -> Many Products** (One-to-Many)

This document shows, in plain language, how to model that relationship with TypeORM, wire the service and controller, test it, and answer common interview questions.

---

## Quick overview

- Products are the **many** side and hold the foreign key to the User (creator).
- Users are the **one** side and can have an array of products.
- We'll protect product creation so only Admins can create products.

---

## Step 1 — Generate the products resource

```bash
nest g resource products
# Choose: REST API, Yes for CRUD
```

This creates controller, service, module and DTOs for you.

---

## Step 2 — Product entity (Many side)

File: `src/products/entities/product.entity.ts`

```ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/user.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('decimal') // Use 'decimal' for money, not float
  price: number;

  @Column({ default: true })
  isActive: boolean;

  // Many Products -> One User
  @ManyToOne(() => User, (user) => user.products, { eager: true })
  creator: User;
}
```

Notes:
- `@ManyToOne` places the foreign key column on the `products` table (e.g., `creatorId`).
- `eager: true` automatically fetches the `creator` when you `find()` products (convenient but can increase query size).

---

## Step 3 — Update User entity (One side)

File: `src/users/user.entity.ts`

```ts
import { OneToMany } from 'typeorm';
import { Product } from '../products/entities/product.entity';

@Entity()
export class User {
  // ... other columns ...

  @OneToMany(() => Product, (product) => product.creator)
  products: Product[];
}
```

Note: `@OneToMany` does NOT create a DB column — it's a virtual relation used by TypeORM.

---

## Step 4 — Register Product repository in module

File: `src/products/products.module.ts`

```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
```

This registers the Product repository so you can inject it in the service.

---

## Step 5 — Create product with the logged-in user

File: `src/products/products.service.ts`

```ts
async create(createProductDto: CreateProductDto, user: User) {
  const newProduct = this.productRepo.create({
    ...createProductDto,
    creator: user, // TypeORM will link the foreign key automatically
  });

  return this.productRepo.save(newProduct);
}
```

Important: pass the requesting user (from `req.user`) into `create()`.

---

## Step 6 — Controller: protect route and pass req.user

File: `src/products/products.controller.ts`

```ts
@Post()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.Admin)
create(@Body() dto: CreateProductDto, @Request() req) {
  return this.productsService.create(dto, req.user);
}

@Get()
findAll() { return this.productsService.findAll(); }
```

- `AuthGuard('jwt')` ensures the user is authenticated.
- `RolesGuard` + `@Roles(Role.Admin)` ensure only Admins can create products.

---

## Step 7 — Test it manually

1. Restart server.
2. Login as Admin → get JWT.
3. POST `/products` with body `{ "title": "Gaming Laptop", "price": 1500 }` and `Authorization: Bearer <token>`.
4. GET `/products` → You should see the `creator` nested inside each product.

Example response (creator included because of `eager: true`):

```json
[
  {
    "id": 1,
    "title": "Gaming Laptop",
    "price": "1500.00",
    "isActive": true,
    "creator": { "id": 1, "name": "Admin User", "email": "admin@test.com", "role": "Admin" }
  }
]
```

Note: `decimal` columns often return string values. Convert carefully before calculations (e.g., `parseFloat(product.price)` or use a money library).

---

## Practical Tips & Gotchas

- Use DTOs with `class-validator` to enforce `title` and `price` types/limits.
- Use transactions for multi-step operations to ensure atomicity (e.g., create product + create audit record).
- Avoid `eager: true` on very large relations (use explicit `leftJoinAndSelect` to control queries).
- Add indexes for frequently queried columns (e.g., `creatorId`, `isActive`).
- For many-to-many (Orders ↔ Products) use `@ManyToMany` with `@JoinTable()` on one side and a join table.

---

## Interview questions & short answers ✅

Q: "Why is the foreign key on the many side (Product)?"
A: The many side needs to point to which single owner it belongs to. This is efficient and matches normalized SQL design.

Q: "What's the difference between `eager: true` and `lazy: true`?"
A: `eager: true` auto-fetches the relation in every query; `lazy: true` returns a Promise you must `await` to load the relation. Eager is convenient but can cause N+1 issues.

Q: "How to avoid N+1 queries when fetching products and creators?"
A: Use `QueryBuilder` with `leftJoinAndSelect('product.creator', 'creator')` to perform a single JOINed query.

Q: "When should you use transactions?"
A: When a single logical operation involves multiple DB changes that must all succeed or all fail together (e.g., deduct inventory + create order).

Q: "How to model Orders and Products (Many-to-Many)?"
A: Use `@ManyToMany(() => Product)` with `@JoinTable()` on the owning side, or create an explicit join entity (`OrderItem`) to store quantity, price at purchase, etc.

---

If you want, I can:
- Implement `Product` entity, service, controller, and DTOs for you
- Add tests that assert the `creator` relation and Admin-only creation behavior
- Demonstrate a `leftJoinAndSelect` query to avoid N+1

Tell me which implementation step to take next.