import { getNairobiTimestamp } from "../../../../../utils/timezone.js";
import { getDb } from "../../../../../../drizzle/db";
import { saleItems } from "../../../../../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export async function onRequestPatch(context) {
  const { request, env, params } = context;
  const { id, itemId } = params;

  console.log({ params, env });

  try {
    const db = getDb(env);
    const saleId = parseInt(id, 10);
    const saleItemId = parseInt(itemId, 10);
    const timestamp = getNairobiTimestamp();
    const body = await request.json();
    const { verifiedBy } = body;

    await db
      .update(saleItems)
      .set({
        paymentStatus: "verified",
        verifiedBy,
        verifiedAt: timestamp,
      })
      .where(and(eq(saleItems.saleId, saleId), eq(saleItems.id, saleItemId)));

    return new Response(
      JSON.stringify({
        success: true,
        message: "Sale item payment verified",
        verifiedAt: timestamp,
        verifiedBy,
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
