import { getDb } from "../../drizzle/db";
import { categories } from "../../drizzle/schema";

export async function onRequestPost(context) {
  const { env } = context;
  const db = getDb(env);

  try {
    // 1. Fetch products with old category column using raw SQL
    // This allows us to work even after the Drizzle schema is updated
    const { results: productsToMigrate } = await env.DB.prepare(
      "SELECT id, category, category_id FROM products WHERE category_id IS NULL AND category IS NOT NULL",
    ).all();

    if (productsToMigrate.length === 0) {
      // Check if column exists before trying to drop it
      try {
        await env.DB.prepare("ALTER TABLE products DROP COLUMN category").run();
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

    // 2. Get all categories for mapping
    const allCategories = await db.select().from(categories);
    const categoryMap = new Map(
      allCategories.map((c) => [c.name.toLowerCase(), c.id]),
    );

    let migratedCount = 0;
    let createdCategoryCount = 0;

    for (const product of productsToMigrate) {
      const categoryName = product.category ? product.category.trim() : null;
      if (!categoryName) continue;

      const lowerName = categoryName.toLowerCase();
      let categoryId = categoryMap.get(lowerName);

      // 3. If category doesn't exist, create it
      if (!categoryId) {
        const [newCat] = await db
          .insert(categories)
          .values({
            name: categoryName,
          })
          .returning({ id: categories.id });

        categoryId = newCat.id;
        categoryMap.set(lowerName, categoryId);
        createdCategoryCount++;
      }

      if (categoryId) {
        await env.DB.prepare("UPDATE products SET category_id = ? WHERE id = ?")
          .bind(categoryId, product.id)
          .run();

        migratedCount++;
      }
    }

    // 4. Drop the old category column
    await env.DB.prepare("ALTER TABLE products DROP COLUMN category").run();

    return new Response(
      JSON.stringify({
        success: true,
        migratedCount,
        createdCategoryCount,
        message: `Successfully migrated ${migratedCount} products and removed the legacy 'category' column.`,
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
