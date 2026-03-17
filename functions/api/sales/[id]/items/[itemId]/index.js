import { getDb } from "../../../../../../drizzle/db";
import { saleItems, sales } from "../../../../../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export async function onRequestPatch(context) {
  const { request, env, params } = context;
  const { id, itemId } = params;

  try {
    const db = getDb(env);
    const saleId = parseInt(id, 10);
    const saleItemId = parseInt(itemId, 10);
    const body = await request.json();
    const { price, quantity } = body;

    if (
      typeof price !== "number" ||
      price < 0 ||
      typeof quantity !== "number" ||
      quantity < 1
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid price or quantity" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // 1. Update the specific sale item
    await db
      .update(saleItems)
      .set({ price, quantity })
      .where(and(eq(saleItems.saleId, saleId), eq(saleItems.id, saleItemId)));

    // 2. Fetch all items for this sale to calculate new total
    const allItems = await db
      .select({ price: saleItems.price, quantity: saleItems.quantity })
      .from(saleItems)
      .where(eq(saleItems.saleId, saleId));

    let newTotal = 0;
    for (const item of allItems) {
      newTotal += (item.price || 0) * (item.quantity || 0);
    }

    // 3. Update the sales table with the new total
    await db
      .update(sales)
      .set({ total: newTotal })
      .where(eq(sales.id, saleId));

    return new Response(
      JSON.stringify({
        success: true,
        message: "Sale item updated successfully",
        newTotal,
      }),
      {
        status: 200,
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
