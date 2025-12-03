import bcrypt from 'bcryptjs';

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
                'SELECT COUNT(*) as total FROM users'
            ).first();

            const { results } = await env.DB.prepare(
                'SELECT id, username, role, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?'
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
                'SELECT id, username, role, created_at FROM users ORDER BY created_at DESC'
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
        const { username, password, role } = await request.json();

        // Check if user exists
        const { results: existing } = await env.DB.prepare(
            'SELECT id FROM users WHERE username = ?'
        ).bind(username).all();

        if (existing.length > 0) {
            return new Response(JSON.stringify({ error: 'Username already exists' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Hash password with bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        await env.DB.prepare(
            'INSERT INTO users (username, password, role) VALUES (?, ?, ?)'
        ).bind(username, hashedPassword, role || 'cashier').run();

        return new Response(JSON.stringify({ success: true }), {
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
