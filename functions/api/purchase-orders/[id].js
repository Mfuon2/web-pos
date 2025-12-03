export async function onRequestDelete(context) {
    const { env, params } = context;
    const id = params.id;

    try {
        await env.DB.prepare(
            'DELETE FROM purchase_orders WHERE id = ?'
        ).bind(id).run();

        return new Response(JSON.stringify({
            success: true,
            message: 'Purchase order deleted successfully'
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
