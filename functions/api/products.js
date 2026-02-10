import { getNairobiTimestamp } from "../utils/timezone.js";
import { getDb } from "../../drizzle/db";
import { products, categories, stock } from "../../drizzle/schema";
import { count, desc, lt, eq, or, like } from "drizzle-orm";

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const pageParam = url.searchParams.get("page");
  const limitParam = url.searchParams.get("limit");
  const lowStockParam = url.searchParams.get("low_stock");
  const searchParam = url.searchParams.get("search");

  try {
    const db = getDb(env);

    // Initial query blocks
    let countQuery = db
      .select({ total: count() })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(stock, eq(products.id, stock.productId));

    let dataQuery = db
      .select({
        id: products.id,
        name: products.name,
        barcode: products.barcode,
        price: products.price,
        cost: products.cost,
        stock: stock.count,
        category: categories.name,
        categoryId: products.categoryId,
        image: products.image,
        deleted_at: products.deletedAt,
        created_at: products.createdAt,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(stock, eq(products.id, stock.productId));

    // Apply Filter: Low Stock
    if (lowStockParam === "true") {
      const lowStockFilter = lt(stock.count, 1);
      countQuery = countQuery.where(lowStockFilter);
      dataQuery = dataQuery.where(lowStockFilter);
    }

    // Apply Filter: Search
    if (searchParam) {
      const searchFilter = or(
        like(products.name, `%${searchParam}%`),
        like(products.barcode, `%${searchParam}%`),
        like(categories.name, `%${searchParam}%`),
      );
      countQuery = countQuery.where(searchFilter);
      dataQuery = dataQuery.where(searchFilter);
    }

    if (pageParam) {
      const page = parseInt(pageParam) || 1;
      const limit = parseInt(limitParam) || 20;
      const offset = (page - 1) * limit;

      const results = await dataQuery
        .orderBy(desc(products.createdAt))
        .limit(limit)
        .offset(offset);

      const [{ total }] = await countQuery;

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
      // Non-paginated (e.g., for export or bulk views)
      const results = await dataQuery.orderBy(desc(products.createdAt));
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
    const { name, price, stock: stockCount, barcode, categoryId, cost } = body;

    const result = await db
      .insert(products)
      .values({
        name,
        price,
        barcode,
        categoryId: categoryId || null,
        cost: cost || 0,
        createdAt: getNairobiTimestamp(),
      })
      .returning({ id: products.id });

    const productId = result[0].id;

    // Insert initial stock
    await db.insert(stock).values({
      productId,
      count: stockCount || 0,
      updatedAt: getNairobiTimestamp(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        id: productId,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Add product error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
