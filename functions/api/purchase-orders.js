import { getDb } from '../../drizzle/db'
import { purchaseOrders, purchaseOrderItems } from '../../drizzle/schema'
import { and, between, count, desc, eq, sql } from 'drizzle-orm'

export async function onRequestGet(context) {
    const { env, request } = context;

    try {
        const db = getDb(env);
        const url = new URL(request.url);
        const startDate = url.searchParams.get('start_date');
        const endDate = url.searchParams.get('end_date');
        const status = url.searchParams.get('status');
        const pageParam = url.searchParams.get('page');
        const limitParam = url.searchParams.get('limit');

        const conditions = [];

        if (startDate && endDate) {
            conditions.push(between(purchaseOrders.createdAt, startDate, endDate));
        }

        if (status) {
            conditions.push(eq(purchaseOrders.status, status));
        }

        let query = db.select().from(purchaseOrders);
        let countQuery = db.select({ total: count() }).from(purchaseOrders);

        if (conditions.length > 0) {
            const whereClause = and(...conditions);
            query = query.where(whereClause);
            countQuery = countQuery.where(whereClause);
        }

        query = query.orderBy(desc(purchaseOrders.createdAt));

        if (pageParam) {
            const page = parseInt(pageParam) || 1;
            const limit = parseInt(limitParam) || 20;
            const offset = (page - 1) * limit;

            const [{ total }] = await countQuery;
            const results = await query.limit(limit).offset(offset);

            return new Response(JSON.stringify({
                data: results,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            const results = await query;

            return new Response(JSON.stringify(results), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const db = getDb(env);
        const body = await request.json();
        const { supplier_id, total, status: poStatus, received_at, notes, items, createdAt } = body;

        // Insert the purchase order
        const [poResult] = await db.insert(purchaseOrders).values({
            supplierId: supplier_id || null,
            total,
            status: poStatus || 'pending',
            receivedAt: received_at || null,
            notes: notes || null,
            createdAt: createdAt || sql`datetime('now')`
        }).returning({ id: purchaseOrders.id });

        const purchaseOrderId = poResult.id;

        // Insert purchase order items if provided
        if (items && Array.isArray(items)) {
            for (const item of items) {
                await db.insert(purchaseOrderItems).values({
                    purchaseOrderId,
                    productId: item.product_id,
                    quantity: item.quantity,
                    cost: item.cost
                });
            }
        }

        return new Response(JSON.stringify({
            success: true,
            id: purchaseOrderId
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
