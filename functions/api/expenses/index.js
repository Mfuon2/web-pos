import { getNairobiTimestamp } from '../../utils/timezone.js'
import { getDb } from '../../../drizzle/db'
import { expenses } from '../../../drizzle/schema'
import { between, count, desc, sql } from 'drizzle-orm'

export async function onRequestGet(context) {
    const { env, request } = context;

    try {
        const db = getDb(env);
        const url = new URL(request.url);
        const startDate = url.searchParams.get('start_date');
        const endDate = url.searchParams.get('end_date');
        const pageParam = url.searchParams.get('page');
        const limitParam = url.searchParams.get('limit');

        let query = db.select().from(expenses);
        let countQuery = db.select({ total: count() }).from(expenses);

        // Apply date filter if provided
        if (startDate && endDate) {
            query = query.where(between(expenses.createdAt, startDate, endDate));
            countQuery = countQuery.where(between(expenses.createdAt, startDate, endDate));
        }

        query = query.orderBy(desc(expenses.createdAt));

        if (pageParam) {
            const page = parseInt(pageParam) || 1;
            const limit = parseInt(limitParam) || 20;
            const offset = (page - 1) * limit;

            const [{ total }] = await countQuery;
            const results = await query.limit(limit).offset(offset);

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
        const { category, amount, description, createdAt } = body;

        const result = await db.insert(expenses).values({
            category,
            amount,
            description,
            createdAt: createdAt || getNairobiTimestamp()
        }).returning({ id: expenses.id });

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
