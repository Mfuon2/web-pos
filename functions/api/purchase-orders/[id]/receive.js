// PUT /api/purchase-orders/:id/receive - Mark purchase order as received

export async function onRequestPut(context) {
    const { request, env } = context;

    try {
        const url = new URL(request.url);
        const pathParts = url.pathname.split('/');
        const id = pathParts[pathParts.length - 2]; // Get ID before '/receive'

        // Update the purchase order status to received
        await env.DB.prepare(
            'UPDATE purchase_orders SET status = ?, received_at = datetime("now") WHERE id = ?'
        ).bind('received', id).run();

        return new Response(JSON.stringify({
            success: true,
            message: 'Purchase order marked as received'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
