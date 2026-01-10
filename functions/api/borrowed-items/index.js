
export async function onRequestGet(context) {
    const { env } = context;
    try {
        const { results } = await env.DB.prepare(`
      SELECT 
        bi.*,
        p.name as product_name,
        p.barcode as product_barcode
      FROM borrowed_items bi
      LEFT JOIN products p ON bi.product_id = p.id
      ORDER BY bi.created_at DESC
    `).all();

        return Response.json(results);
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;
    try {
        const body = await request.json();
        const { product_id, quantity, borrowed_from, reason } = body;

        if (!product_id || !quantity || !borrowed_from) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { success } = await env.DB.prepare(`
      INSERT INTO borrowed_items (product_id, quantity, borrowed_from, reason)
      VALUES (?, ?, ?, ?)
    `).bind(product_id, quantity, borrowed_from, reason).run();

        if (!success) {
            return Response.json({ error: 'Failed to create record' }, { status: 500 });
        }

        return Response.json({ success: true, message: 'Borrowed item recorded' }, { status: 201 });
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
}

export async function onRequestPut(context) {
    const { request, env } = context;
    try {
        const body = await request.json();
        const { id, borrowed_from, reason, status } = body;

        if (!id) {
            return Response.json({ error: 'Missing record ID' }, { status: 400 });
        }

        const { success } = await env.DB.prepare(`
        UPDATE borrowed_items 
        SET borrowed_from = ?, reason = ?, status = ?
        WHERE id = ?
      `).bind(borrowed_from, reason, status, id).run();

        if (!success) {
            return Response.json({ error: 'Failed to update record' }, { status: 500 });
        }

        return Response.json({ success: true, message: 'Record updated' }, { status: 200 });
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
}
