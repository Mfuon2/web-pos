import { getNairobiTimestamp } from '../../utils/timezone.js'
import { getDb } from '../../../drizzle/db'
import { products, categories } from '../../../drizzle/schema'
import { eq, inArray } from 'drizzle-orm'

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const db = getDb(env);
        const { products: newProducts } = await request.json();

        if (!Array.isArray(newProducts) || newProducts.length === 0) {
            return new Response(JSON.stringify({ error: 'No products provided' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate categories exist
        const categoryNames = [...new Set(newProducts.map(p => p.category).filter(Boolean))];
        if (categoryNames.length > 0) {
            const existingCategories = await db.select().from(categories).where(inArray(categories.name, categoryNames));
            const existingNames = new Set(existingCategories.map(c => c.name));

            const invalidCategories = categoryNames.filter(c => !existingNames.has(c));
            if (invalidCategories.length > 0) {
                return new Response(JSON.stringify({
                    error: `Invalid categories: ${invalidCategories.join(', ')}`
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // Get all existing products to check for duplicates and find max barcode
        const allProducts = await db.select().from(products);

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
            const key = `${p.name.trim().toLowerCase()}|${(p.category || '').trim().toLowerCase()}|${parseFloat(p.price).toFixed(2)}`;
            existingProductsMap.set(key, p);
        }

        const timestamp = getNairobiTimestamp();
        const productsToInsert = [];
        const productsToUpdate = [];
        const processedResults = [];

        for (const p of newProducts) {
            const name = String(p.name || '').trim();
            const category = String(p.category || '').trim();
            const price = parseFloat(p.price);
            const stockToAdd = parseInt(p.stock) || 0;
            const cost = parseFloat(p.cost) || 0;

            const key = `${name.toLowerCase()}|${category.toLowerCase()}|${price.toFixed(2)}`;
            const existingProduct = existingProductsMap.get(key);

            if (existingProduct) {
                // Product exists with same name, category, and price - Update Stock
                const newStock = (existingProduct.stock || 0) + stockToAdd;

                // Add to update list
                productsToUpdate.push({
                    id: existingProduct.id,
                    stock: newStock
                });

                processedResults.push({
                    ...existingProduct,
                    stock: newStock,
                    _action: 'updated'
                });
            } else {
                // New product - Insert
                maxBarcode++;
                productsToInsert.push({
                    name,
                    price,
                    cost,
                    stock: stockToAdd,
                    category: category || null,
                    barcode: maxBarcode.toString(),
                    createdAt: timestamp
                });
            }
        }

        // Perform Updates
        for (const update of productsToUpdate) {
            await db.update(products)
                .set({ stock: update.stock })
                .where(eq(products.id, update.id));
        }

        // Perform Inserts using raw SQL to avoid Drizzle including null for id column
        if (productsToInsert.length > 0) {
            // Build a batch insert query without the id column
            const insertColumns = ['name', 'barcode', 'price', 'cost', 'stock', 'category', 'created_at'];
            const placeholders = productsToInsert.map(() => `(?, ?, ?, ?, ?, ?, ?)`).join(', ');
            const values = productsToInsert.flatMap(p => [
                p.name,
                p.barcode,
                p.price,
                p.cost,
                p.stock,
                p.category,
                p.createdAt
            ]);

            const insertQuery = `INSERT INTO products (${insertColumns.join(', ')}) VALUES ${placeholders}`;

            // Execute raw SQL insert
            await env.DB.prepare(insertQuery).bind(...values).run();

            // Fetch the inserted products to return them
            const barcodes = productsToInsert.map(p => p.barcode);
            const barcodePlaceholders = barcodes.map(() => '?').join(', ');
            const fetchQuery = `SELECT * FROM products WHERE barcode IN (${barcodePlaceholders})`;
            const insertedResults = await env.DB.prepare(fetchQuery).bind(...barcodes).all();

            processedResults.push(...insertedResults.results.map(p => ({ ...p, _action: 'created' })));
        }

        return new Response(JSON.stringify({
            success: true,
            count: processedResults.length,
            updated: productsToUpdate.length,
            created: productsToInsert.length,
            products: processedResults
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        // Include the underlying error cause if available
        const errorMessage = error.cause ? `${error.message} - Cause: ${error.cause.message || error.cause}` : error.message;
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
