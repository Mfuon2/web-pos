import { getDb } from "../../../drizzle/db";
import {
  stockCounts,
  stockCountItems,
  stock,
  products,
} from "../../../drizzle/schema";
import { desc, count, sql, eq } from "drizzle-orm";

export async function onRequestGet(context) {
  const { env, request } = context;

  try {
    const db = getDb(env);
    const url = new URL(request.url);
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");

    let query = db
      .select({
        id: stockCounts.id,
        status: stockCounts.status,
        countedBy: stockCounts.countedBy,
        reconciledBy: stockCounts.reconciledBy,
        reconciledAt: stockCounts.reconciledAt,
        countDate: stockCounts.countDate,
        notes: stockCounts.notes,
        createdAt: stockCounts.createdAt,
        updatedAt: stockCounts.updatedAt,
        hasDiscrepancy:
          sql`EXISTS(SELECT 1 FROM stock_count_items items WHERE items.stock_count_id = stock_counts.id AND items.variance != 0)`.as(
            "hasDiscrepancy",
          ),
      })
      .from(stockCounts)
      .orderBy(desc(stockCounts.createdAt));

    let countQuery = db.select({ total: count() }).from(stockCounts);

    if (pageParam) {
      const page = parseInt(pageParam) || 1;
      const limit = parseInt(limitParam) || 20;
      const offset = (page - 1) * limit;

      const [{ total }] = await countQuery;
      const results = await query.limit(limit).offset(offset);

      return new Response(
        JSON.stringify({
          data: results,
          meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    } else {
      const results = await query;
      return new Response(JSON.stringify(results), {
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const db = getDb(env);
    const body = await request.json();
    const { counted_by, count_date, notes } = body;

    // Default to 'draft' status if not otherwise specified for logic,
    // but schema has it natively.
    const [scResult] = await db
      .insert(stockCounts)
      .values({
        countedBy: counted_by || null,
        countDate: count_date || sql`date('now')`,
        notes: notes || null,
      })
      .returning({ id: stockCounts.id });

    const stockCountId = scResult.id;

    // Now snap shot the entire system stock and create stock count items.
    // Fetch all products that are not deleted and their current stock
    const currentStock = await db
      .select({
        productId: products.id,
        systemCount: stock.count,
      })
      .from(products)
      .leftJoin(stock, eq(products.id, stock.productId))
      .where(sql`${products.deletedAt} IS NULL`);

    const itemsToInsert = currentStock.map((item) => ({
      stockCountId,
      productId: item.productId,
      systemCount: item.systemCount || 0,
      actualCount: item.systemCount || 0, // Pre-fill with system count to make counting easier
      variance: 0,
    }));

    if (itemsToInsert.length > 0) {
      // Use raw D1 batch to avoid Drizzle v0.44 bug that includes `id: null`
      // in AUTOINCREMENT bulk inserts, which D1/SQLite rejects.
      const statements = itemsToInsert.map((item) =>
        env.DB.prepare(
          `INSERT INTO stock_count_items (stock_count_id, product_id, system_count, actual_count, variance)
           VALUES (?, ?, ?, ?, ?)`,
        ).bind(
          item.stockCountId,
          item.productId,
          item.systemCount,
          item.actualCount,
          item.variance,
        ),
      );
      await env.DB.batch(statements);
    }

    return new Response(
      JSON.stringify({
        success: true,
        id: stockCountId,
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
