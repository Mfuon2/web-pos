import bcrypt from 'bcryptjs';

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { username, password } = await request.json();

        const { results } = await env.DB.prepare(
            'SELECT * FROM users WHERE username = ?'
        ).bind(username).all();

        if (results.length === 0) {
            return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const user = results[0];

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

        return new Response(JSON.stringify({
            success: true,
            user: userWithoutPassword
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
