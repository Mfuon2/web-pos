export async function onRequestPut(context) {
    const { request, env, params } = context;
    const id = params.id;

    try {
        const body = await request.json();
        const { category, amount, description } = body;

        await env.DB.prepare(
            'UPDATE expenses SET category = ?, amount = ?, description = ? WHERE id = ?'
        ).bind(category, amount, description, id).run();

        return new Response(JSON.stringify({
            success: true,
            message: 'Expense updated successfully'
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

export async function onRequestDelete(context) {
    const { env, params } = context;
    const id = params.id;

    try {
        await env.DB.prepare(
            'DELETE FROM expenses WHERE id = ?'
        ).bind(id).run();

        return new Response(JSON.stringify({
            success: true,
            message: 'Expense deleted successfully'
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
