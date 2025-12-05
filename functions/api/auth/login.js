import bcrypt from 'bcryptjs'
import { getDb } from '../../../drizzle/db'
import { users } from '../../../drizzle/schema'
import { eq } from 'drizzle-orm'
import { createSession } from '../../utils/auth.js'

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const db = getDb(env);
        const { username, password } = await request.json();

        const user = await db.select().from(users).where(eq(users.username, username)).get();

        if (!user) {
            return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check if password is hashed (bcrypt hashes start with $2)
        let passwordValid = false;
        if (user.password.startsWith('$2')) {
            // Verify bcrypt hash
            passwordValid = await bcrypt.compare(password, user.password);
        } else {
            // Fallback: plain text comparison for migration period
            passwordValid = password === user.password;
        }

        if (!passwordValid) {
            return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Don't return the password
        const { password: _, ...userWithoutPassword } = user;

        // Create session and get token
        const token = await createSession(userWithoutPassword, env);

        return new Response(JSON.stringify({
            success: true,
            user: userWithoutPassword,
            token: token
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
