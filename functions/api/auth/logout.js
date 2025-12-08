import { getDb } from '../../../drizzle/db'
import { users } from '../../../drizzle/schema'
import { eq } from 'drizzle-orm'
import { getTokenFromRequest, validateSession } from '../../utils/auth.js'

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const db = getDb(env);

        // Get user from token
        const token = getTokenFromRequest(request);
        const session = await validateSession(token, env);

        if (session && session.userId) {
            // Clear last_seen_at to mark user as offline
            await db.update(users)
                .set({ lastSeenAt: null })
                .where(eq(users.id, session.userId));
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
