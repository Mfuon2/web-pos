import { getDb } from "../../../drizzle/db";
import {
  stockCounts,
  stockCountItems,
  products,
} from "../../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

export async function onRequestGet(context) {
  const { request, env, params } = context;
  const { id } = params;

  try {
    const db = getDb(env);
    const stockCountId = parseInt(id);

    const [stockCount] = await db
      .select()
      .from(stockCounts)
      .where(eq(stockCounts.id, stockCountId));

    if (!stockCount) {
      return new Response(JSON.stringify({ error: "Stock count not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const items = await db
      .select({
        id: stockCountItems.id,
        productId: stockCountItems.productId,
        productName: products.name,
        productBarcode: products.barcode,
        productCategory: products.categoryId,
        systemCount: stockCountItems.systemCount,
        actualCount: stockCountItems.actualCount,
        variance: stockCountItems.variance,
        reason: stockCountItems.reason,
      })
      .from(stockCountItems)
      .innerJoin(products, eq(stockCountItems.productId, products.id))
      .where(eq(stockCountItems.stockCountId, stockCountId));

    stockCount.items = items;

    return new Response(JSON.stringify(stockCount), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function onRequestPut(context) {
  const { request, env, params } = context;
  const { id } = params;

  try {
    const db = getDb(env);
    const stockCountId = parseInt(id);
    const body = await request.json();
    const { status, notes, items } = body;

    // Update the main record
    await db
      .update(stockCounts)
      .set({
        status: status || undefined,
        notes: notes !== undefined ? notes : undefined,
        updatedAt: sql`datetime('now')`,
      })
      .where(eq(stockCounts.id, stockCountId));

    // Update items if provided (assuming the client sends the entire list of modified items)
    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (item.id) {
          // If the item provides an ID, update it
          await db
            .update(stockCountItems)
            .set({
              actualCount: item.actualCount,
              variance: item.variance,
              reason: item.reason,
            })
            .where(
              and(
                eq(stockCountItems.id, item.id),
                eq(stockCountItems.stockCountId, stockCountId),
              ),
            );
        } else if (item.productId) {
          // Fallback just in case the client only has productId
          await db
            .update(stockCountItems)
            .set({
              actualCount: item.actualCount,
              variance: item.variance,
              reason: item.reason,
            })
            .where(
              and(
                eq(stockCountItems.productId, item.productId),
                eq(stockCountItems.stockCountId, stockCountId),
              ),
            );
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
