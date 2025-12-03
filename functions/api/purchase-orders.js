// GET /api/purchase-orders - Fetch all purchase orders
// POST /api/purchase-orders - Create a new purchase order
// PUT /api/purchase-orders/:id/receive - Mark purchase order as received

export async function onRequestGet(context) {
    const { env, request } = context;

    try {
        const url = new URL(request.url);
        const startDate = url.searchParams.get('start_date');
        const endDate = url.searchParams.get('end_date');
        const status = url.searchParams.get('status');
        const pageParam = url.searchParams.get('page');
        const limitParam = url.searchParams.get('limit');

        let query = 'SELECT * FROM purchase_orders';
        const params = [];
        let countQuery = 'SELECT COUNT(*) as total FROM purchase_orders';
        const countParams = [];
        const conditions = [];

        if (startDate && endDate) {
            conditions.push('created_at BETWEEN ? AND ?');
            params.push(startDate, endDate);
            countParams.push(startDate, endDate);
        }

        if (status) {
            conditions.push('status = ?');
            params.push(status);
            countParams.push(status);
        }

        if (conditions.length > 0) {
            const whereClause = ' WHERE ' + conditions.join(' AND ');
            query += whereClause;
            countQuery += whereClause;
        }

        query += ' ORDER BY created_at DESC';

        if (pageParam) {
            const page = parseInt(pageParam) || 1;
            const limit = parseInt(limitParam) || 20;
            const offset = (page - 1) * limit;

            query += ' LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const { total } = await env.DB.prepare(countQuery).bind(...countParams).first();
            const { results } = await env.DB.prepare(query).bind(...params).all();

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
            const { results } = await env.DB.prepare(query).bind(...params).all();

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
        const body = await request.json();
        const { supplier_id, total, status, received_at, notes, items } = body;

        // Insert the purchase order
        const poResult = await env.DB.prepare(
            'INSERT INTO purchase_orders (supplier_id, total, status, received_at, created_at, notes) VALUES (?, ?, ?, ?, datetime("now"), ?)'
        ).bind(
            supplier_id || null,
            total,
            status || 'pending',
            received_at || null,
            notes || null
        ).run();

        const purchaseOrderId = poResult.meta.last_row_id;

        // Insert purchase order items if provided
        if (items && Array.isArray(items)) {
            for (const item of items) {
                await env.DB.prepare(
                    'INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, cost) VALUES (?, ?, ?, ?)'
                ).bind(
                    purchaseOrderId,
                    item.product_id,
                    item.quantity,
                    item.cost
                ).run();
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
