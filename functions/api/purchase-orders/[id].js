import { getDb } from "../../../drizzle/db";
import {
  purchaseOrders,
  purchaseOrderItems,
  stock,
} from "../../../drizzle/schema";
import { eq, sql } from "drizzle-orm";

export async function onRequestDelete(context) {
  const { env, params } = context;
  const id = params.id;

  try {
    const db = getDb(env);

    // 1. Get current status of the purchase order
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

    // 2. If status is 'received', reverse stock updates
    if (po.status === "received") {
      const items = await db
        .select()
        .from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.purchaseOrderId, id));

      for (const item of items) {
        await db
          .update(stock)
          .set({
            count: sql`${stock.count} - ${item.quantity}`,
            updatedAt: sql`datetime('now')`,
          })
          .where(eq(stock.productId, item.productId));
      }
    }

    // 3. Soft delete the purchase order
    await db
      .update(purchaseOrders)
      .set({
        status: "deleted",
      })
      .where(eq(purchaseOrders.id, id));

    return new Response(
      JSON.stringify({
        success: true,
        message: "Purchase order deleted successfully (soft delete)",
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
