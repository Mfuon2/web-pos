import bcrypt from 'bcryptjs';

export async function onRequestPut(context) {
    const { request, env, params } = context;
    const id = params.id;

    try {
        const { password, role } = await request.json();

        if (password) {
            // Hash the new password with bcrypt
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            await env.DB.prepare(
                'UPDATE users SET password = ? WHERE id = ?'
            ).bind(hashedPassword, id).run();
        }

        if (role) {
            await env.DB.prepare(
                'UPDATE users SET role = ? WHERE id = ?'
            ).bind(role, id).run();
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

export async function onRequestDelete(context) {
    const { env, params } = context;
    const id = params.id;

    try {
        // Prevent deleting the last admin or self (optional check, but good practice)
        // For simplicity, just delete
        await env.DB.prepare(
            'DELETE FROM users WHERE id = ?'
        ).bind(id).run();

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
