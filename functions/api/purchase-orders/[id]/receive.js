import { getDb } from "../../../../drizzle/db";
import {
  purchaseOrders,
  purchaseOrderItems,
  stock,
} from "../../../../drizzle/schema";
import { eq, sql } from "drizzle-orm";

export async function onRequestPut(context) {
  const { env, params } = context;

  try {
    const id = params.id;
    const db = getDb(env);

    // 1. Check if already received
    const [po] = await db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, id));
    if (!po) {
      return new Response(
        JSON.stringify({ error: "Purchase order not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (po.status === "received") {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Purchase order already marked as received",
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // 2. Get items and update stock
    const items = await db
      .select()
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.purchaseOrderId, id));

    for (const item of items) {
      await db
        .update(stock)
        .set({
          count: sql`${stock.count} + ${item.quantity}`,
          updatedAt: sql`datetime('now')`,
        })
        .where(eq(stock.productId, item.productId));
    }

    // 3. Update the purchase order status to received
    await db
      .update(purchaseOrders)
      .set({
        status: "received",
        receivedAt: sql`datetime('now')`,
      })
      .where(eq(purchaseOrders.id, id));

    return new Response(
      JSON.stringify({
        success: true,
        message: "Purchase order marked as received and stock updated",
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
