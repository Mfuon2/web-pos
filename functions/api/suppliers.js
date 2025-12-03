// GET /api/suppliers - Fetch all suppliers
// POST /api/suppliers - Create a new supplier

export async function onRequestGet(context) {
    const { env, request } = context;
    const url = new URL(request.url);
    const pageParam = url.searchParams.get('page');
    const limitParam = url.searchParams.get('limit');

    try {
        if (pageParam) {
            const page = parseInt(pageParam) || 1;
            const limit = parseInt(limitParam) || 20;
            const offset = (page - 1) * limit;

            const { total } = await env.DB.prepare(
                'SELECT COUNT(*) as total FROM suppliers'
            ).first();

            const { results } = await env.DB.prepare(
                'SELECT * FROM suppliers ORDER BY name ASC LIMIT ? OFFSET ?'
            ).bind(limit, offset).all();

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
            const { results } = await env.DB.prepare(
                'SELECT * FROM suppliers ORDER BY name ASC'
            ).all();

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
        const { name, contact_person, phone, email, address } = body;

        const result = await env.DB.prepare(
            'INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?)'
        ).bind(name, contact_person || null, phone || null, email || null, address || null).run();

        return new Response(JSON.stringify({
            success: true,
            id: result.meta.last_row_id
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
