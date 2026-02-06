# Deployment Instructions: Product-Category Standardization

This change refactors the `products` table to use a `categoryId` foreign key instead of a string-based `category` name.

## 1. Local Development Deployment

If you have already applied the schema change and run the migration once:

- **Run the final migration**: This will drop the legacy `category` column.
  ```bash
  curl -X POST http://localhost:8788/api/migrate-categories
  ```

## 2. Production / Remote Deployment

To apply these changes to your production (remote) database, follow these steps in order:

### Step 1: Add the new column

Run the following Wrangler command to add the `category_id` column to your remote D1 database:

```bash
npx wrangler d1 execute pos_database --remote --command="ALTER TABLE products ADD COLUMN category_id INTEGER REFERENCES categories(id);"
```

### Step 2: Push the code changes

Deploy your updated backend and frontend code to Cloudflare Pages.

### Step 3: Run the migration script

Send a POST request to your production endpoint to migrate the data and remove the old column:

```bash
curl -X POST https://your-app.pages.dev/api/migrate-categories
```

_(Replace `your-app.pages.dev` with your actual production URL)_

> [!WARNING]
> Ensure you run Step 3 immediately after deploying the code to avoid data inconsistencies.

### Step 4: Final Cleanup

Once the migration is successful, you can delete the following files:

- `functions/api/migrate-categories.js`
- `deployment_instructions.md`
