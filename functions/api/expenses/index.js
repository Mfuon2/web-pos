// GET /api/expenses - Fetch all expenses
// POST /api/expenses - Create a new expense

export async function onRequestGet(context) {
    const { env, request } = context;

    try {
        const url = new URL(request.url);
        const startDate = url.searchParams.get('start_date');
        const endDate = url.searchParams.get('end_date');
        const pageParam = url.searchParams.get('page');
        const limitParam = url.searchParams.get('limit');

        let query = 'SELECT * FROM expenses';
        const params = [];
        let countQuery = 'SELECT COUNT(*) as total FROM expenses';
        const countParams = [];

        if (startDate && endDate) {
            const whereClause = ' WHERE created_at BETWEEN ? AND ?';
            query += whereClause;
            countQuery += whereClause;
            params.push(startDate, endDate);
            countParams.push(startDate, endDate);
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
        const { category, amount, description } = body;

        const result = await env.DB.prepare(
            'INSERT INTO expenses (category, amount, description, created_at) VALUES (?, ?, ?, datetime("now"))'
        ).bind(category, amount, description).run();

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

