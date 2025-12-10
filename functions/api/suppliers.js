import { getNairobiTimestamp } from '../utils/timezone.js'
import { getDb } from '../../drizzle/db'
import { suppliers } from '../../drizzle/schema'
import { asc, count } from 'drizzle-orm'

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

            const [{ total }] = await db.select({ total: count() }).from(suppliers);
            const results = await db.select().from(suppliers).orderBy(asc(suppliers.name)).limit(limit).offset(offset);

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
            const results = await db.select().from(suppliers).orderBy(asc(suppliers.name));

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
        const { name, contact_person, phone, email, address } = body;

        const result = await db.insert(suppliers).values({
            name,
            contactPerson: contact_person || null,
            phone: phone || null,
            email: email || null,
            address: address || null,
            createdAt: getNairobiTimestamp()
        }).returning({ id: suppliers.id });

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
