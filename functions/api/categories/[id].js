export async function onRequestPut(context) {
    const { request, env, params } = context;
    const id = params.id;

    try {
        const body = await request.json();
        const { name, description } = body;

        if (!name) {
            return new Response(JSON.stringify({ error: 'Name is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        await env.DB.prepare(
            'UPDATE categories SET name = ?, description = ? WHERE id = ?'
        ).bind(name, description || null, id).run();

        return new Response(JSON.stringify({
            success: true,
            message: 'Category updated successfully'
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
            'DELETE FROM categories WHERE id = ?'
        ).bind(id).run();

        return new Response(JSON.stringify({
            success: true,
            message: 'Category deleted successfully'
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
