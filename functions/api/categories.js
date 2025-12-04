import { getDb } from '../../drizzle/db'
import { categories } from '../../drizzle/schema'
import { asc, count, sql } from 'drizzle-orm'

export async function onRequestGet(context) {
    const { env, request } = context;
    const url = new URL(request.url);
    const pageParam = url.searchParams.get('page');
    const limitParam = url.searchParams.get('limit');

    try {
        const db = getDb(env);

        if (pageParam) {
            const page = parseInt(pageParam) || 1;
            const limit = parseInt(limitParam) || 20;
            const offset = (page - 1) * limit;

            const [{ total }] = await db.select({ total: count() }).from(categories);
            const results = await db.select().from(categories).orderBy(asc(categories.name)).limit(limit).offset(offset);

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
            const results = await db.select().from(categories).orderBy(asc(categories.name));

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
        const db = getDb(env);
        const body = await request.json();
        const { name, description } = body;

        if (!name) {
            return new Response(JSON.stringify({ error: 'Name is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const result = await db.insert(categories).values({
            name,
            description: description || null
        }).returning({ id: categories.id });

        return new Response(JSON.stringify({
            success: true,
            id: result[0].id,
            message: 'Category created successfully'
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
