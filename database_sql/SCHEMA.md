# Kulu database schema

## Tables

| Table | Purpose |
|-------|---------|
| `users` | Firebase-linked accounts (`user` / `admin` / `seller`) + optional `fcm_token` |
| `personal_access_tokens` | Laravel Sanctum API tokens |
| `categories` | Product categories |
| `products` | Catalog; `price` is DECIMAL(12,2); stock is unsigned int |
| `orders` | Customer orders; server-calculated `total_amount` |
| `order_items` | Line items with frozen `unit_price` |
| `messages` | User ↔ admin chat |
| `payments` | Chapa (and future) payment attempts |

## Money
Always `DECIMAL(12,2)` — never FLOAT/DOUBLE.

## Order status
`pending → confirmed → processing → shipped → delivered`  
`cancelled` restores stock.

## Payment status (`orders.payment_status`)
`unpaid` | `pending` | `paid` | `failed` | (internal: amount_mismatch)

## Payment row status (`payments.status`)
`pending` | `success` | `failed` | `superseded` | `amount_mismatch` | `currency_mismatch`

## Install options
1. **Migrations:** `php artisan migrate`
2. **SQL import:** `database_sql/kulu_database_full.sql` via phpMyAdmin

Both produce the same final schema.

## Migrate existing installs (remove seller role)
```sql
UPDATE users SET role = 'user' WHERE role = 'seller';
-- Then alter enum if MySQL allows:
-- ALTER TABLE users MODIFY role ENUM('user','admin') NOT NULL DEFAULT 'user';
```
