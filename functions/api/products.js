import { getNairobiTimestamp } from '../utils/timezone.js'
import { getDb } from '../../drizzle/db'
import { products } from '../../drizzle/schema'
import { count, desc, lt } from 'drizzle-orm'

export async function onRequestGet(context) {
    const { env, request } = context;
    const url = new URL(request.url);
    const pageParam = url.searchParams.get('page');
    const limitParam = url.searchParams.get('limit');
    const lowStockParam = url.searchParams.get('low_stock');

    try {
        const db = getDb(env);

        if (pageParam) {
            const page = parseInt(pageParam) || 1;
            const limit = parseInt(limitParam) || 20;
            const offset = (page - 1) * limit;

            let countQuery = db.select({ total: count() }).from(products);
            let dataQuery = db.select().from(products).orderBy(desc(products.createdAt)).limit(limit).offset(offset);

            if (lowStockParam === 'true') {
                countQuery = countQuery.where(lt(products.stock, 1));
                dataQuery = db.select().from(products).where(lt(products.stock, 1)).orderBy(desc(products.createdAt)).limit(limit).offset(offset);
            }

            const [{ total }] = await countQuery;
            const results = await dataQuery;

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
            let query = db.select().from(products).orderBy(desc(products.createdAt));

            if (lowStockParam === 'true') {
                query = query.where(lt(products.stock, 1));
            }

            const results = await query;

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
            cost: cost || 0,
            createdAt: getNairobiTimestamp()
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
