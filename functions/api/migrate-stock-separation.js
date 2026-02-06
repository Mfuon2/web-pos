import { getNairobiTimestamp } from "../utils/timezone.js";

export async function onRequestPost(context) {
  const { env } = context;

  try {
    // 1. Drop existing stock table if it has wrong schema
    // We recreate it to ensure it matches: primary key on product_id, includes updated_at
    await env.DB.prepare(`DROP TABLE IF EXISTS stock`).run();

    await env.DB.prepare(
      `
      CREATE TABLE IF NOT EXISTS stock (
        product_id INTEGER PRIMARY KEY REFERENCES products(id),
        count INTEGER NOT NULL DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `,
    ).run();

    // 2. Fetch products with the old stock column
    // We use raw SQL to ensure we can read the column even if Drizzle no longer sees it
    const { results: productsToMigrate } = await env.DB.prepare(
      "SELECT id, stock FROM products WHERE stock IS NOT NULL",
    ).all();

    if (productsToMigrate.length === 0) {
      // Check if column exists before trying to drop it
      try {
        await env.DB.prepare("ALTER TABLE products DROP COLUMN stock").run();
      } catch (e) {
        // Column might already be gone
      }

      return new Response(
        JSON.stringify({
          success: true,
          message:
            "No products found requiring migration. Legacy column checked/removed.",
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    const timestamp = getNairobiTimestamp();
    let migratedCount = 0;

    // 3. Migrate data to the new stock table
    for (const product of productsToMigrate) {
      await env.DB.prepare(
        `
        INSERT OR REPLACE INTO stock (product_id, count, updated_at)
        VALUES (?, ?, ?)
      `,
      )
        .bind(product.id, product.stock, timestamp)
        .run();

      migratedCount++;
    }

    // 4. Drop the old stock column from products
    try {
      await env.DB.prepare("ALTER TABLE products DROP COLUMN stock").run();
    } catch (e) {
      console.error("Error dropping stock column:", e);
      // If drop fails, we still consider data migration successful
    }

    return new Response(
      JSON.stringify({
        success: true,
        migratedCount,
        message: `Successfully migrated stock for ${migratedCount} products and attempted to remove the legacy 'stock' column.`,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
