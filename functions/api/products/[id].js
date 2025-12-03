export async function onRequestPut(context) {
    const { request, env, params } = context;
    const id = params.id;

    try {
        const body = await request.json();
        const { name, price, stock, barcode, category, cost } = body;

        await env.DB.prepare(`
      UPDATE products 
      SET name = ?, price = ?, stock = ?, barcode = ?, category = ?, cost = ?
      WHERE id = ?
    `).bind(name, price, stock, barcode, category, cost, id).run();

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestDelete(context) {
    const { env, params } = context;
    const id = params.id;

    try {
        // Soft delete: Set deleted_at timestamp instead of removing the row
        await env.DB.prepare(
            'UPDATE products SET deleted_at = datetime("now") WHERE id = ?'
        ).bind(id).run();

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
