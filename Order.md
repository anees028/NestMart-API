# Order module (src/orders)

## ✅ Overview

The Order module implements order creation and retrieval for the store. It links users to products (many-to-many) and stores a simple order status. The module focuses on basic ordering logic: accepting product IDs from a logged-in user, validating products exist, persisting the order, and exposing a simple `GET /orders` endpoint.

---

## 🔧 Files

- `src/orders/orders.controller.ts` — Controller that defines HTTP endpoints.
- `src/orders/orders.service.ts` — Business logic (create order, list orders).
- `src/orders/orders.module.ts` — Module declaration (TypeORM entities registration).
- `src/orders/entities/order.entity.ts` — Order entity (columns & relations).
- `src/orders/dto/create-order.dto.ts` — DTO for creating orders (validation + Swagger metadata).
- `src/orders/dto/update-order.dto.ts` — Partial type of create DTO for updates.
- `src/orders/orders.controller.spec.ts` & `src/orders/orders.service.spec.ts` — Basic spec files.

---

## 📚 Data model (Order entity)

Defined in `src/orders/entities/order.entity.ts`.

Key fields:

- `id: number` — Primary key (auto-generated).
- `status: string` — Default `'PENDING'` (e.g., `PENDING`, `SHIPPED`).
- `user: User` — `@ManyToOne` relation to `User` (who placed the order).
- `products: Product[]` — `@ManyToMany` relation to `Product` with `@JoinTable()` on the Order side (TypeORM creates the junction table).

Notes:
- The module relies on the `Product` and `User` models defined elsewhere: `src/products/entities/product.entity.ts` and `src/users/user.entity.ts`.

---

## 🧾 DTOs & validation

- `CreateOrderDto` (`src/orders/dto/create-order.dto.ts`)
  - `productIds: number[]`
  - Class-validated with `@IsArray()` and `@IsNumber({}, { each: true })` to ensure each item is a number.
  - Documented with `@ApiProperty` for Swagger.

- `UpdateOrderDto` extends `PartialType(CreateOrderDto)` (no custom fields currently).

---

## 🔌 Endpoints

1) Create order
- Method: POST
- Path: `/orders`
- Auth: **Required** — `@UseGuards(AuthGuard('jwt'))` (reads `req.user` from JWT)
- Body: `CreateOrderDto` JSON: `{ "productIds": [1, 2] }`
- Handler: `OrdersController.create()` → `OrdersService.create(createOrderDto, req.user)`

Behavior:
- Service finds products with `productRepo.findBy({ id: In(productIds) })`.
- If the number of found products differs from the provided IDs, a `NotFoundException('Some products were not found')` is thrown.
- Creates `Order` with default status `PENDING`, links `user` and `products`, and saves it (`orderRepo.save(order)`).

2) List orders
- Method: GET
- Path: `/orders`
- Auth: None (public)
- Handler: `OrdersController.findAll()` → `OrdersService.findAll()`
- Behavior: Returns orders with relations loaded: `relations: ['products', 'user']`.

---

## ❗ Error handling & edge cases

- If any provided product ID does not exist, the service throws `NotFoundException('Some products were not found')`.
- There is no handling for duplicate product IDs (they will be de-duplicated by the SQL selection or stored as duplicates depending on junction constraints).
- No transactional behavior for stock reservation / decrementing inventory (not implemented).

---

## 💡 Example requests

Create order (requires JWT):

curl example:

```bash
curl -X POST http://localhost:3000/orders \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"productIds": [1, 2]}'
```

Possible successful response (example):

```json
{
  "id": 10,
  "status": "PENDING",
  "user": { "id": 1, "name": "Alice", "email": "alice@example.com", "role": "User" },
  "products": [
    { "id": 1, "title": "Product A", "price": 9.99, "isActive": true },
    { "id": 2, "title": "Product B", "price": 5.00, "isActive": true }
  ]
}
```

List orders:

```bash
curl http://localhost:3000/orders
```

---

## 🧪 Tests

- There are basic spec files: `src/orders/orders.controller.spec.ts` and `src/orders/orders.service.spec.ts`, but they only assert the module/controller/service is defined. No behavior tests (e.g., for create) exist yet.
- To run tests: `npm test` or `npm run test`.

---

## 🔭 Suggestions & TODOs

- Add unit/integration tests for `OrdersService.create()`:
  - Success path (valid product IDs)
  - Failure path (missing product ID)
  - Ensure user is linked correctly
- Add endpoint(s) to update order status (e.g., `PATCH /orders/:id/status`) with role-based access (admin).
- Add total price calculation and store it on the order, or compute on demand.
- Consider adding quantity support (per product) instead of just product ID arrays.
- Consider adding transactional logic if product stock or reservation is needed.
- Add pagination and optional filtering to `GET /orders` for production loads.
- Lock down `GET /orders` to admins or to only return the calling user's orders depending on business requirements.

---

## 🔗 References

- Controller: `src/orders/orders.controller.ts`
- Service: `src/orders/orders.service.ts`
- Entity: `src/orders/entities/order.entity.ts`
- DTOs: `src/orders/dto/create-order.dto.ts`, `src/orders/dto/update-order.dto.ts`

---

If you'd like, I can extend this doc with diagrams (ERD), add example Postman collection snippets, or implement any of the TODO items above (tests, status updates, pricing). ✅
