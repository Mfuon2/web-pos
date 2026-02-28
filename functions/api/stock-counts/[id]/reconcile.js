import { getDb } from "../../../../drizzle/db";
import {
  stockCounts,
  stockCountItems,
  stock,
} from "../../../../drizzle/schema";
import { eq, sql } from "drizzle-orm";

export async function onRequestPost(context) {
  const { request, env, params } = context;
  const { id } = params;

  try {
    const db = getDb(env);
    const stockCountId = parseInt(id);
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required for reconciliation" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // First fetch all items for this stock count
    const items = await db
      .select({
        productId: stockCountItems.productId,
        actualCount: stockCountItems.actualCount,
        variance: stockCountItems.variance,
      })
      .from(stockCountItems)
      .where(eq(stockCountItems.stockCountId, stockCountId));

    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "No items found for this stock count" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Process reconciliation
    // 1. Update the actual stock table
    for (const item of items) {
      if (item.actualCount !== null && item.actualCount !== undefined) {
        await db
          .update(stock)
          .set({
            count: item.actualCount,
            updatedAt: sql`datetime('now')`,
          })
          .where(eq(stock.productId, item.productId));
      }
    }

    // 2. Mark stock count as completed and reconciled
    await db
      .update(stockCounts)
      .set({
        status: "completed",
        reconciledBy: user_id,
        reconciledAt: sql`datetime('now')`,
        updatedAt: sql`datetime('now')`,
      })
      .where(eq(stockCounts.id, stockCountId));

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
