import { getDb } from '../../drizzle/db'
import { products } from '../../drizzle/schema'
import { count, desc } from 'drizzle-orm'

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

            const [{ total }] = await db.select({ total: count() }).from(products);
            const results = await db.select().from(products).orderBy(desc(products.createdAt)).limit(limit).offset(offset);

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
            const results = await db.select().from(products).orderBy(desc(products.createdAt));

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
        const { name, price, stock, barcode, category, cost } = body;

        const result = await db.insert(products).values({
            name,
            price,
            stock,
            barcode,
            category: category || null,
            cost: cost || 0
        }).returning({ id: products.id });

        return new Response(JSON.stringify({
            success: true,
            id: result[0].id
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
