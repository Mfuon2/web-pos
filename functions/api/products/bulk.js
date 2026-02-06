import { getNairobiTimestamp } from "../../utils/timezone.js";
import { getDb } from "../../../drizzle/db";
import { products, categories } from "../../../drizzle/schema";
import { eq, inArray } from "drizzle-orm";

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const db = getDb(env);
    const { products: newProducts } = await request.json();

    if (!Array.isArray(newProducts) || newProducts.length === 0) {
      return new Response(JSON.stringify({ error: "No products provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate categories and create a map
    const categoryNames = [
      ...new Set(newProducts.map((p) => p.category).filter(Boolean)),
    ];
    const categoryMap = new Map();

    if (categoryNames.length > 0) {
      const existingCategories = await db
        .select()
        .from(categories)
        .where(inArray(categories.name, categoryNames));
      const existingNames = new Set(existingCategories.map((c) => c.name));

      const invalidCategories = categoryNames.filter(
        (c) => !existingNames.has(c),
      );
      if (invalidCategories.length > 0) {
        return new Response(
          JSON.stringify({
            error: `Invalid categories: ${invalidCategories.join(", ")}`,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      existingCategories.forEach((c) =>
        categoryMap.set(c.name.toLowerCase(), c.id),
      );
    }

    // Get all existing products with category names to check for duplicates and find max barcode
    const allProducts = await db
      .select({
        id: products.id,
        name: products.name,
        barcode: products.barcode,
        price: products.price,
        stock: stock.count,
        categoryName: categories.name,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(stock, eq(products.id, stock.productId));

    let maxBarcode = 1000000000;
    const existingProductsMap = new Map(); // Key: "name|category|price", Value: product

    for (const p of allProducts) {
      // Track max barcode
      const barcode = parseInt(p.barcode);
      if (!isNaN(barcode) && barcode > maxBarcode) {
        maxBarcode = barcode;
      }

      // Map existing products for quick lookup
      // Key format: name|category|price (normalized)
      const key = `${p.name.trim().toLowerCase()}|${(p.categoryName || "").trim().toLowerCase()}|${parseFloat(p.price).toFixed(2)}`;
      existingProductsMap.set(key, p);
    }

    const timestamp = getNairobiTimestamp();
    const productsToInsert = [];
    const productsToUpdate = [];
    const processedResults = [];

    for (const p of newProducts) {
      const name = String(p.name || "").trim();
      const categoryName = String(p.category || "").trim();
      const price = parseFloat(p.price);
      const stockToAdd = parseInt(p.stock) || 0;
      const cost = parseFloat(p.cost) || 0;
      const categoryId = categoryMap.get(categoryName.toLowerCase()) || null;

      const key = `${name.toLowerCase()}|${categoryName.toLowerCase()}|${price.toFixed(2)}`;
      const existingProduct = existingProductsMap.get(key);

      if (existingProduct) {
        // Product exists with same name, category, and price - Update Stock
        const newStock = (existingProduct.stock || 0) + stockToAdd;

        // Add to update list
        productsToUpdate.push({
          id: existingProduct.id,
          stock: newStock,
        });

        processedResults.push({
          ...existingProduct,
          stock: newStock,
          category: categoryName,
          _action: "updated",
        });
      } else {
        // New product - Insert
        maxBarcode++;
        productsToInsert.push({
          name,
          price,
          cost,
          stock: stockToAdd,
          categoryId,
          barcode: maxBarcode.toString(),
          createdAt: timestamp,
        });
      }
    }

    // Perform Updates
    for (const update of productsToUpdate) {
      await db
        .update(stock)
        .set({ count: update.stock, updatedAt: timestamp })
        .where(eq(stock.productId, update.id));
    }

    // Perform Inserts using raw SQL to avoid Drizzle including null for id column
    // Batch inserts to avoid D1's SQL variable limit (max ~100 variables per query)
    if (productsToInsert.length > 0) {
      const productColumns = [
        "name",
        "barcode",
        "price",
        "cost",
        "category_id",
        "created_at",
      ];
      const BATCH_SIZE = 10;

      // Process inserts in batches
      for (let i = 0; i < productsToInsert.length; i += BATCH_SIZE) {
        const batch = productsToInsert.slice(i, i + BATCH_SIZE);

        // 1. Insert products and get their IDs
        // Note: SQLite batching is safer with individual IDs if we need them,
        // but for bulk import we can use RETURNING or just rely on barcode/timestamp if needed.
        // However, we need to link STOCK to the new IDs.

        for (const p of batch) {
          const [result] = await db
            .insert(products)
            .values({
              name: p.name,
              barcode: p.barcode,
              price: p.price,
              cost: p.cost,
              categoryId: p.categoryId,
              createdAt: p.createdAt,
            })
            .returning({ id: products.id });

          const productId = result.id;

          await db.insert(stock).values({
            productId: productId,
            count: p.stock,
            updatedAt: timestamp,
          });
        }
      }

      // Fetch all inserted products in batches to avoid variable limit on SELECT too
      // Join with categories to get names for the response
      const allBarcodes = productsToInsert.map((p) => p.barcode);
      for (let i = 0; i < allBarcodes.length; i += BATCH_SIZE) {
        const batchBarcodes = allBarcodes.slice(i, i + BATCH_SIZE);
        const barcodePlaceholders = batchBarcodes.map(() => "?").join(", ");
        const fetchQuery = `
                    SELECT p.*, c.name as category, s.count as stock
                    FROM products p 
                    LEFT JOIN categories c ON p.category_id = c.id 
                    LEFT JOIN stock s ON p.id = s.product_id
                    WHERE p.barcode IN (${barcodePlaceholders})`;
        const insertedResults = await env.DB.prepare(fetchQuery)
          .bind(...batchBarcodes)
          .all();
        processedResults.push(
          ...insertedResults.results.map((p) => ({
            ...p,
            _action: "created",
            deleted_at: p.deleted_at,
            created_at: p.created_at,
          })),
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        count: processedResults.length,
        updated: productsToUpdate.length,
        created: productsToInsert.length,
        products: processedResults,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    // Include the underlying error cause if available
    const errorMessage = error.cause
      ? `${error.message} - Cause: ${error.cause.message || error.cause}`
      : error.message;
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
