# Deployment Instructions

## 1. Product-Category Standardization

This change refactors the `products` table to use a `categoryId` foreign key instead of a string-based `category` name.

### Local Development Deployment

If you have already applied the schema change and run the migration once:

- **Run the final migration**: This will drop the legacy `category` column.
  ```bash
  curl -X POST http://localhost:8788/api/migrate-categories
  ```

### Production / Remote Deployment

To apply these changes to your production (remote) database, follow these steps in order:

#### Step 1: Add the new column

Run the following Wrangler command to add the `category_id` column to your remote D1 database:

```bash
npx wrangler d1 execute pos_database --remote --command="ALTER TABLE products ADD COLUMN category_id INTEGER REFERENCES categories(id);"
```

#### Step 2: Push the code changes

Deploy your updated backend and frontend code to Cloudflare Pages.

#### Step 3: Run the migration script

Send a POST request to your production endpoint to migrate the data and remove the old column:

```bash
curl -X POST https://your-app.pages.dev/api/migrate-categories
```

---

## 2. Product-Stock Separation

This change separates the `stock` count from the `products` table into a dedicated `stock` table.

### Local Development Deployment

Run the migration script to create the new table, transfer data, and remove the old column:

```bash
curl -X POST http://localhost:8788/api/migrate-stock-separation
```

### Production / Remote Deployment

To apply these changes to your production (remote) database:

#### Step 1: Push the code changes

Deploy your updated backend and frontend code to Cloudflare Pages. This ensures the API knows how to handle the new `stock` table.

#### Step 2: Run the migration script

Send a POST request to your production endpoint to migrate the data and remove the old column:

```bash
curl -X POST https://your-app.pages.dev/api/migrate-stock-separation
```

_(Replace `your-app.pages.dev` with your actual production URL)_

---

## 3. Borrowed Item Management Refactor

This change adds `returned_quantity` and `paid_quantity` tracking, along with automated expense recording for borrowed items.

### Local Development Deployment

Run the migration scripts in order:

```bash
curl -X POST http://localhost:8788/api/migrate-borrowed-items
curl -X POST http://localhost:8788/api/migrate-borrowed-items-v2
curl -X POST http://localhost:8788/api/migrate-expenses-v2
```

### Production / Remote Deployment

To apply these changes to your production (remote) database:

#### Step 1: Push the code changes

Deploy your updated backend and frontend code to Cloudflare Pages.

> [!IMPORTANT]
> The migration scripts and temporary RBAC changes must be pushed to allow the migrations to run.

#### Step 2: Run the migration scripts

Send POST requests to your production endpoint in order:

```bash
curl -X POST https://your-app.pages.dev/api/migrate-borrowed-items
curl -X POST https://your-app.pages.dev/api/migrate-borrowed-items-v2
curl -X POST https://your-app.pages.dev/api/migrate-expenses-v2
```

### Final Cleanup

Once all migrations are successful and you've verified everything is working, you must perform the following cleanup:

1.  **Delete Migration Scripts**: Remove the following files:
    - `functions/api/migrate-categories.js`
    - `functions/api/migrate-stock-separation.js`
    - `functions/api/migrate-borrowed-items.js`
    - `functions/api/migrate-borrowed-items-v2.js`
    - `functions/api/migrate-expenses-v2.js`

2.  **Revert Security Changes**: If you modified `functions/utils/rbac.js` to make the migration script public, ensure those changes are reverted and redeployed.

3.  **Delete This File**: Once everything is deployed and verified, you can delete `deployment_instructions.md`.
