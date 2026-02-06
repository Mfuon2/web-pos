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
        stock: products.stock,
        categoryName: categories.name,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id));

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
        .update(products)
        .set({ stock: update.stock })
        .where(eq(products.id, update.id));
    }

    // Perform Inserts using raw SQL to avoid Drizzle including null for id column
    // Batch inserts to avoid D1's SQL variable limit (max ~100 variables per query)
    if (productsToInsert.length > 0) {
      const insertColumns = [
        "name",
        "barcode",
        "price",
        "cost",
        "stock",
        "category_id",
        "created_at",
      ];
      const BATCH_SIZE = 10; // 10 products * 7 columns = 70 variables per batch

      // Process inserts in batches
      for (let i = 0; i < productsToInsert.length; i += BATCH_SIZE) {
        const batch = productsToInsert.slice(i, i + BATCH_SIZE);
        const placeholders = batch
          .map(() => `(?, ?, ?, ?, ?, ?, ?)`)
          .join(", ");
        const values = batch.flatMap((p) => [
          p.name,
          p.barcode,
          p.price,
          p.cost,
          p.stock,
          p.categoryId,
          p.createdAt,
        ]);

        const insertQuery = `INSERT INTO products (${insertColumns.join(", ")}) VALUES ${placeholders}`;
        await env.DB.prepare(insertQuery)
          .bind(...values)
          .run();
      }

      // Fetch all inserted products in batches to avoid variable limit on SELECT too
      // Join with categories to get names for the response
      const allBarcodes = productsToInsert.map((p) => p.barcode);
      for (let i = 0; i < allBarcodes.length; i += BATCH_SIZE) {
        const batchBarcodes = allBarcodes.slice(i, i + BATCH_SIZE);
        const barcodePlaceholders = batchBarcodes.map(() => "?").join(", ");
        const fetchQuery = `
                    SELECT p.*, c.name as category 
                    FROM products p 
                    LEFT JOIN categories c ON p.category_id = c.id 
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
