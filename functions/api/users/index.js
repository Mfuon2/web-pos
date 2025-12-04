import bcrypt from 'bcryptjs'
import { getDb } from '../../../drizzle/db'
import { users } from '../../../drizzle/schema'
import { count, desc, eq } from 'drizzle-orm'

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

            const [{ total }] = await db.select({ total: count() }).from(users);
            const results = await db.select({
                id: users.id,
                username: users.username,
                role: users.role,
                createdAt: users.createdAt
            }).from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);

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
            const results = await db.select({
                id: users.id,
                username: users.username,
                role: users.role,
                createdAt: users.createdAt
            }).from(users).orderBy(desc(users.createdAt));

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
        const { username, password, role } = await request.json();

        // Check if user exists
        const existing = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).get();

        if (existing) {
            return new Response(JSON.stringify({ error: 'Username already exists' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Hash password with bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        await db.insert(users).values({
            username,
            password: hashedPassword,
            role: role || 'cashier'
        });

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
