import { getNairobiTimestamp } from '../../utils/timezone.js';

// GET /api/sales - Fetch all sales with their items
// POST /api/sales - Create a new sale transaction

export async function onRequestGet(context) {
    const { env } = context;

    try {
        // Get all sales
        const { results: sales } = await env.DB.prepare(`
            SELECT 
                s.id,
                s.total,
                s.payment_method,
                s.created_at
            FROM sales s
            ORDER BY s.created_at DESC
        `).all();

        // For each sale, get the items from sale_items table
        const salesWithItems = await Promise.all(sales.map(async (sale) => {
            const { results: items } = await env.DB.prepare(`
                SELECT 
                    si.id,
                    si.quantity,
                    si.price,
                    p.name as product_name,
                    p.id as product_id
                FROM sale_items si
                LEFT JOIN products p ON si.product_id = p.id
                WHERE si.sale_id = ?
            `).bind(sale.id).all();

            return {
                ...sale,
                items: items
            };
        }));

        return new Response(JSON.stringify(salesWithItems), {
            headers: { 'Content-Type': 'application/json' }
        });
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
        const { items, total, payment_method } = body;

        // Get Nairobi timestamp
        const timestamp = getNairobiTimestamp();

        // Start a transaction - Insert the sale with Nairobi time
        const saleResult = await env.DB.prepare(
            'INSERT INTO sales (total, payment_method, created_at) VALUES (?, ?, ?)'
        ).bind(total, payment_method, timestamp).run();

        const saleId = saleResult.meta.last_row_id;

        // Insert sale items and update stock
        for (const item of items) {
            await env.DB.prepare(
                'INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)'
            ).bind(saleId, item.product_id, item.quantity, item.price).run();

            await env.DB.prepare(
                'UPDATE products SET stock = stock - ? WHERE id = ?'
            ).bind(item.quantity, item.product_id).run();
        }

        return new Response(JSON.stringify({
            success: true,
            sale_id: saleId,
            created_at: timestamp
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
