import { getDb } from "../../../../drizzle/db";
import {
  purchaseOrders,
  purchaseOrderItems,
  stock,
  products,
} from "../../../../drizzle/schema";
import { eq, sql } from "drizzle-orm";

export async function onRequestGet(context) {
  const { env, params } = context;

  try {
    const id = params.id;
    const db = getDb(env);

    const items = await db
      .select({
        id: purchaseOrderItems.id,
        productId: purchaseOrderItems.productId,
        productName: products.name,
        quantity: purchaseOrderItems.quantity,
        cost: purchaseOrderItems.cost,
      })
      .from(purchaseOrderItems)
      .leftJoin(products, eq(purchaseOrderItems.productId, products.id))
      .where(eq(purchaseOrderItems.purchaseOrderId, id));

    return new Response(JSON.stringify(items), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function onRequestPost(context) {
  const { request, env, params } = context;

  try {
    const poId = params.id;
    const db = getDb(env);
    const body = await request.json();
    const { product_id, quantity, cost } = body;

    // 1. Check PO status
    const [po] = await db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, poId));
    if (!po) throw new Error("Purchase order not found");

    // 2. Insert item
    const [result] = await db
      .insert(purchaseOrderItems)
      .values({
        purchaseOrderId: parseInt(poId),
        productId: product_id,
        quantity,
        cost,
      })
      .returning({ id: purchaseOrderItems.id });

    // 3. Update stock if received
    if (po.status === "received") {
      await db
        .update(stock)
        .set({
          count: sql`${stock.count} + ${quantity}`,
          updatedAt: sql`datetime('now')`,
        })
        .where(eq(stock.productId, product_id));
    }

    // 4. Update PO total
    await db
      .update(purchaseOrders)
      .set({
        total: sql`${purchaseOrders.total} + (${quantity} * ${cost})`,
      })
      .where(eq(purchaseOrders.id, poId));

    return new Response(
      JSON.stringify({
        success: true,
        id: result.id,
      }),
      {
        status: 201,
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
